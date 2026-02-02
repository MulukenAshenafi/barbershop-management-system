import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Layout from '../../components/Layout/Layout';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import api from '../../services/api';
import { ErrorView } from '../../components/common/ErrorView';
import { SkeletonList, SkeletonAppointmentRow } from '../../components/common/Skeleton';
import { useTheme } from '../../context/ThemeContext';
import { fontSizes, spacing, borderRadius, typography } from '../../theme';

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};
const formatTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
};

const AppointmentCard = ({ appointment, onCancel, onCancelLoading, onRate, colors }) => {
  const barber = appointment.barberId;
  const service = appointment.serviceId;
  const slot = appointment.slotId;
  const barberName = typeof barber === 'object' ? barber?.name : 'Barber';
  const serviceName = typeof service === 'object' ? service?.name : 'Service';
  const isCancelled = appointment.bookingStatus === 'Cancelled';
  const bookingId = appointment._id ?? appointment.id;
  const barbershopId = appointment.barbershopId ?? appointment.barbershop?.id ?? appointment.barbershop;

  return (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.serviceName}>{serviceName}</Text>
        <View style={[styles.badge, isCancelled && styles.badgeCancelled]}>
          <Text style={styles.badgeText}>{appointment.bookingStatus}</Text>
        </View>
      </View>
      <Text style={styles.barber}>with {barberName}</Text>
      <Text style={styles.date}>
        {slot?.startTime
          ? formatDate(slot.startTime)
          : formatDate(appointment.bookingTime)}
      </Text>
      <Text style={[styles.time, { color: colors.textSecondary }]}>
        {slot?.startTime
          ? formatTime(slot.startTime)
          : formatTime(appointment.bookingTime)}
        {slot?.endTime ? ` – ${formatTime(slot.endTime)}` : ''}
      </Text>
      <Text style={[styles.payment, { color: colors.textSecondary }]}>Payment: {appointment.paymentStatus}</Text>
      {!isCancelled && barbershopId && onRate && (
        <TouchableOpacity
          style={styles.rateBtn}
          onPress={() => onRate({ shopId: barbershopId, bookingId })}
          activeOpacity={0.9}
        >
          <Text style={[styles.rateBtnText, { color: colors.accent }]}>Rate experience</Text>
        </TouchableOpacity>
      )}
      {!isCancelled && (
        <TouchableOpacity
          style={[styles.cancelBtn, { borderColor: colors.error }, onCancelLoading && styles.cancelBtnDisabled]}
          onPress={() => onCancel(appointment)}
          disabled={onCancelLoading}
          activeOpacity={0.9}
        >
          <Text style={[styles.cancelBtnText, { color: colors.error }]}>Cancel booking</Text>
        </TouchableOpacity>
      )}
    </Card>
  );
};

const MyAppointments = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  const handleRate = ({ shopId, bookingId }) => {
    navigation.navigate('Reviews', { shopId, bookingId });
  };

  const fetchBookings = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get('booking/my-bookings');
      if (res.data?.success) {
        setBookings(res.data.bookings || []);
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const handleCancel = (appointment) => {
    const id = appointment._id ?? appointment.id;
    Alert.alert(
      'Cancel booking',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, cancel',
          style: 'destructive',
          onPress: async () => {
            setCancellingId(id);
            try {
              await api.patch(`booking/cancel/${id}`);
              await fetchBookings();
            } catch (e) {
              Alert.alert(
                'Error',
                e.response?.data?.message || 'Could not cancel booking'
              );
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]
    );
  };

  if (error) return <ErrorView message={error} onRetry={fetchBookings} />;

  return (
    <Layout>
      <View style={styles.container}>
        <Text style={[styles.heading, { color: colors.text }]}>My appointments</Text>
        {loading ? (
          <ScrollView
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          >
            <SkeletonList items={5} renderItem={() => <SkeletonAppointmentRow />} />
          </ScrollView>
        ) : (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {bookings.length === 0 ? (
            <EmptyState
              icon="calendar-blank"
              title="No appointments yet"
              message="Book a service to see your appointments here."
              actionLabel="Book Now"
              onAction={() => navigation.navigate('BookService')}
            />
          ) : (
            bookings.map((b) => (
              <AppointmentCard
                key={b._id ?? b.id}
                appointment={b}
                onCancel={handleCancel}
                onCancelLoading={cancellingId === (b._id ?? b.id)}
                onRate={handleRate}
                colors={colors}
              />
            ))
          )}
        </ScrollView>
        )}
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  heading: { ...typography.sectionTitle, marginBottom: spacing.md },
  list: { paddingBottom: spacing.xxl },
  card: {
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  serviceName: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    flex: 1,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  badgeCancelled: {},
  badgeText: {
    fontSize: fontSizes.xs,
    color: '#fff',
    fontWeight: '600',
  },
  barber: { ...typography.bodySmall, marginTop: spacing.xs },
  date: { marginTop: spacing.sm, fontWeight: '500' },
  time: { ...typography.bodySmall, marginTop: spacing.xs },
  payment: { marginTop: spacing.xs, fontSize: fontSizes.sm },
  rateBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  rateBtnText: { fontSize: fontSizes.sm, fontWeight: '600' },
  cancelBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: borderRadius.sm,
  },
  cancelBtnDisabled: { opacity: 0.6 },
  cancelBtnText: { fontWeight: '600', fontSize: fontSizes.sm },
});

export default MyAppointments;
