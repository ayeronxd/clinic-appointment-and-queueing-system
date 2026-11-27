import { supabase } from "./supabase";

/**
 * Fetch available schedule slots for a specific doctor.
 * Only returns future, available slots.
 */
export async function getAvailableSlots(doctorId) {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("schedules")
    .select("*")
    .eq("doctor_id", doctorId)
    .eq("is_available", true)
    .gte("date", today)
    .order("date")
    .order("start_time");

  return { data, error };
}

/**
 * Fetch all schedules for a doctor (admin view — includes past and unavailable).
 */
export async function getDoctorSchedules(doctorId) {
  const { data, error } = await supabase
    .from("schedules")
    .select("*")
    .eq("doctor_id", doctorId)
    .order("date")
    .order("start_time");

  return { data, error };
}

/**
 * Create a new schedule slot for a doctor (admin action).
 */
export async function createSchedule({ doctorId, date, startTime, endTime }) {
  const { data, error } = await supabase
    .from("schedules")
    .insert({
      doctor_id: doctorId,
      date,
      start_time: startTime,
      end_time: endTime,
      is_available: true,
    })
    .select()
    .single();

  return { data, error };
}

/**
 * Update a schedule slot (admin action).
 */
export async function updateSchedule(scheduleId, updates) {
  const { data, error } = await supabase
    .from("schedules")
    .update(updates)
    .eq("schedule_id", scheduleId)
    .select()
    .single();

  return { data, error };
}

/**
 * Delete a schedule slot (admin action).
 */
export async function deleteSchedule(scheduleId) {
  const { error } = await supabase
    .from("schedules")
    .delete()
    .eq("schedule_id", scheduleId);

  return { error };
}

/**
 * Returns real-time clinic operating status based on Mon–Sat 8:00 AM – 5:00 PM,
 * with support for manual staff override ('auto' | 'open' | 'closed').
 */
export function getClinicOperatingStatus(now = new Date(), overrideMode = null) {
  const mode = overrideMode || (typeof window !== "undefined" ? localStorage.getItem("clinic_operating_mode") : null) || "auto";

  // Manual Staff Override: Force Open
  if (mode === "open") {
    return {
      isOpen: true,
      title: "Clinic Open",
      label: "Live & Serving",
      hint: "Staff manual session active",
      badgeText: "Live & Open • Staff Override",
      mode: "open",
    };
  }

  // Manual Staff Override: Force Closed
  if (mode === "closed") {
    return {
      isOpen: false,
      title: "Clinic Closed",
      label: "Clinic Paused / Closed",
      hint: "Consultations temporarily suspended by staff",
      badgeText: "Closed by Staff Override",
      mode: "closed",
    };
  }

  // Automatic Schedule Mode: Mon–Sat 8:00 AM – 5:00 PM
  const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = 8 * 60;   // 8:00 AM
  const closeMinutes = 17 * 60; // 5:00 PM (17:00)

  if (day === 0) {
    return {
      isOpen: false,
      title: "Clinic Closed",
      label: "Closed Today (Sunday)",
      hint: "Reopens Monday at 8:00 AM",
      badgeText: "Closed (Sunday) • Opens Mon 8 AM",
      mode: "auto",
    };
  }

  if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
    return {
      isOpen: true,
      title: "Lobby Open",
      label: "Live & Serving",
      hint: "Operating hours: 8:00 AM – 5:00 PM",
      badgeText: "Real-time Live Sync",
      mode: "auto",
    };
  }

  const isAfterHours = currentMinutes >= closeMinutes;
  const isSaturday = day === 6;

  return {
    isOpen: false,
    title: "Clinic Closed",
    label: "Closed (After Hours)",
    hint: isAfterHours && isSaturday
      ? "Reopens Monday at 8:00 AM"
      : isAfterHours
      ? "Reopens tomorrow at 8:00 AM"
      : "Opens today at 8:00 AM",
    badgeText: isAfterHours && isSaturday
      ? "Closed • Reopens Mon 8 AM"
      : "Closed • Reopens 8 AM",
    mode: "auto",
  };
}
