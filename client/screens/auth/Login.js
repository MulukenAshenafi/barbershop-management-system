import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
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
import { loginWithEmail, guestLogin, exchangeGoogleToken } from '../../services/authService';
import { fontSizes, spacing, borderRadius, typography, shadows } from '../../theme';

WebBrowser.maybeCompleteAuthSession();

const barberBookLogo = require('../../assets/Logo — BarberBook Brand.jpeg');

const Login = ({ navigation, route }) => {
  const { colors, isDark } = useTheme();
  const toast = useToast();
  const { checkAuth } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState(route?.params?.email ?? '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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

  const handleLogin = async () => {
    setLoading(true);
    const { success, error } = await loginWithEmail(email, password);
    setLoading(false);
    if (success) {
      toast.show('Login successful', { type: 'success' });
      await checkAuth();
      navigation.reset({ index: 0, routes: [{ name: 'home' }] });
    } else if (error) {
      toast.show(error || 'Invalid credentials', { type: 'error' });
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

  const handleGuest = async () => {
    setGuestLoading(true);
    const { success, error } = await guestLogin();
    setGuestLoading(false);
    if (success) {
      toast.show('Signed in as guest', { type: 'success' });
      await checkAuth();
      navigation.reset({ index: 0, routes: [{ name: 'home' }] });
    } else if (error) {
      toast.show(error || 'Guest sign-in failed', { type: 'error' });
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo & Title */}
        <View style={styles.logoContainer}>
          <View style={[styles.logoCard, { backgroundColor: colors.surface }, shadows.md]}>
            <Image source={barberBookLogo} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={[styles.appName, { color: colors.text }]}>BarberBook</Text>
          <Text style={[styles.welcomeBack, { color: colors.textSecondary }]}>Welcome back</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <InputBox
            placeholder="Email or username"
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

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            fullWidth
            style={styles.primaryBtn}
          />

          <Text
            style={[styles.forgotLink, { color: colors.primary }]}
            onPress={() => navigation.navigate('forgot-password')}
          >
            Forgot password?
          </Text>

          {/* Divider */}
          <View style={styles.orRow}>
            <View style={[styles.orLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.orText, { color: colors.textSecondary }]}>OR</Text>
            <View style={[styles.orLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Google Button */}
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

          {/* Register link */}
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Don't have an account?{' '}
            <Text
              style={[styles.link, { color: colors.primary }]}
              onPress={() => navigation.navigate('register')}
            >
              Register
            </Text>
          </Text>

          {/* Guest */}
          <Button
            title="Continue as Guest"
            onPress={handleGuest}
            loading={guestLoading}
            disabled={loading}
            variant="ghost"
            fullWidth
            style={styles.guestBtn}
          />
        </View>

        <Text style={[styles.copyright, { color: colors.textSecondary }]}>
          ©{new Date().getFullYear()} BarberBook
        </Text>
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoCard: {
    width: 160,
    height: 100,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logo: {
    width: 150,
    height: 90,
    borderRadius: borderRadius.lg,
  },
  appName: {
    ...typography.subtitle,
    fontSize: fontSizes.xxl,
    fontWeight: '700',
  },
  welcomeBack: {
    ...typography.bodySmall,
    marginTop: spacing.xs,
  },
  form: {
    marginBottom: spacing.lg,
  },
  primaryBtn: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    minHeight: 52,
    borderRadius: borderRadius.md,
  },
  forgotLink: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginBottom: spacing.lg,
    fontWeight: '500',
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
    marginBottom: spacing.lg,
  },
  link: { fontWeight: '600' },
  guestBtn: {
    marginBottom: spacing.sm,
    minHeight: 48,
    borderRadius: borderRadius.md,
  },
  copyright: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

export default Login;
