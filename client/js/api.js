// Detect if running locally (localhost, 127.0.0.1, or local network)
var isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname === "0.0.0.0";

// If running in development (e.g. Live Server on 5500), point to backend on port 5000.
// If served directly by backend on 5000 or deployed in production, use current origin.
var BACKEND_HOST = isLocalhost
  ? window.location.port === "5000"
    ? window.location.origin
    : "http://localhost:5000"
  : window.location.origin;

var API_BASE_URL = BACKEND_HOST + "/api";

// Explicitly attach to window for both standard scripts and ES modules
window.BACKEND_HOST = BACKEND_HOST;
window.API_BASE_URL = API_BASE_URL;
