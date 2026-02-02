/**
 * ShopPublicProfileScreen – public shop profile for customers.
 * Shows hours, services list, staff (barbers). "Book Now" → BookService with shop context.
 * If shop subscription is suspended, show "This shop is temporarily unavailable".
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button } from '../components/common/Button';
import { OptimizedImage } from '../components/common/OptimizedImage';
import api from '../services/api';
import { useBarbershop } from '../context/BarbershopContext';
import { useTheme } from '../context/ThemeContext';
import { fontSizes, spacing, typography } from '../theme';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function ShopPublicProfileScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { setActiveBarbershop } = useBarbershop();
  const shopId = route.params?.shopId;
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!shopId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .get(`/barbershops/${shopId}/public/`)
      .then(({ data }) => {
        if (!cancelled) setShop(data);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.response?.status === 404 ? 'Shop not found.' : e.message || 'Failed to load.');
          setShop(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [shopId]);

  const hours = shop?.opening_hours || {};
  const services = shop?.services || [];
  const staff = shop?.staff || [];

  const handleBookNow = () => {
    if (!shop?.id) return;
    setActiveBarbershop(shop.id);
    const firstService = services[0];
    if (firstService) {
      navigation.navigate('BookService', {
        serviceId: firstService.id ?? firstService._id,
        serviceName: firstService.name,
        servicePrice: firstService.price,
        serviceImage: firstService.image_url ?? firstService.image,
        barbershopId: shop.id,
      });
    } else {
      navigation.navigate('BookService', { barbershopId: shop.id });
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (error || !shop) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.error, { color: colors.error }]}>{error || 'Shop not found.'}</Text>
      </View>
    );
  }

  const handleReviews = () => {
    if (shop?.id) navigation.navigate('Reviews', { shopId: shop.id });
  };

  return (
    <ScrollView style={[styles.scroll, { backgroundColor: colors.background }]} contentContainerStyle={styles.container}>
      {shop.logo_url ? (
        <OptimizedImage source={{ uri: shop.logo_url }} style={styles.logo} resizeMode="contain" />
      ) : null}
      <Text style={[styles.name, { color: colors.text }]}>{shop.name}</Text>
      {(shop.average_rating != null || shop.total_reviews != null) && (
        <TouchableOpacity onPress={handleReviews} style={styles.ratingRow} activeOpacity={0.8}>
          <Text style={[styles.ratingBadge, { color: colors.text }]}>
            ⭐ {Number(shop.average_rating || 0).toFixed(1)}
            {(shop.total_reviews ?? 0) > 0 && ` (${shop.total_reviews} reviews)`}
          </Text>
          <Text style={[styles.ratingLink, { color: colors.accent }]}>See all reviews</Text>
        </TouchableOpacity>
      )}
      {(shop.address || shop.city) && (
        <Text style={[styles.address, { color: colors.textSecondary }]}>{[shop.address, shop.city, shop.country].filter(Boolean).join(', ')}</Text>
      )}
      {shop.phone ? <Text style={[styles.contact, { color: colors.textSecondary }]}>{shop.phone}</Text> : null}
      {shop.email ? <Text style={[styles.contact, { color: colors.textSecondary }]}>{shop.email}</Text> : null}

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Opening hours</Text>
      <View style={[styles.hoursBox, { backgroundColor: colors.surface }]}>
        {DAYS.map((day) => {
          const h = hours[day];
          const str = h && h.open && h.close ? `${h.open} – ${h.close}` : 'Closed';
          return (
            <View key={day} style={styles.hourRow}>
              <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>{day}</Text>
              <Text style={[styles.hourValue, { color: colors.textSecondary }]}>{str}</Text>
            </View>
          );
        })}
      </View>

      {services.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Services</Text>
          {services.map((s) => (
            <View key={s.id} style={[styles.serviceRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.serviceName, { color: colors.text }]}>{s.name}</Text>
              <Text style={[styles.servicePrice, { color: colors.textSecondary }]}>{s.price} – {s.duration}</Text>
            </View>
          ))}
        </>
      )}

      {staff.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Staff</Text>
          {staff.map((s) => (
            <Text key={s.id} style={[styles.staffRow, { color: colors.textSecondary }]}>{s.name} ({s.role})</Text>
          ))}
        </>
      )}

      {services.length === 0 ? (
        <View style={styles.noServicesWrap}>
          <Text style={[styles.noServicesText, { color: colors.textSecondary }]}>No services available</Text>
        </View>
      ) : (
        <Button title="Book Now" onPress={handleBookNow} fullWidth style={styles.bookBtn} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { ...typography.body },
  scroll: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  logo: { width: 80, height: 80, borderRadius: 12, marginBottom: spacing.md },
  name: { ...typography.title, marginBottom: spacing.sm },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
  ratingBadge: { fontSize: fontSizes.base, fontWeight: '600' },
  ratingLink: { fontSize: fontSizes.sm, fontWeight: '600' },
  address: { ...typography.bodySmall, marginBottom: spacing.xs },
  contact: { ...typography.caption, marginBottom: spacing.xs },
  sectionTitle: { ...typography.sectionTitle, marginTop: spacing.lg, marginBottom: spacing.sm },
  hoursBox: { borderRadius: 8, padding: spacing.md },
  hourRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  dayLabel: { ...typography.bodySmall, textTransform: 'capitalize' },
  hourValue: { ...typography.bodySmall },
  serviceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1 },
  serviceName: { ...typography.body },
  servicePrice: { ...typography.bodySmall },
  staffRow: { ...typography.bodySmall, marginBottom: 4 },
  bookBtn: { marginTop: spacing.xl },
  noServicesWrap: { marginTop: spacing.xl, alignItems: 'center' },
  noServicesText: { ...typography.bodySmall },
});
