// @ts-nocheck
// Supabase Edge Function: send-sms (FR-12, NFR-05, NFR-08)
// Runs in Supabase Deno runtime (URL imports and Deno global are native in Edge Functions)
// Industry Standards: OWASP API Security, JWT Auth, In-memory Sliding Window Rate Limiting, Input Sanitization
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// In-memory Rate Limiting table (Sliding Window): IP/User -> timestamps[]
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_MAX = 5; // max 5 SMS requests
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // per 1 minute

function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(identifier) || [];
  // Remove timestamps outside the sliding window
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= RATE_LIMIT_MAX) {
    rateLimitMap.set(identifier, validTimestamps);
    return true;
  }

  validTimestamps.push(now);
  rateLimitMap.set(identifier, validTimestamps);
  return false;
}

function sanitizePhilippineMobile(mobile: string): string | null {
  const cleaned = mobile.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("63") && cleaned.length === 12) {
    return cleaned;
  }
  if (cleaned.startsWith("09") && cleaned.length === 11) {
    return "63" + cleaned.slice(1);
  }
  if (cleaned.startsWith("9") && cleaned.length === 10) {
    return "63" + cleaned;
  }
  return null;
}

serve(async (req: Request) => {
  // 1. CORS Preflight Handling
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 2. Authentication Verification (OWASP API Security - Broken Object Level Auth)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Rate Limiting Protection (Anti-Spam / Anti-Toll Fraud)
    const clientIdentifier = user.id;
    if (isRateLimited(clientIdentifier)) {
      return new Response(
        JSON.stringify({
          error: "Too Many Requests: Rate limit exceeded. Please wait 1 minute.",
          code: 429
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": "60"
          }
        }
      );
    }

    // 4. Body Parsing & Strict Schema Validation
    const body = await req.json();
    const { appointmentId, mobileNo, message } = body;

    if (!mobileNo || !message) {
      return new Response(
        JSON.stringify({ error: "Bad Request: 'mobileNo' and 'message' are required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize and validate mobile number
    const normalizedMobile = sanitizePhilippineMobile(mobileNo);
    if (!normalizedMobile) {
      return new Response(
        JSON.stringify({ error: "Validation Error: Invalid Philippine mobile number format (e.g., 09171234567)" }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Provider Dispatch (Semaphore SMS API / Mock Mode)
    const semaphoreApiKey = Deno.env.get("SEMAPHORE_API_KEY");
    let providerStatus = "simulated";
    let providerResponse = null;

    if (semaphoreApiKey && semaphoreApiKey !== "your_api_key_here") {
      // Production SMS Dispatch via Semaphore API
      const semResponse = await fetch("https://api.semaphore.co/api/v4/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apikey: semaphoreApiKey,
          number: normalizedMobile,
          message: message,
          sender_name: "SEMAPHORE"
        })
      });

      providerResponse = await semResponse.json();
      providerStatus = semResponse.ok ? "sent" : "failed";
    } else {
      // Mock / Dev Mode: simulates successful delivery without burning credits
      console.log(`[SMS-MOCK] To: ${normalizedMobile} | Message: ${message}`);
      providerStatus = "simulated_sent";
      providerResponse = { message_id: `MOCK-${Date.now()}`, recipient: normalizedMobile, status: "Delivered" };
    }

    // 6. Audit Logging in Database (FR-12 & NFR-08)
    if (appointmentId) {
      await supabase.from("sms_logs").insert({
        appointment_id: appointmentId,
        mobile_no: normalizedMobile,
        message: message,
        provider_status: providerStatus,
        sent_at: new Date().toISOString()
      });
    }

    // 7. Successful Response with Security Headers
    return new Response(
      JSON.stringify({
        success: providerStatus.includes("sent"),
        provider_status: providerStatus,
        recipient: normalizedMobile,
        details: providerResponse
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "X-Content-Type-Options": "nosniff"
        }
      }
    );
  } catch (error: any) {
    console.error("[send-sms] Internal error:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", message: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
