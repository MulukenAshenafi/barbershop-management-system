/**
 * Map view: user location (circle) and barbershop markers. Tap marker → ShopPublicProfile.
 */
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

export default function NearbyShopsMap({ shops = [], userLocation, radiusKm = 5, onMarkerPress }) {
  const defaultRegion = userLocation
    ? {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: radiusKm * 0.02,
        longitudeDelta: radiusKm * 0.02,
      }
    : {
        latitude: 9.0320,
        longitude: 38.7469,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };

  return (
    <MapView
      style={styles.map}
      initialRegion={defaultRegion}
      showsUserLocation={!!userLocation}
      showsMyLocationButton
    >
      {userLocation && (
        <Circle
          center={userLocation}
          radius={radiusKm * 1000}
          strokeColor="rgba(26, 26, 46, 0.5)"
          fillColor="rgba(26, 26, 46, 0.1)"
        />
      )}
      {shops
        .filter((s) => s.latitude != null && s.longitude != null)
        .map((shop) => (
          <Marker
            key={shop.id}
            coordinate={{
              latitude: Number(shop.latitude),
              longitude: Number(shop.longitude),
            }}
            title={shop.name}
            description={shop.distance_km != null ? `${shop.distance_km.toFixed(1)} km away` : shop.city}
            onPress={() => onMarkerPress && onMarkerPress(shop)}
            pinColor={colors.secondary}
          />
        ))}
    </MapView>
  );
}

const colors = {
  secondary: '#e94560',
};

const styles = StyleSheet.create({
  map: {
    width,
    height: height - 200,
  },
});
