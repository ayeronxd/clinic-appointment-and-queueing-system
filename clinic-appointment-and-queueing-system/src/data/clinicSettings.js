import { supabase } from "./supabase";

const STORAGE_KEY = "clinic_operating_mode";
let currentMode = (typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null) || "auto";
let statusChannel = null;
const listeners = new Set();

export function getOperatingMode() {
  return currentMode;
}

export function setOperatingMode(newMode) {
  currentMode = newMode;
  try {
    localStorage.setItem(STORAGE_KEY, newMode);
  } catch {}

  // 1. Cross-tab sync in the browser
  try {
    const bc = new BroadcastChannel("clinic_mode_channel");
    bc.postMessage({ mode: newMode });
    bc.close();
  } catch {}

  // 2. Real-time broadcast to all connected patient and staff clients
  if (statusChannel) {
    statusChannel.send({
      type: "broadcast",
      event: "mode_change",
      payload: { mode: newMode, timestamp: Date.now() },
    });
  }

  notifyListeners(newMode);
}

function notifyListeners(mode) {
  listeners.forEach((fn) => {
    try {
      fn(mode);
    } catch (e) {
      console.error(e);
    }
  });
}

export function subscribeToClinicMode(callback) {
  listeners.add(callback);
  callback(currentMode);

  // Initialize Realtime broadcast listener if not already active
  if (!statusChannel) {
    statusChannel = supabase.channel("clinic-status-channel", {
      config: { broadcast: { self: false } },
    });

    statusChannel
      .on("broadcast", { event: "mode_change" }, ({ payload }) => {
        if (payload?.mode && payload.mode !== currentMode) {
          currentMode = payload.mode;
          try {
            localStorage.setItem(STORAGE_KEY, payload.mode);
          } catch {}
          notifyListeners(currentMode);
        }
      })
      .subscribe();
  }

  // Cross-tab sync listener
  let bc;
  try {
    bc = new BroadcastChannel("clinic_mode_channel");
    bc.onmessage = (event) => {
      if (event.data?.mode && event.data.mode !== currentMode) {
        currentMode = event.data.mode;
        notifyListeners(currentMode);
      }
    };
  } catch {}

  return () => {
    listeners.delete(callback);
    if (bc) {
      try {
        bc.close();
      } catch {}
    }
  };
}
