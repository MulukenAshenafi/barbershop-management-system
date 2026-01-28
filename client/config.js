// config.js
// Update this with your Django backend URL
// For local development, use your local IP or localhost
const ip_address = "localhost"; // Change to your IP if testing on physical device
const config = {
  apiBaseUrl: `http://${ip_address}:8000/api`, // Django runs on port 8000 by default
};
export default config;
