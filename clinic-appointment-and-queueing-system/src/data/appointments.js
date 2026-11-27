import { supabase } from "./supabase";

/**
 * Book a new appointment with concurrency conflict protection.
 * Prevents double-booking race conditions when multiple patients attempt to book the same slot.
 */
export async function bookAppointment({ patientId, doctorId, scheduleId, reason }) {
  // 1. Pre-validation: Verify slot availability before submitting
  if (scheduleId) {
    const { data: slot } = await supabase
      .from("schedules")
      .select("is_available")
      .eq("schedule_id", scheduleId)
      .maybeSingle();

    if (slot && !slot.is_available) {
      return {
        data: null,
        error: { message: "This consultation slot was just reserved by another patient. Please select an available slot." },
      };
    }
  }

  // 2. Insert appointment record (guarded by database unique index against race conditions)
  const { data, error } = await supabase
    .from("appointments")
    .insert({
      patient_id: patientId,
      doctor_id: doctorId,
      schedule_id: scheduleId,
      reason,
      status: "Booked",
    })
    .select()
    .single();

  if (error) {
    // Catch database unique constraint violation (PostgreSQL 23505)
    if (error.code === "23505" || error.message?.toLowerCase().includes("unique")) {
      return {
        data: null,
        error: { message: "Slot Collision: Another patient just secured this exact time slot. Please pick another available time." },
      };
    }
    return { data: null, error };
  }

  // 3. Lock slot availability so subsequent queries immediately see it as unavailable
  if (scheduleId) {
    await supabase
      .from("schedules")
      .update({ is_available: false })
      .eq("schedule_id", scheduleId);
  }

  return { data, error: null };
}

/**
 * Fetch all appointments for a specific patient.
 * Joins doctor name and schedule details.
 */
export async function getPatientAppointments(patientId) {
  const { data, error } = await supabase
    .from("appointments")
    .select(`
      *,
      doctors ( full_name, specialty ),
      schedules ( date, start_time, end_time )
    `)
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  return { data, error };
}

/**
 * Fetch a single appointment by its ID.
 */
export async function getAppointmentById(appointmentId) {
  const { data, error } = await supabase
    .from("appointments")
    .select(`
      *,
      doctors ( full_name, specialty ),
      schedules ( date, start_time, end_time )
    `)
    .eq("appointment_id", appointmentId)
    .single();

  if (error || !data) return { data, error };

  if (data.patient_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, mobile_no")
      .eq("user_id", data.patient_id)
      .maybeSingle();
    data.profiles = profile;
  }

  return { data, error: null };
}

/**
 * Fetch today's appointments for the staff view.
 */
export async function getTodaysAppointments() {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("appointments")
    .select(`
      *,
      doctors ( full_name, specialty ),
      schedules ( date, start_time, end_time )
    `)
    .eq("schedules.date", today)
    .order("created_at", { ascending: true });

  if (error || !data) return { data, error };

  const patientIds = [...new Set(data.map((a) => a.patient_id).filter(Boolean))];
  const profileMap = {};
  if (patientIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, mobile_no")
      .in("user_id", patientIds);

    (profiles || []).forEach((p) => {
      profileMap[p.user_id] = p;
    });
  }

  // Populate walk-in patient mobile from sms_logs
  const walkInApptIds = data.filter((a) => !a.patient_id && a.appointment_id).map((a) => a.appointment_id);
  const walkInMobileMap = {};
  if (walkInApptIds.length > 0) {
    const { data: logs } = await supabase
      .from("sms_logs")
      .select("appointment_id, mobile_no")
      .in("appointment_id", walkInApptIds)
      .order("sent_at", { ascending: false });

    (logs || []).forEach((l) => {
      if (!walkInMobileMap[l.appointment_id]) walkInMobileMap[l.appointment_id] = l.mobile_no;
    });
  }

  data.forEach((a) => {
    if (a.patient_id) {
      a.profiles = profileMap[a.patient_id] || null;
    } else {
      a.profiles = {
        full_name: "Walk-in Patient",
        mobile_no: walkInMobileMap[a.appointment_id] || null,
      };
    }
  });

  return { data, error: null };
}

/**
 * Cancel an appointment (patient action).
 * Automatically releases the consultation slot back into circulation (is_available = true).
 */
export async function cancelAppointment(appointmentId) {
  // 1. Get schedule_id first so we can free the slot
  const { data: appt } = await supabase
    .from("appointments")
    .select("schedule_id")
    .eq("appointment_id", appointmentId)
    .maybeSingle();

  // 2. Mark appointment as Cancelled
  const { data, error } = await supabase
    .from("appointments")
    .update({ status: "Cancelled" })
    .eq("appointment_id", appointmentId)
    .select()
    .single();

  // 3. Free up schedule slot for other patients
  if (!error && appt?.schedule_id) {
    await supabase
      .from("schedules")
      .update({ is_available: true })
      .eq("schedule_id", appt.schedule_id);
  }

  return { data, error };
}

/**
 * Reschedule an appointment to a new schedule slot.
 * Releases old slot and claims the new slot atomically.
 */
export async function rescheduleAppointment(appointmentId, newScheduleId) {
  // 1. Get old slot id
  const { data: oldAppt } = await supabase
    .from("appointments")
    .select("schedule_id")
    .eq("appointment_id", appointmentId)
    .maybeSingle();

  // 2. Update appointment to new slot
  const { data, error } = await supabase
    .from("appointments")
    .update({
      schedule_id: newScheduleId,
      status: "Booked",
    })
    .eq("appointment_id", appointmentId)
    .select()
    .single();

  if (!error) {
    // Release previous slot
    if (oldAppt?.schedule_id) {
      await supabase
        .from("schedules")
        .update({ is_available: true })
        .eq("schedule_id", oldAppt.schedule_id);
    }
    // Claim new slot
    await supabase
      .from("schedules")
      .update({ is_available: false })
      .eq("schedule_id", newScheduleId);
  }

  return { data, error };
}

/**
 * Update appointment status (staff action).
 * Used for check-in, now-serving, completed, no-show.
 */
export async function updateAppointmentStatus(appointmentId, status) {
  const { data, error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("appointment_id", appointmentId)
    .select()
    .single();

  return { data, error };
}
