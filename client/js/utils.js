/**
 * Utility functions for Group Chat frontend
 */

/**
 * Escape HTML to prevent Stored & DOM XSS vulnerabilities
 * @param {string|null|undefined} str
 * @returns {string}
 */
export function escapeHTML(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Format message timestamps into relative or readable strings
 * @param {string|Date} createdAt
 * @returns {string}
 */
export function formatMessageTime(createdAt) {
  if (!createdAt) return "";
  const date = new Date(createdAt);
  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
  });
}

/**
 * Format raw byte size into human readable string
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (!bytes || isNaN(bytes)) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Standard debounce helper
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
export function debounce(fn, delay = 300) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Dynamically determine backend host
 * Handles Live Server (5500), Express direct (5000), and production origins
 * @returns {string}
 */
export function getBackendHost() {
  if (typeof window !== "undefined" && window.BACKEND_HOST) {
    return window.BACKEND_HOST;
  }
  const isLocal =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "0.0.0.0");

  return isLocal
    ? window.location.port === "5000"
      ? window.location.origin
      : "http://localhost:5000"
    : typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:5000";
}

/**
 * Get API base URL pointing to active backend service
 * @returns {string}
 */
export function getApiBaseUrl() {
  if (typeof window !== "undefined" && window.API_BASE_URL) {
    return window.API_BASE_URL;
  }
  return `${getBackendHost()}/api`;
}

/**
 * Safely parse JSON from HTTP response, avoiding syntax error crashes on HTML error pages
 * @param {Response} response
 * @returns {Promise<any>}
 */
export async function parseResponseJson(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(
      `Server returned non-JSON response (HTTP ${response.status})`,
    );
  }
}
