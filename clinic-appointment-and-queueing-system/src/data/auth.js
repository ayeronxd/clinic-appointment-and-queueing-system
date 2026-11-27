import { supabase } from "./supabase";

/**
 * Maps Supabase auth error codes and messages into clear, non-confusing messages for users.
 */
export function formatAuthError(error) {
  if (!error) return "";
  const msg = error.message?.toLowerCase() || "";
  const status = error.status;

  if (msg.includes("email not confirmed")) {
    return "Your email address has not been verified yet. Please check your inbox for the confirmation link before signing in.";
  }
  if (msg.includes("invalid login credentials")) {
    return "Incorrect email or password. Please verify your credentials or click 'Forgot password?'.";
  }
  if (msg.includes("user already registered") || msg.includes("already exists")) {
    return "An account with this email address already exists. Please sign in instead.";
  }
  if (msg.includes("password should be at least")) {
    return "Password is too short. It must be at least 6 characters long.";
  }
  if (msg.includes("rate limit") || msg.includes("too many requests") || status === 429) {
    return "Too many attempts. For your security, please wait a few moments before trying again.";
  }
  if (msg.includes("user not found")) {
    return "No account exists with this email address. Please check your spelling or create an account.";
  }
  if (msg.includes("network") || msg.includes("failed to fetch")) {
    return "Unable to connect to the authentication service. Please check your internet connection.";
  }

  return error.message || "An authentication error occurred. Please try again.";
}

/**
 * Register a new patient account.
 * Proactively checks database to prevent silent duplicate-email passes.
 */
export async function signUp({ email, password, fullName, mobileNo, address }) {
  const cleanEmail = email.trim();

  // 1. Proactively check database to prevent silent duplicate registration
  try {
    const { data: status } = await supabase.rpc("check_email_status", {
      lookup_email: cleanEmail,
    });
    if (status?.exists) {
      return {
        data: null,
        error: { message: "An account with this email already exists. Please sign in instead." },
      };
    }
  } catch (_) {
    // If RPC is not yet created in Supabase, fallback to client-side identity check below
  }

  // 2. Create the auth user with user_metadata
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      data: {
        full_name: fullName,
        mobile_no: mobileNo,
        role: "patient",
      },
    },
  });

  if (authError) return { data: null, error: authError };

  // 3. Supabase identity check (detects duplicate email if RPC was bypassed)
  if (authData?.user && Array.isArray(authData.user.identities) && authData.user.identities.length === 0) {
    return {
      data: null,
      error: { message: "An account with this email already exists. Please sign in instead." },
    };
  }

  // 4. Insert profile record if user ID is available
  if (authData?.user?.id) {
    const { error: profileError } = await supabase.from("profiles").insert({
      user_id: authData.user.id,
      full_name: fullName,
      mobile_no: mobileNo,
      email: cleanEmail,
      role: "patient",
      address,
      is_active: true,
    });

    if (profileError) {
      console.warn("Profile insert notice:", profileError.message);
    }
  }

  return { data: authData, error: null };
}

/**
 * Log in with email and password.
 * If Supabase returns generic error, queries database to provide accurate explanation.
 */
export async function signIn({ email, password }) {
  const cleanEmail = email.trim();

  // 1. Attempt login
  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (!error) return { data, error: null };

  // 2. Fetch directly from database for high-precision diagnostic messages
  try {
    const { data: status } = await supabase.rpc("check_email_status", {
      lookup_email: cleanEmail,
    });

    if (status) {
      if (!status.exists) {
        return {
          data: null,
          error: { message: "No account found with this email. Please check your email spelling or register first." },
        };
      }
      if (!status.confirmed) {
        return {
          data: null,
          error: { message: "Your email address has not been confirmed yet. Please verify your email before logging in." },
        };
      }
      if (status.is_active === false) {
        return {
          data: null,
          error: { message: "This account has been deactivated. Please contact clinic staff." },
        };
      }
      return {
        data: null,
        error: { message: "Incorrect password for this email. Please verify your password or click 'Forgot password?'." },
      };
    }
  } catch (_) {
    // If RPC is not created, fallback to standard error
  }

  return { data: null, error };
}

/**
 * Send password reset email link.
 */
export async function resetPasswordForEmail(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login`,
  });
  return { data, error };
}

/**
 * Log out the current user.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Get the currently logged-in user (from the session).
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
}

/**
 * Fetch the profile row for a given user ID.
 */
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  return { data, error };
}

/**
 * Listen to auth state changes (login, logout, token refresh).
 */
export function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      callback(session);
    }
  );
  return subscription;
}
