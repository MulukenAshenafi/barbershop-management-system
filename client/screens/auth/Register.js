import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Linking,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import InputBox from '../../components/Form/InputBox';
import Button from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import config from '../../config';
import { registerWithEmail, exchangeGoogleToken } from '../../services/authService';
import { fontSizes, spacing, typography, borderRadius, shadows } from '../../theme';

WebBrowser.maybeCompleteAuthSession();

const useNativeDriver = Platform.OS !== 'web';
const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL || '';
const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL || '';

const Register = ({ navigation }) => {
  const toast = useToast();
  const { colors } = useTheme();
  const { checkAuth } = useAuth();
  const insets = useSafeAreaInsets();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const checkScale = useRef(new Animated.Value(1)).current;

  // Use fixed Expo proxy URL so Google Cloud Web client (https-only) always matches
  const redirectUri = config.googleRedirectUri;

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID,
    redirectUri,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      const idToken = authentication?.idToken || authentication?.accessToken;
      if (idToken) {
        handleGoogleExchange(idToken);
      }
    } else if (response?.type === 'error') {
      setGoogleLoading(false);
      toast.show('Google sign-in failed', { type: 'error' });
    }
    // 'cancel' or 'dismiss' just stops loading
    if (response?.type === 'cancel' || response?.type === 'dismiss') {
      setGoogleLoading(false);
    }
  }, [response]);

  const toggleTerms = useCallback(() => {
    setAcceptedTerms((prev) => !prev);
    Animated.sequence([
      Animated.timing(checkScale, {
        toValue: 0.8,
        duration: 80,
        useNativeDriver,
      }),
      Animated.spring(checkScale, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver,
      }),
    ]).start();
  }, [checkScale]);

  const handleGoogleExchange = async (token) => {
    const { success, error } = await exchangeGoogleToken(token);
    setGoogleLoading(false);
    if (success) {
      toast.show('Signed in with Google', { type: 'success' });
      checkAuth().then(() => navigation.reset({ index: 0, routes: [{ name: 'home' }] }));
    } else {
      toast.show(error || 'Google sign-in failed', { type: 'error' });
    }
  };

  const handleSignUp = async () => {
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password) {
      toast.show('Please fill in all fields', { type: 'error' });
      return;
    }
    if (password.length < 6) {
      toast.show('Password must be at least 6 characters', { type: 'error' });
      return;
    }
    if (!acceptedTerms) {
      toast.show('Please accept the Privacy Policy and Terms of Use', { type: 'error' });
      return;
    }
    setLoading(true);
    const { success, error, message } = await registerWithEmail(
      firstName.trim(),
      lastName.trim(),
      email.trim(),
      password
    );
    setLoading(false);
    if (success) {
      toast.show(message || 'Check your email to verify your account.', { type: 'success' });
      navigation.navigate('login', { email: email.trim() });
    } else if (error) {
      toast.show(error, { type: 'error' });
    }
  };

  const handleGoogle = () => {
    if (!request) {
      toast.show('Google sign-in is initializing. Please try again.', { type: 'error' });
      return;
    }
    setGoogleLoading(true);
    // Force useProxy/WebBrowser flow
    promptAsync({ useProxy: true });
  };

  const openLink = (url, label) => {
    if (url) Linking.openURL(url).catch(() => toast.show(`Could not open ${label}`, { type: 'error' }));
    else toast.show(`${label} link not configured`, { type: 'error' });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xxl }]}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Let's get you set up</Text>
          <Text style={[styles.title, { color: colors.text }]}>Create an account</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <InputBox
            placeholder="First name"
            value={firstName}
            setValue={setFirstName}
            autoComplete="name-given"
            leftIcon="user"
          />
          <InputBox
            placeholder="Last name"
            value={lastName}
            setValue={setLastName}
            autoComplete="name-family"
            leftIcon="user"
          />
          <InputBox
            placeholder="Email"
            value={email}
            setValue={setEmail}
            autoComplete="email"
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail"
          />
          <InputBox
            placeholder="Password"
            value={password}
            setValue={setPassword}
            inputType="password"
            leftIcon="lock"
          />

          {/* Terms checkbox */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={toggleTerms}
            activeOpacity={0.8}
          >
            <Animated.View
              style={[
                styles.checkbox,
                {
                  borderColor: acceptedTerms ? colors.primary : colors.gray400,
                  backgroundColor: acceptedTerms ? colors.primary : 'transparent',
                  transform: [{ scale: checkScale }],
                },
              ]}
            >
              {acceptedTerms && <Ionicons name="checkmark" size={16} color={colors.white} />}
            </Animated.View>
            <Text style={[styles.termsText, { color: colors.textSecondary }]}>
              By continuing you accept our{' '}
              <Text
                style={[styles.termsLink, { color: colors.primary }]}
                onPress={(e) => {
                  e.stopPropagation();
                  openLink(PRIVACY_URL, 'Privacy Policy');
                }}
              >
                Privacy Policy
              </Text>
              {' and '}
              <Text
                style={[styles.termsLink, { color: colors.primary }]}
                onPress={(e) => {
                  e.stopPropagation();
                  openLink(TERMS_URL, 'Terms of Use');
                }}
              >
                Terms of Use
              </Text>
            </Text>
          </TouchableOpacity>

          <Button
            title="Register"
            onPress={handleSignUp}
            loading={loading}
            disabled={loading}
            fullWidth
            style={styles.primaryBtn}
          />

          {/* Divider */}
          <View style={styles.orRow}>
            <View style={[styles.orLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.orText, { color: colors.textSecondary }]}>Or</Text>
            <View style={[styles.orLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Google */}
          <TouchableOpacity
            style={[
              styles.googleBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.gray300,
              },
              (googleLoading || loading) && styles.btnDisabled,
            ]}
            onPress={handleGoogle}
            disabled={googleLoading || loading}
            activeOpacity={0.9}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color="#4285F4" />
                <Text style={[styles.googleBtnText, { color: colors.text }]}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Already have an account?{' '}
            <Text style={[styles.link, { color: colors.primary }]} onPress={() => navigation.navigate('login')}>
              Login
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  subtitle: {
    ...typography.bodySmall,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.subtitle,
    fontSize: fontSizes.xxl,
    fontWeight: '700',
  },
  form: {
    marginBottom: spacing.lg,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    marginRight: spacing.sm,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsText: {
    ...typography.bodySmall,
    flex: 1,
    lineHeight: 22,
  },
  termsLink: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  primaryBtn: {
    marginBottom: spacing.lg,
    minHeight: 52,
    borderRadius: borderRadius.md,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  orLine: {
    flex: 1,
    height: 1,
  },
  orText: {
    ...typography.bodySmall,
    paddingHorizontal: spacing.md,
    fontWeight: '500',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 52,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    marginBottom: spacing.lg,
  },
  googleBtnText: {
    fontSize: fontSizes.base,
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.7,
  },
  helperText: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
  link: { fontWeight: '600' },
});

export default Register;
