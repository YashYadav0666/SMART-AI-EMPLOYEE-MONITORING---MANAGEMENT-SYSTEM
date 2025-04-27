// Define API base URL and other configuration settings

// Get the current hostname from the browser
const currentHost = window.location.hostname;

// Set the API base URL based on the environment
export const API_BASE_URL = 
  // If we're in development on localhost, use direct paths
  currentHost === 'localhost' || currentHost === '127.0.0.1' 
    ? '' 
    // Otherwise, use the same origin (hostname + port) for API calls
    : window.location.origin;

// Log the API base URL for debugging
console.log('API_BASE_URL:', API_BASE_URL);

// WebSocket URL (use wss: for secure connections, ws: for non-secure)
// Use specific path to avoid conflicts with Vite's WebSocket
export const WS_URL = 
  currentHost === 'localhost' || currentHost === '127.0.0.1'
    ? `ws://${window.location.host}/api/ws`
    : window.location.origin.replace('http', 'ws') + '/api/ws';

// Log the WebSocket URL for debugging
console.log('WS_URL:', WS_URL);