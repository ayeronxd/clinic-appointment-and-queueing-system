import { createClient } from "@supabase/supabase-js";
import { supabase } from "./supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Fetch all staff accounts (admin view).
 */
export async function getStaffAccounts() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .in("role", ["staff", "admin"])
    .order("full_name");

  return { data, error };
}

/**
 * Create a new staff account (admin action).
 * Uses an isolated auth client (persistSession: false) so the current admin stays logged in.
 */
export async function createStaffAccount({ email, password, fullName, mobileNo, role }) {
  const targetRole = role || "staff";
  const cleanEmail = email.trim().toLowerCase();

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { data: authData, error: authError } = await authClient.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      data: {
        full_name: fullName,
        mobile_no: mobileNo,
        role: targetRole,
      },
    },
  });

  // If already registered, promote existing account to staff/admin directly
  if (authError) {
    if (authError.message?.toLowerCase().includes("already registered") || authError.status === 422) {
      // 1. Try secure RPC function first
      const { data: rpcData, error: rpcErr } = await supabase.rpc("admin_set_user_role", {
        target_email: cleanEmail,
        new_role: targetRole,
      });

      if (!rpcErr && rpcData) return { data: rpcData, error: null };

      // 2. Direct table update fallback
      const { data: promoData, error: promoError } = await supabase
        .from("profiles")
        .update({
          role: targetRole,
          full_name: fullName,
          mobile_no: mobileNo,
          is_active: true,
        })
        .eq("email", cleanEmail)
        .select()
        .maybeSingle();

      if (promoError) return { data: null, error: promoError };
      return { data: promoData, error: null };
    }
    return { data: null, error: authError };
  }

  // Ensure role is assigned on the profile
  const userId = authData?.user?.id;
  if (userId) {
    // 1. Try secure RPC function
    const { data: rpcData, error: rpcErr } = await supabase.rpc("admin_set_user_role", {
      target_email: cleanEmail,
      new_role: targetRole,
    });

    if (!rpcErr && rpcData) return { data: rpcData, error: null };

    // 2. Direct table update fallback
    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({
        role: targetRole,
        full_name: fullName,
        mobile_no: mobileNo,
        is_active: true,
      })
      .or(`user_id.eq.${userId},email.eq.${cleanEmail}`)
      .select()
      .maybeSingle();

    if (updateError) {
      console.warn("Direct update warning:", updateError);
    }

    return { data: updatedProfile || { user_id: userId }, error: null };
  }

  return { data: authData, error: null };
}

/**
 * Deactivate a staff account (admin action — soft delete).
 */
export async function deactivateStaffAccount(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ is_active: false })
    .eq("user_id", userId)
    .select()
    .single();

  return { data, error };
}

/**
 * Reactivate a staff account.
 */
export async function activateStaffAccount(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ is_active: true })
    .eq("user_id", userId)
    .select()
    .single();

  return { data, error };
}

/**
 * Update a profile (used for editing own profile or admin editing staff).
 */
export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single();

  return { data, error };
}
