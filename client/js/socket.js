/**
 * Socket.IO client connection management and real-time event dispatchers
 */

import { state } from "./state.js";
import { getBackendHost } from "./utils.js";

let socketInstance = null;
const connectionListeners = new Set();

export function onConnectionStateChange(listener) {
  connectionListeners.add(listener);
  return () => connectionListeners.delete(listener);
}

function notifyConnectionState(status, details) {
  connectionListeners.forEach((listener) => {
    try {
      listener(status, details);
    } catch (e) {
      console.error("Connection state listener error:", e);
    }
  });
}

export function initSocket() {
  if (socketInstance) {
    return socketInstance;
  }

  // Fallback if socket.io client failed to load or is blocked by network
  if (typeof window.io !== "function") {
    console.warn(
      "[Socket] window.io is unavailable. Real-time features disabled; falling back to REST.",
    );
    notifyConnectionState("disconnected", "Socket library unavailable");
    socketInstance = {
      connected: false,
      on: () => {},
      off: () => {},
      emit: () => {},
      disconnect: () => {},
      io: { on: () => {}, off: () => {} },
    };
    return socketInstance;
  }

  const socketHost = getBackendHost();

  try {
    socketInstance = window.io(socketHost, {
      auth: {
        token: state.token,
      },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });
  } catch (err) {
    console.error("[Socket] Failed to initialize socket connection:", err);
    notifyConnectionState("error", err.message);
    socketInstance = {
      connected: false,
      on: () => {},
      off: () => {},
      emit: () => {},
      disconnect: () => {},
      io: { on: () => {}, off: () => {} },
    };
    return socketInstance;
  }

  socketInstance.on("connect", () => {
    console.log("[Socket] Connected:", socketInstance.id);
    notifyConnectionState("connected");
  });

  socketInstance.on("disconnect", (reason) => {
    console.warn("[Socket] Disconnected:", reason);
    notifyConnectionState("disconnected", reason);
  });

  socketInstance.on("connect_error", (error) => {
    console.error("[Socket] Connection error:", error.message);
    notifyConnectionState("error", error.message);
  });

  socketInstance.io.on("reconnect_attempt", (attempt) => {
    console.log(`[Socket] Reconnect attempt #${attempt}`);
    notifyConnectionState("reconnecting", attempt);
  });

  socketInstance.io.on("reconnect", () => {
    console.log("[Socket] Reconnected successfully");
    notifyConnectionState("connected");
  });

  return socketInstance;
}

export function getSocket() {
  return socketInstance || initSocket();
}
