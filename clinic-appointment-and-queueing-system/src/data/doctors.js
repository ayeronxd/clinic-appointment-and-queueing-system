import { supabase } from "./supabase";

/**
 * Fetch all active doctors.
 */
export async function getDoctors() {
  const { data, error } = await supabase
    .from("doctors")
    .select("*")
    .eq("is_active", true)
    .order("full_name");

  return { data, error };
}

/**
 * Fetch a single doctor by ID.
 */
export async function getDoctorById(doctorId) {
  const { data, error } = await supabase
    .from("doctors")
    .select("*")
    .eq("doctor_id", doctorId)
    .single();

  return { data, error };
}

/**
 * Create a new doctor (admin action).
 */
export async function createDoctor({ fullName, specialty }) {
  const { data, error } = await supabase
    .from("doctors")
    .insert({ full_name: fullName, specialty, is_active: true })
    .select()
    .single();

  return { data, error };
}

/**
 * Update a doctor's details (admin action).
 */
export async function updateDoctor(doctorId, updates) {
  const { data, error } = await supabase
    .from("doctors")
    .update(updates)
    .eq("doctor_id", doctorId)
    .select()
    .single();

  return { data, error };
}

/**
 * Deactivate a doctor (admin action — soft delete).
 */
export async function deactivateDoctor(doctorId) {
  const { data, error } = await supabase
    .from("doctors")
    .update({ is_active: false })
    .eq("doctor_id", doctorId)
    .select()
    .single();

  return { data, error };
}
