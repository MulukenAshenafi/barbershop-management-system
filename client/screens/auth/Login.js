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
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import InputBox from '../../components/Form/InputBox';
import Button from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { loginWithEmail, guestLogin, exchangeGoogleToken } from '../../services/authService';
import { fontSizes, spacing, borderRadius, typography } from '../../theme';

WebBrowser.maybeCompleteAuthSession();

const barberBookLogo = require('../../assets/Logo — BarberBook Brand.jpeg');

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';

const Login = ({ navigation, route }) => {
  const { colors } = useTheme();
  const toast = useToast();
  const { checkAuth } = useAuth();
  const [email, setEmail] = useState(route?.params?.email ?? '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const discovery = AuthSession.useAutoDiscovery('https://accounts.google.com');
  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
      usePKCE: true,
    },
    discovery
  );

  useEffect(() => {
    if (response?.type !== 'success' || googleLoading !== true) return;
    const params = response.params || {};
    const idToken = params.id_token || params.access_token;
    if (!idToken) {
      setGoogleLoading(false);
      Alert.alert('Google Sign-In', 'Could not get token. Try Email sign-in.');
      return;
    }
    exchangeGoogleToken(idToken)
      .then(({ success, error }) => {
        setGoogleLoading(false);
        if (success) {
          toast.show('Signed in with Google', { type: 'success' });
          checkAuth().then(() => navigation.reset({ index: 0, routes: [{ name: 'home' }] }));
        } else {
          toast.show(error || 'Google sign-in failed', { type: 'error' });
        }
      })
      .catch(() => {
        setGoogleLoading(false);
        Alert.alert('Google Sign-In', 'Something went wrong. Try Email sign-in.');
      });
  }, [response?.type, response?.params, googleLoading]);

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
    if (!GOOGLE_CLIENT_ID) {
      toast.show('Google sign-in is not configured. Use Email to sign in.', { type: 'error' });
      return;
    }
    setGoogleLoading(true);
    promptAsync();
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
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <Image source={barberBookLogo} style={styles.logo} resizeMode="contain" />
          <Text style={[styles.appName, { color: colors.text }]}>BarberBook</Text>
        </View>

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
            title="Login"
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

          <View style={styles.orRow}>
            <View style={[styles.orLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.orText, { color: colors.textSecondary }]}>OR</Text>
            <View style={[styles.orLine, { backgroundColor: colors.border }]} />
          </View>

          <TouchableOpacity
            style={[
              styles.googleBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
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
                <Ionicons name="logo-google" size={22} color={colors.text} />
                <Text style={[styles.googleBtnText, { color: colors.text }]}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Don't have an account?{' '}
            <Text
              style={[styles.link, { color: colors.primary }]}
              onPress={() => navigation.navigate('register')}
            >
              Register
            </Text>
          </Text>

          <Button
            title="Continue as Guest"
            onPress={handleGuest}
            loading={guestLoading}
            disabled={loading}
            variant="primary"
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
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  appName: {
    ...typography.subtitle,
    fontSize: fontSizes.xxl,
  },
  form: {
    marginBottom: spacing.lg,
  },
  primaryBtn: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  forgotLink: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginBottom: spacing.lg,
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
    minHeight: 48,
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
  },
  copyright: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});

export default Login;
