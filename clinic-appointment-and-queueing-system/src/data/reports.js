import { supabase } from "./supabase";

/**
 * Fetch daily report statistics for a given date (default today).
 * Aggregates appointments, active queue entries, physician load, and wait times.
 */
export async function getDailyReport(dateString) {
  const selectedDate = dateString || new Date().toISOString().split("T")[0];

  // 1. Fetch queue entries for this date with appointment & doctor details
  const { data: queueEntries, error: queueError } = await supabase
    .from("queue_entries")
    .select(`
      queue_id,
      queue_no,
      queue_date,
      status,
      checked_in_at,
      called_at,
      completed_at,
      appointment_id,
      appointments (
        appointment_id,
        appointment_no,
        reason,
        status,
        doctor_id,
        doctors ( doctor_id, full_name, specialty )
      )
    `)
    .eq("queue_date", selectedDate);

  // 2. Fetch scheduled appointments where the slot is on this date
  const { data: scheduledAppts, error: apptError } = await supabase
    .from("appointments")
    .select(`
      appointment_id,
      appointment_no,
      status,
      doctor_id,
      created_at,
      doctors ( doctor_id, full_name, specialty ),
      schedules ( date )
    `);

  // Filter scheduled appointments matching selected date (using schedule date or created_at)
  const apptsForDate = (scheduledAppts || []).filter((appt) => {
    if (appt.schedules?.date === selectedDate) return true;
    if (!appt.schedules && appt.created_at?.startsWith(selectedDate)) return true;
    return false;
  });

  // 3. Count status accurately across queue entries and scheduled appointments
  const statusCounts = {
    Booked: 0,
    "Checked-in": 0,
    "Now Serving": 0,
    Completed: 0,
    Cancelled: 0,
    "No-show": 0,
  };

  const doctorCounts = {};
  const processedApptIds = new Set();

  // A. Count from queue entries (reflects live clinic attendance for selectedDate)
  queueEntries?.forEach((entry) => {
    if (entry.appointment_id) processedApptIds.add(entry.appointment_id);

    // Map Waiting in queue to Checked-in status category
    const status = entry.status === "Waiting" ? "Checked-in" : entry.status;
    if (statusCounts[status] !== undefined) {
      statusCounts[status]++;
    }

    const docName = entry.appointments?.doctors?.full_name || "General Consultation";
    doctorCounts[docName] = (doctorCounts[docName] || 0) + 1;
  });

  // B. Count scheduled appointments for today that are not yet in the queue (e.g. still Booked or Cancelled)
  apptsForDate.forEach((appt) => {
    if (!processedApptIds.has(appt.appointment_id)) {
      if (statusCounts[appt.status] !== undefined) {
        statusCounts[appt.status]++;
      } else {
        statusCounts.Booked++;
      }

      const docName = appt.doctors?.full_name || "General Consultation";
      doctorCounts[docName] = (doctorCounts[docName] || 0) + 1;
      processedApptIds.add(appt.appointment_id);
    }
  });

  // 4. Compute average waiting time (minutes from checked_in_at to called_at)
  let totalWaitMinutes = 0;
  let waitCount = 0;

  queueEntries?.forEach((entry) => {
    if (entry.checked_in_at && entry.called_at) {
      const checkInTime = new Date(entry.checked_in_at).getTime();
      const calledTime = new Date(entry.called_at).getTime();
      const diffMinutes = Math.max(0, (calledTime - checkInTime) / 60000);
      totalWaitMinutes += diffMinutes;
      waitCount++;
    }
  });

  const avgWaitMinutes = waitCount > 0 ? Math.round(totalWaitMinutes / waitCount) : 0;
  const totalAppointments = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  return {
    data: {
      date: selectedDate,
      totalAppointments,
      totalQueueEntries: queueEntries?.length || 0,
      statusCounts,
      doctorCounts,
      avgWaitMinutes,
    },
    error: null,
  };
}

/**
 * Fetch recent SMS audit logs for reports and staff inspection.
 */
export async function getRecentSmsLogs(limit = 10) {
  const { data, error } = await supabase
    .from("sms_logs")
    .select(`
      sms_id,
      mobile_no,
      message,
      provider_status,
      sent_at,
      appointment_id,
      appointments ( appointment_no )
    `)
    .order("sent_at", { ascending: false })
    .limit(limit);

  return { data: data || [], error };
}
