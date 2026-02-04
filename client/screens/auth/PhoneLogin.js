/**
 * Phone sign-in with Firebase OTP.
 * On web: uses RecaptchaVerifier. On native: shows message to use email or web.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
} from 'react-native';
import { RecaptchaVerifier } from 'firebase/auth';
import InputBox from '../../components/Form/InputBox';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useToast } from '../../components/common/Toast';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { sendPhoneOtp, verifyPhoneOtp, isFirebaseConfigured } from '../../services/authService';
import { getFirebaseAuth } from '../../services/firebase';
import { fontSizes, spacing, typography } from '../../theme';

const CAN_PHONE = typeof window !== 'undefined' && Platform.OS === 'web';

export default function PhoneLogin({ navigation }) {
  const { colors } = useTheme();
  const toast = useToast();
  const { checkAuth } = useAuth();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const recaptchaRef = useRef(null);

  useEffect(() => {
    if (!CAN_PHONE || !isFirebaseConfigured()) return;
    try {
      const auth = getFirebaseAuth();
      if (auth && typeof window !== 'undefined' && !window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          'recaptcha-container',
          { size: 'invisible' },
          auth
        );
      }
    } catch (_) {}
    return () => {
      if (typeof window !== 'undefined' && window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear?.();
        } catch (_) {}
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const handleSendCode = async () => {
    const normalized = phone.trim().replace(/^0/, '+').startsWith('+') ? phone.trim() : `+${phone.trim()}`;
    if (!normalized || normalized.length < 10) {
      toast.show('Enter a valid phone number (e.g. +1234567890)', { type: 'error' });
      return;
    }
    if (!CAN_PHONE) {
      toast.show('Phone sign-in is available on web. Use email on app.', { type: 'error' });
      return;
    }
    setLoading(true);
    const verifier = window.recaptchaVerifier || null;
    const { success, confirmation: conf, error } = await sendPhoneOtp(normalized, verifier);
    setLoading(false);
    if (success && conf) {
      setConfirmation(conf);
      toast.show('Verification code sent', { type: 'success' });
    } else {
      toast.show(error || 'Failed to send code', { type: 'error' });
    }
  };

  const handleVerify = async () => {
    if (!confirmation || !code.trim()) {
      toast.show('Enter the code you received', { type: 'error' });
      return;
    }
    setLoading(true);
    const { success, error } = await verifyPhoneOtp(confirmation, code.trim());
    setLoading(false);
    if (success) {
      toast.show('Signed in', { type: 'success' });
      await checkAuth();
      navigation.reset({ index: 0, routes: [{ name: 'home' }] });
    } else {
      toast.show(error || 'Invalid code', { type: 'error' });
    }
  };

  if (!isFirebaseConfigured()) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.msg, { color: colors.text }]}>
          Sign-in with phone is not set up yet. Go back and use "Sign in with Email" to sign in with your email and password.
        </Text>
        <Button title="Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  if (!CAN_PHONE) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.msg, { color: colors.textSecondary }]}>
          Phone sign-in is available on web. Use email to sign in on this device.
        </Text>
        <Button title="Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="none"
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Sign in with phone</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Enter your number; we'll send a verification code.
        </Text>
        {Platform.OS === 'web' && <View nativeID="recaptcha-container" style={styles.recaptcha} />}
        <Card style={styles.card}>
          {!confirmation ? (
            <>
              <InputBox
                placeholder="Phone (e.g. +1234567890)"
                value={phone}
                setValue={setPhone}
                keyboardType="phone-pad"
              />
              <Button
                title="Send code"
                onPress={handleSendCode}
                loading={loading}
                fullWidth
                style={styles.btn}
              />
            </>
          ) : (
            <>
              <InputBox
                placeholder="Verification code"
                value={code}
                setValue={setCode}
                keyboardType="number-pad"
              />
              <Button
                title="Verify and sign in"
                onPress={handleVerify}
                loading={loading}
                fullWidth
                style={styles.btn}
              />
              <TouchableOpacity onPress={() => setConfirmation(null)}>
                <Text style={[styles.link, { color: colors.primary }]}>Use a different number</Text>
              </TouchableOpacity>
            </>
          )}
        </Card>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.back, { color: colors.textSecondary }]}>Back</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, padding: spacing.lg },
  content: { maxWidth: 400, width: '100%', alignSelf: 'center' },
  title: { ...typography.subtitle, marginBottom: spacing.xs },
  subtitle: { ...typography.bodySmall, marginBottom: spacing.lg },
  card: { padding: spacing.lg, marginBottom: spacing.lg },
  btn: { marginTop: spacing.sm },
  link: { marginTop: spacing.sm, fontSize: fontSizes.sm },
  back: { ...typography.bodySmall, marginTop: spacing.md },
  msg: { ...typography.body, marginBottom: spacing.lg, textAlign: 'center' },
  recaptcha: { width: 1, height: 1, opacity: 0, position: 'absolute' },
});
