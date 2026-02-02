/**
 * Web fallback for NearbyShopsMap – react-native-maps is native-only.
 * Shows a message and optional list so Explore Shops works on web.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export default function NearbyShopsMap({ shops = [], userLocation, onMarkerPress }) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>
        Map view is available in the BarberBook mobile app (iOS & Android).
      </Text>
      {shops.length > 0 && (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {shops.map((shop) => (
            <TouchableOpacity
              key={shop.id}
              style={styles.row}
              onPress={() => onMarkerPress && onMarkerPress(shop)}
              activeOpacity={0.8}
            >
              <Text style={styles.name}>{shop.name}</Text>
              {shop.distance_km != null && (
                <Text style={styles.distance}>{shop.distance_km.toFixed(1)} km</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 200,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 16,
  },
  list: { flex: 1, width: '100%' },
  listContent: { paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e9ecef',
  },
  name: { fontSize: 16, fontWeight: '600' },
  distance: { fontSize: 14, color: '#6c757d' },
});
