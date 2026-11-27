import { supabase } from "./supabase";

export function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Add a patient to queue on check-in. Prevents duplicates.
export async function addToQueue(appointmentId) {
  const localToday = getTodayDateString();
  const utcToday = new Date().toISOString().split("T")[0];

  if (appointmentId) {
    const { data: existing } = await supabase
      .from("queue_entries")
      .select("*")
      .eq("appointment_id", appointmentId)
      .in("queue_date", [localToday, utcToday])
      .maybeSingle();

    if (existing) return { data: existing, error: null, alreadyQueued: true };
  }

  const { data: maxData } = await supabase
    .from("queue_entries")
    .select("queue_no")
    .in("queue_date", [localToday, utcToday])
    .order("queue_no", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextQueueNo = maxData ? maxData.queue_no + 1 : 1;

  const { data, error } = await supabase
    .from("queue_entries")
    .insert({
      appointment_id: appointmentId,
      queue_no: nextQueueNo,
      queue_date: localToday,
      status: "Waiting",
      checked_in_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error && (error.code === "23505" || error.message?.includes("idx_unique_today_queue_appointment")) && appointmentId) {
    const { data: fallback } = await supabase
      .from("queue_entries")
      .select("*")
      .eq("appointment_id", appointmentId)
      .in("queue_date", [localToday, utcToday])
      .maybeSingle();
    if (fallback) return { data: fallback, error: null, alreadyQueued: true };
  }

  return { data, error };
}

// Enriches queue entries with patient profile & walk-in mobile details
async function enrichQueueEntries(entries) {
  if (!entries || entries.length === 0) return entries;

  const patientIds = [...new Set(entries.map((q) => q.appointments?.patient_id).filter(Boolean))];
  const profileMap = {};
  if (patientIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("user_id, full_name, mobile_no")
      .in("user_id", patientIds);
    (profs || []).forEach((p) => { profileMap[p.user_id] = p; });
  }

  const walkInIds = entries
    .filter((q) => q.appointments && !q.appointments.patient_id && q.appointment_id)
    .map((q) => q.appointment_id);

  const walkInMobileMap = {};
  if (walkInIds.length > 0) {
    const { data: logs } = await supabase
      .from("sms_logs")
      .select("appointment_id, mobile_no")
      .in("appointment_id", walkInIds)
      .order("sent_at", { ascending: false });

    (logs || []).forEach((l) => {
      if (!walkInMobileMap[l.appointment_id]) walkInMobileMap[l.appointment_id] = l.mobile_no;
    });
  }

  entries.forEach((q) => {
    if (q.appointments) {
      if (q.appointments.patient_id) {
        q.appointments.profiles = profileMap[q.appointments.patient_id] || null;
      } else {
        q.appointments.profiles = {
          full_name: "Walk-in Patient",
          mobile_no: walkInMobileMap[q.appointment_id] || null,
        };
      }
    }
  });

  return entries;
}

// Fetch today's queue with patient and physician details
export async function getTodaysQueue() {
  const localToday = getTodayDateString();
  const utcToday = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("queue_entries")
    .select(`
      *,
      appointments (
        appointment_id,
        appointment_no,
        patient_id,
        doctor_id,
        reason,
        doctors ( full_name, specialty )
      )
    `)
    .in("queue_date", [localToday, utcToday])
    .order("queue_no", { ascending: true });

  if (error || !data) {
    console.error("Queue fetch error:", error);
    return { data: [], error };
  }

  await enrichQueueEntries(data);
  return { data, error: null };
}

// Call next waiting patient (or next for specific doctor)
export async function callNextPatient(doctorId = null) {
  const localToday = getTodayDateString();
  const utcToday = new Date().toISOString().split("T")[0];

  const { data: waitingEntries, error: findError } = await supabase
    .from("queue_entries")
    .select("queue_id, appointment_id, appointments(doctor_id)")
    .in("queue_date", [localToday, utcToday])
    .eq("status", "Waiting")
    .order("queue_no", { ascending: true });

  if (findError || !waitingEntries || waitingEntries.length === 0) {
    return { data: null, error: findError || new Error("No waiting patients in queue.") };
  }

  let next = waitingEntries[0];
  if (doctorId && doctorId !== "all") {
    const docMatch = waitingEntries.find((w) => w.appointments?.doctor_id === doctorId);
    if (!docMatch) {
      return { data: null, error: new Error("No waiting patients found for the selected physician.") };
    }
    next = docMatch;
  }

  // Clinical Concurrency Guard: Ensure a doctor doesn't have 2 patients active simultaneously
  const targetDocId = next.appointments?.doctor_id;
  if (targetDocId) {
    const { data: busyEntries } = await supabase
      .from("queue_entries")
      .select("queue_id, queue_no, appointments(doctor_id, doctors(full_name))")
      .in("queue_date", [localToday, utcToday])
      .eq("status", "Now Serving");

    const busy = (busyEntries || []).find((b) => b.appointments?.doctor_id === targetDocId);
    if (busy) {
      const docName = busy.appointments?.doctors?.full_name ? `Dr. ${busy.appointments.doctors.full_name}` : "This physician";
      return {
        data: null,
        error: {
          code: "ACTIVE_CONSULTATION_IN_PROGRESS",
          message: `${docName} is currently consulting Ticket #${String(busy.queue_no).padStart(3, "0")}.`,
          activeQueueId: busy.queue_id,
          activeQueueNo: busy.queue_no,
          doctorName: docName,
        },
      };
    }
  }

  const { data, error } = await supabase
    .from("queue_entries")
    .update({
      status: "Now Serving",
      called_at: new Date().toISOString(),
    })
    .eq("queue_id", next.queue_id)
    .select(`
      *,
      appointments (
        appointment_id,
        appointment_no,
        patient_id,
        doctors ( full_name )
      )
    `)
    .single();

  if (error) return { data: null, error };

  await enrichQueueEntries([data]);

  if (data?.appointment_id) {
    await supabase
      .from("appointments")
      .update({ status: "Now Serving" })
      .eq("appointment_id", data.appointment_id);
  }

  return { data, error: null };
}

// Mark a queue entry as Completed
export async function markCompleted(queueId) {
  const { data: queueEntry, error } = await supabase
    .from("queue_entries")
    .update({
      status: "Completed",
      completed_at: new Date().toISOString(),
    })
    .eq("queue_id", queueId)
    .select("queue_id, appointment_id, status")
    .single();

  if (queueEntry?.appointment_id) {
    await supabase
      .from("appointments")
      .update({ status: "Completed" })
      .eq("appointment_id", queueEntry.appointment_id);
  }

  return { data: queueEntry, error };
}

// Mark a queue entry as No-show
export async function markNoShow(queueId) {
  const { data: queueEntry, error } = await supabase
    .from("queue_entries")
    .update({ status: "No-show" })
    .eq("queue_id", queueId)
    .select("queue_id, appointment_id, status")
    .single();

  if (queueEntry?.appointment_id) {
    await supabase
      .from("appointments")
      .update({ status: "No-show" })
      .eq("appointment_id", queueEntry.appointment_id);
  }

  return { data: queueEntry, error };
}

// Subscribe to real-time queue changes
export function subscribeToQueue(callback) {
  const channel = supabase
    .channel("queue-updates")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "queue_entries" },
      (payload) => callback(payload)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

export { getTodaysQueue as getTodayQueue, markCompleted as completeConsultation };
