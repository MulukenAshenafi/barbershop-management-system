import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/common/Button';
import config from '../../config';
import { isAuthenticated } from '../../services/auth';
import { exchangeGoogleToken, loginWithApple, isFirebaseConfigured } from '../../services/authService';
import { useTheme } from '../../context/ThemeContext';
import {
  fontSizes,
  spacing,
  typography,
  touchTargetMin,
} from '../../theme';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';

export default function WelcomeScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(null);
  const [googleReady, setGoogleReady] = useState(false);

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
    setGoogleReady(!!GOOGLE_CLIENT_ID && !!request);
  }, [request]);

  useEffect(() => {
    if (config.forceWelcome) return; // Stay on Welcome when force-welcome is set (e.g. for testing)
    let cancelled = false;
    isAuthenticated().then((ok) => {
      if (!cancelled && ok) {
        navigation.replace('home');
      }
    });
    return () => { cancelled = true; };
  }, [navigation]);

  useEffect(() => {
    if (response?.type !== 'success' || loading !== 'google') return;
    const params = response.params || {};
    const idToken = params.id_token || params.access_token;
    let cancelled = false;
    if (!idToken) {
      setLoading(null);
      Alert.alert('Google Sign-In', 'Could not get token. Try Email sign-in.');
      return;
    }
    exchangeGoogleToken(idToken)
      .then(({ success, error }) => {
        if (!cancelled) setLoading(null);
        if (success) navigation.reset({ index: 0, routes: [{ name: 'home' }] });
        else Alert.alert('Google Sign-In', error || 'Sign-in failed');
      })
      .catch(() => {
        if (!cancelled) setLoading(null);
        Alert.alert('Google Sign-In', 'Something went wrong. Try Email sign-in.');
      });
    return () => { cancelled = true; };
  }, [response?.type, response?.params, loading, navigation]);

  const handleGoogle = () => {
    if (!googleReady) {
      Alert.alert('Google Sign-In', 'Not configured yet. Use Email to sign in.');
      return;
    }
    setLoading('google');
    promptAsync();
  };

  const handleApple = async () => {
    if (Platform.OS !== 'ios') return;
    setLoading('apple');
    const { success, error } = await loginWithApple();
    setLoading(null);
    if (success) navigation.reset({ index: 0, routes: [{ name: 'home' }] });
    else Alert.alert('Apple Sign-In', error || 'Sign-in failed');
  };

  const handleSignIn = () => {
    navigation.navigate('email-sign-in');
  };

  const handleCreateAccount = () => {
    navigation.navigate('register');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <View style={styles.content}>
        <Text style={[styles.headline, { color: colors.text }]}>Book your cut.{'\n'}No hassle.</Text>
        <Text style={[styles.subhead, { color: colors.textSecondary }]}>
          BarberBook — find barbershops, book appointments, and shop products in one app.
        </Text>
        <Text style={[styles.barbershopHint, { color: colors.textSecondary }]}>
          Barbershop owners: sign in or create an account to list your shop and manage bookings from your account.
        </Text>

        <View style={styles.ctas}>
          {googleReady && (
            <TouchableOpacity
              style={[styles.socialBtn, { backgroundColor: colors.card, borderColor: colors.gray200 }, loading && styles.socialBtnDisabled]}
              onPress={handleGoogle}
              disabled={!!loading}
              activeOpacity={0.9}
            >
              {loading === 'google' ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <>
                  <Ionicons name="logo-google" size={22} color={colors.text} />
                  <Text style={[styles.socialBtnText, { color: colors.text }]}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.socialBtn, styles.appleBtn, { backgroundColor: colors.primary, borderColor: colors.primary }, loading && styles.socialBtnDisabled]}
              onPress={handleApple}
              disabled={!!loading}
              activeOpacity={0.9}
            >
              {loading === 'apple' ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons name="logo-apple" size={22} color={colors.white} />
                  <Text style={[styles.socialBtnText, styles.appleBtnText, { color: colors.white }]}>
                    Continue with Apple
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <Button
            title="Sign in with Email"
            onPress={handleSignIn}
            variant="primary"
            fullWidth
            style={styles.emailBtn}
            disabled={!!loading}
          />
          {isFirebaseConfigured() && (
            <TouchableOpacity
              style={[styles.socialBtn, { backgroundColor: colors.card, borderColor: colors.gray200 }]}
              onPress={() => navigation.navigate('phone-login')}
              disabled={!!loading}
              activeOpacity={0.9}
            >
              <Text style={[styles.socialBtnText, { color: colors.text }]}>Sign in with phone</Text>
            </TouchableOpacity>
          )}
          <Button
            title="Create account"
            onPress={handleCreateAccount}
            variant="outline"
            fullWidth
            style={styles.emailBtn}
            disabled={!!loading}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  content: {
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  headline: {
    ...typography.title,
    marginBottom: spacing.sm,
    lineHeight: 36,
  },
  subhead: {
    ...typography.bodySmall,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  barbershopHint: {
    ...typography.caption,
    marginBottom: spacing.xxl,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  ctas: {
    gap: spacing.md,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: touchTargetMin,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
  },
  socialBtnDisabled: {
    opacity: 0.7,
  },
  appleBtn: {},
  socialBtnText: {
    fontSize: fontSizes.base,
    fontWeight: '600',
  },
  appleBtnText: {},
  emailBtn: {
    marginTop: spacing.xs,
  },
});
