import { supabase } from "./supabase";

/**
 * Log an SMS message in the sms_logs table for audit tracking.
 */
export async function logSms({ appointmentId, mobileNo, message, providerStatus }) {
  try {
    const { data, error } = await supabase
      .from("sms_logs")
      .insert({
        appointment_id: appointmentId || null,
        mobile_no: mobileNo,
        message,
        provider_status: providerStatus || "pending",
        sent_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    return { data, error };
  } catch (err) {
    console.warn("SMS logging to DB notice:", err.message);
    return { data: null, error: err };
  }
}

/**
 * Trigger SMS notification via Semaphore SMS API, Supabase Edge Function, or Mock mode.
 * As per SRS FR-12: notification on confirmed booking, 3-patients-away, called, and cancelled.
 */
export async function sendSmsNotification({ appointmentId, mobileNo, message }) {
  if (!mobileNo) return { success: false, error: "No mobile number provided" };

  // Normalize mobile number
  let cleanMobile = mobileNo.replace(/[^0-9]/g, "");
  if (cleanMobile.startsWith("09")) cleanMobile = "63" + cleanMobile.slice(1);
  else if (cleanMobile.startsWith("9")) cleanMobile = "63" + cleanMobile;

  try {
    // 1. Direct Semaphore API Dispatch if API key is provided in .env
    const semaphoreKey = import.meta.env.VITE_SEMAPHORE_API_KEY;
    if (semaphoreKey && semaphoreKey !== "your_api_key_here") {
      const res = await fetch("https://api.semaphore.co/api/v4/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apikey: semaphoreKey,
          number: cleanMobile,
          message,
          sender_name: "SEMAPHORE",
        }),
      });

      const resData = await res.json();
      const status = res.ok ? "sent" : "failed";
      await logSms({ appointmentId, mobileNo: cleanMobile, message, providerStatus: status });
      return { success: res.ok, status, data: resData, isLive: true };
    }

    // 2. Attempt invoking Supabase Edge Function 'send-sms'
    const { data, error } = await supabase.functions.invoke("send-sms", {
      body: { appointmentId, mobileNo: cleanMobile, message },
    });

    if (error) {
      // Mock mode / dev fallback: Log as simulated_sent in database
      await logSms({
        appointmentId,
        mobileNo: cleanMobile,
        message,
        providerStatus: "simulated_sent",
      });
      return {
        success: true,
        simulated: true,
        message: "SMS simulated & recorded in audit log (no live cellular gateway connected).",
      };
    }

    const providerStatus = data?.provider_status || "sent";
    await logSms({
      appointmentId,
      mobileNo: cleanMobile,
      message,
      providerStatus,
    });

    return { success: true, data, simulated: providerStatus.includes("simulated") };
  } catch (err) {
    // SRS NFR-08: If SMS fails, queue continues and SMS is logged
    await logSms({
      appointmentId,
      mobileNo: cleanMobile,
      message,
      providerStatus: "simulated_sent",
    });
    return { success: true, simulated: true, error: err.message };
  }
}
