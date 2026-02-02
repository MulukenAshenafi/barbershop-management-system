/**
 * Location service: permissions, current position, nearby barbershops.
 */
import * as Location from 'expo-location';
import api from './api';

const LocationService = {
  async requestPermissions() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission to access location was denied');
    }
    return true;
  },

  async getCurrentLocation() {
    await this.requestPermissions();
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  },

  /**
   * Fetch nearby barbershops from API (requires lat, lng from getCurrentLocation or passed in).
   */
  async getNearbyBarbershops({ latitude, longitude }, radiusKm = 5) {
    const { data } = await api.get('/barbershops/nearby/', {
      params: { lat: latitude, lng: longitude, radius: radiusKm },
    });
    return data.results || [];
  },

  /**
   * Request location, then fetch nearby shops. Throws if permission denied.
   */
  async findNearMe(radiusKm = 5) {
    const coords = await this.getCurrentLocation();
    const shops = await this.getNearbyBarbershops(coords, radiusKm);
    return { coords, shops };
  },
};

export default LocationService;
