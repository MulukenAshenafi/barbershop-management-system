/**
 * Expo app config. Reads from app.json and injects env (e.g. Google Maps API key).
 * When EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is set, Android map view will use it (required for Explore map).
 */
const appJson = require('./app.json');

module.exports = {
  ...appJson,
  expo: {
    ...appJson.expo,
    updates: {
      url: "https://u.expo.dev/21e2a58a-a8f3-4c4c-972e-f3acf8ae9d41",
    },
    android: {
      ...appJson.expo.android,
      runtimeVersion: "1.0.0",
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        },
      },
    },
    ios: {
      ...appJson.expo.ios,
      runtimeVersion: {
        policy: "appVersion"
      },
    },
  },
};
