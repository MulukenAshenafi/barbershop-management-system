/**
 * Multi-step barbershop registration: Basic Info → Location → Hours → Review.
 * On success: store barbershop_id, update BarbershopContext, navigate to AdminDashboard.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import InputBox from '../../components/Form/InputBox';
import { Button } from '../../components/common/Button';
import { colors, fontSizes, spacing, typography } from '../../theme';
import api from '../../services/api';
import { useBarbershop } from '../../context/BarbershopContext';
import { getFileForFormData } from '../../utils/imageUpload';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DEFAULT_HOURS = { open: '09:00', close: '18:00' };

function slugFromName(name) {
  if (!name || !name.trim()) return '';
  let s = name.trim().toLowerCase().replace(/\s+/g, '-');
  s = s.replace(/[^a-z0-9-]/g, '');
  return s.replace(/-+/g, '-').replace(/^-|-$/g, '') || 'shop';
}

const ETHIOPIAN_PHONE = /^(\+251|0)?9\d{8}$/;
function validatePhone(value) {
  const digits = (value || '').replace(/\D/g, '');
  return ETHIOPIAN_PHONE.test('+251' + digits) || ETHIOPIAN_PHONE.test(digits) || ETHIOPIAN_PHONE.test('0' + digits);
}

export default function BarbershopRegistrationScreen() {
  const navigation = useNavigation();
  const { loadMyShops, setActiveBarbershop } = useBarbershop();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [nameCheckLoading, setNameCheckLoading] = useState(false);
  const [nameAvailable, setNameAvailable] = useState(null);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [openingHours, setOpeningHours] = useState(() => {
    const h = {};
    DAYS.forEach((d) => (h[d] = { ...DEFAULT_HOURS }));
    return h;
  });
  const [logoUri, setLogoUri] = useState(null);

  const slugPreview = slugFromName(name);

  const checkName = useCallback(async () => {
    if (!name.trim()) {
      setNameAvailable(null);
      return;
    }
    setNameCheckLoading(true);
    setNameAvailable(null);
    try {
      const { data } = await api.get('/barbershops/check-name/', { params: { name: name.trim() } });
      setNameAvailable(data.available);
    } catch (e) {
      setNameAvailable(null);
    } finally {
      setNameCheckLoading(false);
    }
  }, [name]);

  useEffect(() => {
    const t = setTimeout(checkName, 400);
    return () => clearTimeout(t);
  }, [name, checkName]);

  const canProceedStep1 = name.trim().length >= 2;
  const canProceedStep2 = address.trim() && city.trim() && country.trim() && phone.trim() && email.trim();
  const validPhone = validatePhone(phone);

  const buildPayload = () => ({
    name: name.trim(),
    address: address.trim(),
    city: city.trim(),
    country: country.trim(),
    phone: phone.trim(),
    email: email.trim(),
    opening_hours: openingHours,
  });

  const handleSubmit = async () => {
    if (!canProceedStep2 || !validPhone) {
      Alert.alert('Validation', 'Please fill all required fields and use a valid Ethiopian phone (+251 9xxxxxxxx).');
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      const payload = buildPayload();
      if (logoUri) {
        const formData = new FormData();
        Object.keys(payload).forEach((k) => formData.append(k, k === 'opening_hours' ? JSON.stringify(payload[k]) : payload[k]));
        const logoFile = await getFileForFormData(logoUri, 'logo.jpg', 'image/jpeg');
        if (logoFile) formData.append('logo', logoFile);
        const { data } = await api.post('/barbershops/register/', formData, {
          headers: { 'Content-Type': false },
        });
        if (data.barbershop?.id) {
          await loadMyShops();
          await setActiveBarbershop(data.barbershop.id);
          navigation.replace('adminPanel');
        }
      } else {
        const { data } = await api.post('/barbershops/register/', payload);
        if (data.barbershop?.id) {
          await loadMyShops();
          await setActiveBarbershop(data.barbershop.id);
          navigation.replace('adminPanel');
        }
      }
    } catch (e) {
      const msg = e.response?.data?.message || e.response?.data?.errors?.name?.[0] || e.message || 'Registration failed.';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const pickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission', 'Media library access is needed to choose a logo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) setLogoUri(result.assets[0].uri);
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="always">
      <Text style={styles.title}>Register your Barbershop</Text>
      <Text style={styles.stepLabel}>Step {step} of 4</Text>

      {step === 1 && (
        <View style={styles.step}>
          <InputBox value={name} setValue={setName} placeholder="Shop name *" />
          <Text style={styles.slugPreview}>Slug preview: {slugPreview || '—'}</Text>
          {nameCheckLoading && <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />}
          {!nameCheckLoading && name.trim().length >= 2 && nameAvailable === false && (
            <Text style={styles.hint}>Name may already exist; a number will be added to the slug.</Text>
          )}
          <Button
            title="Next"
            onPress={() => setStep(2)}
            disabled={!canProceedStep1}
            fullWidth
            style={styles.nextBtn}
          />
        </View>
      )}

      {step === 2 && (
        <View style={styles.step}>
          <InputBox value={address} setValue={setAddress} placeholder="Address *" />
          <InputBox value={city} setValue={setCity} placeholder="City *" />
          <InputBox value={country} setValue={setCountry} placeholder="Country *" />
          <InputBox value={phone} setValue={setPhone} placeholder="Phone (+251 9xxxxxxxx) *" keyboardType="phone-pad" />
          {phone.trim() && !validPhone && <Text style={styles.errorHint}>Use Ethiopian format: +251 9xxxxxxxx</Text>}
          <InputBox value={email} setValue={setEmail} placeholder="Email *" keyboardType="email-address" autoCapitalize="none" />
          <Button title="Next" onPress={() => setStep(3)} disabled={!canProceedStep2 || !validPhone} fullWidth style={styles.nextBtn} />
          <Button title="Back" onPress={() => setStep(1)} variant="ghost" fullWidth />
        </View>
      )}

      {step === 3 && (
        <View style={styles.step}>
          <Text style={styles.sectionLabel}>Opening hours (optional)</Text>
          {DAYS.map((day) => (
            <View key={day} style={styles.dayRow}>
              <Text style={styles.dayLabel}>{day}</Text>
              <InputBox
                value={openingHours[day]?.open || ''}
                setValue={(v) => setOpeningHours((h) => ({ ...h, [day]: { ...(h[day] || DEFAULT_HOURS), open: v } }))}
                placeholder="Open"
              />
              <InputBox
                value={openingHours[day]?.close || ''}
                setValue={(v) => setOpeningHours((h) => ({ ...h, [day]: { ...(h[day] || DEFAULT_HOURS), close: v } }))}
                placeholder="Close"
              />
            </View>
          ))}
          <Button title="Next" onPress={() => setStep(4)} fullWidth style={styles.nextBtn} />
          <Button title="Back" onPress={() => setStep(2)} variant="ghost" fullWidth />
        </View>
      )}

      {step === 4 && (
        <View style={styles.step}>
          <Text style={styles.reviewLabel}>Review</Text>
          <Text style={styles.reviewLine}>{name}</Text>
          <Text style={styles.reviewLine}>{address}, {city}, {country}</Text>
          <Text style={styles.reviewLine}>{phone} · {email}</Text>
          <TouchableOpacity onPress={pickLogo} style={styles.logoBtn}>
            <Text style={styles.logoBtnText}>{logoUri ? 'Change logo' : 'Add logo (optional)'}</Text>
          </TouchableOpacity>
          <Button
            title={submitting ? 'Registering…' : 'Register Barbershop'}
            onPress={handleSubmit}
            disabled={submitting}
            loading={submitting}
            fullWidth
            style={styles.nextBtn}
          />
          <Button title="Back" onPress={() => setStep(3)} variant="ghost" fullWidth disabled={submitting} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { ...typography.title, marginBottom: spacing.sm },
  stepLabel: { ...typography.bodySmall, marginBottom: spacing.md },
  step: { marginBottom: spacing.lg },
  slugPreview: { ...typography.caption, marginBottom: spacing.sm },
  loader: { marginVertical: spacing.xs },
  hint: { ...typography.caption, color: colors.warning, marginBottom: spacing.sm },
  errorHint: { ...typography.caption, color: colors.error, marginBottom: spacing.sm },
  nextBtn: { marginTop: spacing.md },
  sectionLabel: { ...typography.sectionTitle, marginBottom: spacing.sm },
  dayRow: { marginBottom: spacing.sm },
  dayLabel: { ...typography.bodySmall, marginBottom: 2, textTransform: 'capitalize' },
  reviewLabel: { ...typography.sectionTitle, marginBottom: spacing.sm },
  reviewLine: { ...typography.bodySmall, marginBottom: spacing.xs },
  logoBtn: { marginVertical: spacing.md, padding: spacing.sm },
  logoBtnText: { ...typography.body, color: colors.primary },
});
