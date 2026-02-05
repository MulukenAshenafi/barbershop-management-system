/**
 * Expo app config. Reads from app.json and injects env (e.g. Google Maps API key).
 * When EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is set, Android map view will use it (required for Explore map).
 */
const appJson = require('./app.json');

module.exports = {
  ...appJson,
  expo: {
    ...appJson.expo,
    android: {
      ...appJson.expo.android,
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        },
      },
    },
  },
};
