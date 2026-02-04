import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Calendar } from 'react-native-calendars';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../services/api';
import { getStoredCustomer } from '../services/auth';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { useToast } from '../components/common/Toast';
import { useTheme } from '../context/ThemeContext';
import { fontSizes, spacing, borderRadius, typography, colors as themeColors } from '../theme';

const BookService = ({ route, navigation }) => {
  const toast = useToast();
  const { colors } = useTheme();
  const params = route.params ?? {};
  const { serviceId, serviceName, servicePrice, serviceImage } = params;
  const [barbers, setBarbers] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [customer, setCustomer] = useState({ customerId: '', name: '' });
  const [markedDates, setMarkedDates] = useState({});
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loadingBarbers, setLoadingBarbers] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    const load = async () => {
      const c = await getStoredCustomer();
      if (c) setCustomer({ customerId: c.customerId, name: c.customerName });
    };
    load();
  }, []);

  useEffect(() => {
    const fetchBarbers = async () => {
      setLoadingBarbers(true);
      try {
        const response = await api.get('barbers/get-all');
        setBarbers(response.data.barbers || []);
      } catch (error) {
        toast.show('Unable to fetch barbers. Please try again.', { type: 'error' });
      } finally {
        setLoadingBarbers(false);
      }
    };
    fetchBarbers();
  }, []);

  useEffect(() => {
    if (!selectedBarber || !selectedDate) {
      setAvailableSlots([]);
      return;
    }
    const fetchAvailability = async () => {
      setLoadingSlots(true);
      try {
        const response = await api.get('booking/availability', {
          params: { barberId: selectedBarber, date: selectedDate },
        });
        const slots = response.data.availableSlots || [];
        setAvailableSlots(slots);
        const marked = {};
        marked[selectedDate] = {
          selected: true,
          selectedColor: slots.length === 0 ? colors.secondary : colors.success,
        };
        setMarkedDates(marked);
      } catch (error) {
        toast.show('Unable to check availability. Please try again.', { type: 'error' });
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchAvailability();
  }, [selectedBarber, selectedDate]);

  const handleTimePick = (event, date) => {
    setShowTimePicker(false);
    if (event.type === 'set' && date) setSelectedTime(date);
  };

  const handleBooking = async (paymentMethod) => {
    if (!selectedTime) {
      toast.show('Please select a time slot.', { type: 'error' });
      return;
    }
    if (!customer.customerId) {
      toast.show('Please log in again.', { type: 'error' });
      return;
    }
    const paymentStatus =
      paymentMethod === 'cash' ? 'Pending to be paid on cash' : 'Online Pending';
    try {
      const response = await api.post('booking/create', {
        serviceId,
        barberId: selectedBarber,
        customerId: customer.customerId,
        bookingTime: selectedTime.toISOString(),
        customerNotes: '',
        paymentStatus,
      });
      const createdBooking = response.data.booking;
      const bookingId = createdBooking._id ?? createdBooking.id;
      const selectedBarberName =
        barbers.find((b) => String(b._id) === String(selectedBarber))?.name || 'Barber';
      const navData = {
        customerName: customer.customerName ?? customer.name,
        barberName: selectedBarberName,
        bookingData: createdBooking,
        serviceName,
        totalAmount: servicePrice,
        bookingId,
      };
      if (paymentMethod === 'cash') {
        toast.show('Booking created successfully', { type: 'success' });
        navigation.navigate('Confirmation', {
          ...navData,
          paymentStatus: 'Pending to be paid on cash',
        });
      } else {
        navigation.navigate('payment', {
          ...navData,
          paymentStatus: 'Online Pending',
        });
      }
    } catch (error) {
      const status = error.response?.status;
      const msg =
        status === 409
          ? 'This slot was just booked. Please choose another time.'
          : error.response?.data?.error ??
            error.response?.data?.details ??
            'Unable to create booking.';
      toast.show(msg, { type: 'error' });
    }
  };

  if (!serviceId || !serviceName) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.serviceName, { color: colors.text }]}>Please select a service first.</Text>
        <Button title="Go back" onPress={() => navigation.goBack()} variant="primary" fullWidth style={{ marginTop: 16 }} />
      </View>
    );
  }

  const confirmPaymentMethod = () => {
    Alert.alert('Choose Payment', 'Select how you want to pay:', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Cash', onPress: () => handleBooking('cash') },
      { text: 'Online', onPress: () => handleBooking('online') },
    ], { cancelable: true });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="always"
    >
      <Text style={styles.pageTitle}>Book your service</Text>
      <Text style={styles.serviceName}>{serviceName}</Text>

      <Card style={styles.card}>
        <Text style={styles.stepLabel}>1. Choose barber</Text>
        {loadingBarbers ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Loading barbers…</Text>
          </View>
        ) : (
          <Picker
            selectedValue={selectedBarber}
            onValueChange={(v) => setSelectedBarber(v)}
            style={styles.picker}
            prompt="Select barber"
          >
            <Picker.Item label="Select barber" value="" />
            {(barbers || []).map((barber) => (
              <Picker.Item
                key={barber._id ?? barber.id}
                label={barber.name || 'Barber'}
                value={String(barber._id ?? barber.id)}
              />
            ))}
          </Picker>
        )}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.stepLabel}>2. Pick a date</Text>
        <Calendar
          onDayPress={(day) => {
            setSelectedDate(day.dateString);
            setAvailableSlots([]);
            setSelectedTime(null);
          }}
          markedDates={markedDates}
          theme={{
            selectedDayBackgroundColor: colors.success,
            selectedDayTextColor: colors.white,
            todayTextColor: colors.primary,
            arrowColor: colors.primary,
          }}
        />
      </Card>

      {selectedDate && (
        <Card style={styles.card}>
          <Text style={styles.stepLabel}>3. Pick a time</Text>
          <TouchableOpacity
            onPress={() => setShowTimePicker(true)}
            style={styles.timeBtn}
            activeOpacity={0.9}
          >
            <Text style={styles.timeBtnText}>
              {selectedTime
                ? selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Select time'}
            </Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              mode="time"
              value={selectedTime || new Date()}
              display="spinner"
              onChange={handleTimePick}
              is24Hour
            />
          )}
          {loadingSlots && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Loading slots…</Text>
            </View>
          )}
        </Card>
      )}

      <Button
        title="Confirm booking"
        onPress={confirmPaymentMethod}
        variant="primary"
        fullWidth
        style={styles.confirmBtn}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  pageTitle: {
    ...typography.subtitle,
    marginBottom: spacing.xs,
  },
  serviceName: {
    ...typography.bodySmall,
    marginBottom: spacing.lg,
  },
  card: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  stepLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  picker: {
    height: 48,
    width: '100%',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  loadingText: {
    ...typography.bodySmall,
  },
  timeBtn: {
    backgroundColor: themeColors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  timeBtnText: {
    color: themeColors.white,
    fontWeight: '600',
    fontSize: fontSizes.base,
  },
  confirmBtn: {
    marginTop: spacing.lg,
  },
});

export default BookService;
