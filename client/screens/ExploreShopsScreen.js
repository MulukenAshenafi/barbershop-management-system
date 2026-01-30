/**
 * ExploreShopsScreen – customer shop discovery.
 * Search by city/name, or "Find Near Me" (location + nearby API).
 * Toggle List View | Map View. Radius filter (1, 5, 10, 20 km). Distance on cards.
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import InputBox from '../components/Form/InputBox';
import api from '../services/api';
import LocationService from '../services/location';
import NearbyShopsMap from './Explore/NearbyShopsMap';
import { SkeletonList } from '../components/common/Skeleton';
import { colors, fontSizes, spacing, typography } from '../theme';

const DEBOUNCE_MS = 400;
const RADII = [1, 5, 10, 20];

export default function ExploreShopsScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [userLocation, setUserLocation] = useState(null);
  const [radiusKm, setRadiusKm] = useState(5);
  const [locationDenied, setLocationDenied] = useState(false);

  const search = useCallback(async (q, lat, lng) => {
    setLoading(true);
    setSearched(true);
    try {
      const params = q && q.trim() ? { search: q.trim() } : {};
      if (lat != null && lng != null) {
        params.lat = lat;
        params.lng = lng;
      }
      const { data } = await api.get('/barbershops/public/', { params });
      const list = data.results || [];
      setResults(list);
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(searchQuery), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchQuery, search]);

  const handleFindNearMe = useCallback(async () => {
    setLoading(true);
    setLocationDenied(false);
    try {
      const { coords, shops } = await LocationService.findNearMe(radiusKm);
      setUserLocation(coords);
      setResults(shops);
      setSearched(true);
      setViewMode('map');
    } catch (e) {
      if (e.message && e.message.includes('denied')) {
        setLocationDenied(true);
        Alert.alert(
          'Location denied',
          'Search by city or shop name below, or enable location in settings for "Find Near Me".'
        );
      } else {
        Alert.alert('Error', e.message || 'Could not get location.');
      }
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [radiusKm]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ShopPublicProfile', { shopId: item.id })}
      activeOpacity={0.9}
    >
      {item.logo_url ? (
        <Image source={{ uri: item.logo_url }} style={styles.logo} />
      ) : (
        <View style={styles.logoPlaceholder} />
      )}
      <View style={styles.cardBody}>
        <Text style={styles.shopName}>{item.name}</Text>
        <Text style={styles.shopCity}>
          {item.city}{item.country ? `, ${item.country}` : ''}
        </Text>
        {item.address ? (
          <Text style={styles.shopAddress} numberOfLines={1}>
            {item.address}
          </Text>
        ) : null}
        {item.distance_km != null ? (
          <Text style={styles.distance}>{item.distance_km.toFixed(1)} km away</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  const listContent = (
    <>
      <View style={styles.searchRow}>
        <InputBox
          value={searchQuery}
          setValue={setSearchQuery}
          placeholder="Search by shop name or city"
        />
      </View>
      {locationDenied && (
        <Text style={styles.fallbackHint}>
          Location was denied. You can search by city or shop name above.
        </Text>
      )}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.findNearMeBtn}
          onPress={handleFindNearMe}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.findNearMeText}>Find Near Me</Text>
          )}
        </TouchableOpacity>
        {userLocation && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.radiusRow}
            contentContainerStyle={styles.radiusContent}
          >
            {RADII.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.radiusChip, r === radiusKm && styles.radiusChipActive]}
                onPress={() => {
                  setRadiusKm(r);
                  LocationService.getNearbyBarbershops(userLocation, r).then(setResults);
                }}
              >
                <Text style={[styles.radiusText, r === radiusKm && styles.radiusTextActive]}>
                  {r} km
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
      {loading && !userLocation ? (
        <SkeletonList items={6} style={styles.list} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={renderItem}
          ListEmptyComponent={
            searched ? (
              <Text style={styles.empty}>No shops found. Try a different search or radius.</Text>
            ) : (
              <Text style={styles.hint}>
                Tap "Find Near Me" or type to search by city/shop name.
              </Text>
            )
          }
        />
      )}
    </>
  );

  const mapContent = userLocation ? (
    <View style={styles.mapWrap}>
      <NearbyShopsMap
        shops={results}
        userLocation={userLocation}
        radiusKm={radiusKm}
        onMarkerPress={(shop) => navigation.navigate('ShopPublicProfile', { shopId: shop.id })}
      />
      <View style={styles.radiusRowBottom}>
        {RADII.map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.radiusChip, r === radiusKm && styles.radiusChipActive]}
            onPress={() => {
              setRadiusKm(r);
              LocationService.getNearbyBarbershops(userLocation, r).then(setResults);
            }}
          >
            <Text style={[styles.radiusText, r === radiusKm && styles.radiusTextActive]}>
              {r} km
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  ) : (
    listContent
  );

  return (
    <View style={styles.container}>
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
          onPress={() => setViewMode('list')}
        >
          <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>
            List
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
          onPress={() => userLocation && setViewMode('map')}
          disabled={!userLocation}
        >
          <Text
            style={[
              styles.toggleText,
              viewMode === 'map' && styles.toggleTextActive,
              !userLocation && styles.toggleTextDisabled,
            ]}
          >
            Map
          </Text>
        </TouchableOpacity>
      </View>
      {viewMode === 'map' ? mapContent : listContent}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  toggleRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  toggleBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    backgroundColor: colors.gray200,
  },
  toggleBtnActive: { backgroundColor: colors.primary },
  toggleText: { fontSize: fontSizes.base, color: colors.text },
  toggleTextActive: { color: colors.white },
  toggleTextDisabled: { color: colors.gray500 },
  searchRow: { padding: spacing.md, paddingTop: 0 },
  fallbackHint: {
    fontSize: fontSizes.sm,
    color: colors.warning,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  actions: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  findNearMeBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  findNearMeText: { color: colors.white, fontWeight: '600', fontSize: fontSizes.base },
  radiusRow: { marginBottom: spacing.sm },
  radiusContent: { gap: spacing.sm, paddingRight: spacing.md },
  radiusRowBottom: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  radiusChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.gray200,
  },
  radiusChipActive: { backgroundColor: colors.primary },
  radiusText: { fontSize: fontSizes.sm, color: colors.text },
  radiusTextActive: { color: colors.white },
  loader: { marginTop: spacing.xl },
  list: { padding: spacing.md, paddingTop: 0, paddingBottom: spacing.xxl },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  logo: { width: 56, height: 56, borderRadius: 8 },
  logoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: colors.gray200,
  },
  cardBody: { flex: 1, marginLeft: spacing.md },
  shopName: { ...typography.sectionTitle, marginBottom: 4 },
  shopCity: { ...typography.bodySmall },
  shopAddress: { ...typography.caption, marginTop: 4 },
  distance: {
    fontSize: fontSizes.sm,
    color: colors.primary,
    marginTop: 4,
    fontWeight: '600',
  },
  empty: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  hint: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginTop: spacing.xl,
    color: colors.textSecondary,
  },
  mapWrap: { flex: 1 },
});
