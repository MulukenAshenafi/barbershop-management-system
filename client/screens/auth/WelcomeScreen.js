import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
  Image,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/common/Button';
import config from '../../config';
import { isAuthenticated } from '../../services/auth';
import { exchangeGoogleToken, guestLogin } from '../../services/authService';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  fontSizes,
  spacing,
  typography,
  borderRadius,
  shadows,
} from '../../theme';

WebBrowser.maybeCompleteAuthSession();

const useNativeDriver = Platform.OS !== 'web';
const barberBookLogo = require('../../assets/Logo — BarberBook Brand.jpeg');

export default function WelcomeScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const { checkAuth } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(null);

  // Entrance animations
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(20)).current;

  // Use fixed Expo proxy URL so Google Cloud Web client (https-only) always matches; avoid barberbook://
  const redirectUri = config.googleRedirectUri;

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID,
    redirectUri,
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 600,
        useNativeDriver,
      }),
      Animated.timing(contentSlide, {
        toValue: 0,
        duration: 600,
        useNativeDriver,
      }),
    ]).start();
  }, [contentFade, contentSlide]);

  useEffect(() => {
    if (config.forceWelcome) return;
    let cancelled = false;
    isAuthenticated().then((ok) => {
      if (!cancelled && ok) {
        navigation.replace('home');
      }
    });
    return () => { cancelled = true; };
  }, [navigation]);

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      const idToken = authentication?.idToken || authentication?.accessToken;
      if (idToken) {
        handleGoogleExchange(idToken);
      }
    } else if (response?.type === 'error') {
      setLoading(null);
      Alert.alert('Google Sign-In', 'Sign-in failed. Please try again.');
    }
    // 'cancel' or 'dismiss' just stops loading
    if (response?.type === 'cancel' || response?.type === 'dismiss') {
      setLoading(null);
    }
  }, [response]);

  const handleGoogleExchange = async (token) => {
    const { success, error } = await exchangeGoogleToken(token);
    setLoading(null);
    if (success) {
      await checkAuth();
      navigation.reset({ index: 0, routes: [{ name: 'home' }] });
    } else {
      Alert.alert('Google Sign-In', error || 'Sign-in failed');
    }
  };

  const handleGoogle = () => {
    if (!request) {
      Alert.alert('Google Sign-In', 'Google Sign-In is initializing. Please try again in a moment.');
      return;
    }
    setLoading('google');
    // Force useProxy/WebBrowser flow
    promptAsync({ useProxy: true });
  };

  const handleSignIn = () => {
    navigation.navigate('login');
  };

  const handleCreateAccount = () => {
    navigation.navigate('register');
  };

  const handleGuest = async () => {
    setLoading('guest');
    const { success, error } = await guestLogin();
    setLoading(null);
    if (success) {
      await checkAuth();
      navigation.reset({ index: 0, routes: [{ name: 'home' }] });
    } else {
      Alert.alert('Guest Sign-In', error || 'Something went wrong.');
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + spacing.xxl,
          paddingBottom: insets.bottom + spacing.md,
        },
      ]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: contentFade,
            transform: [{ translateY: contentSlide }],
          },
        ]}
      >
        {/* Logo + Branding */}
        <View style={styles.brandSection}>
          <View style={[styles.logoCard, { backgroundColor: colors.surface }, shadows.md]}>
            <Image source={barberBookLogo} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={[styles.heroText, { color: colors.text }]}>
            Book your cut.{'\n'}No hassle.
          </Text>
          <Text style={[styles.subheadText, { color: colors.textSecondary }]}>
            Find barbershops, book appointments, and shop products — all in one app.
          </Text>
        </View>

        {/* CTA Buttons */}
        <View style={styles.ctaSection}>
          <Button
            title="Sign in with Email"
            onPress={handleSignIn}
            variant="primary"
            fullWidth
            style={styles.ctaBtn}
            disabled={!!loading}
          />

          <TouchableOpacity
            style={[
              styles.createAccountBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.gray300,
              },
              !!loading && { opacity: 0.7 },
            ]}
            onPress={handleCreateAccount}
            disabled={!!loading}
            activeOpacity={0.9}
          >
            <Ionicons name="person-add-outline" size={18} color={colors.text} />
            <Text style={[styles.createAccountText, { color: colors.text }]}>Create account</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textSecondary }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Google Sign-In */}
          <TouchableOpacity
            style={[
              styles.socialBtn,
              {
                backgroundColor: colors.card,
                borderColor: colors.gray300,
              },
              loading && { opacity: 0.7 },
            ]}
            onPress={handleGoogle}
            disabled={!!loading}
            activeOpacity={0.9}
          >
            {loading === 'google' ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color="#4285F4" />
                <Text style={[styles.socialBtnText, { color: colors.text }]}>
                  Continue with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Guest */}
          <Button
            title="Continue as Guest"
            onPress={handleGuest}
            variant="ghost"
            fullWidth
            style={styles.guestBtn}
            disabled={!!loading}
            loading={loading === 'guest'}
          />
        </View>

        {/* Barbershop hint */}
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Barbershop owner? Sign in to list your shop and manage bookings.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  content: {
    flex: 1,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'space-between',
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoCard: {
    width: 180,
    height: 110,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logo: {
    width: 170,
    height: 100,
  },
  heroText: {
    ...typography.hero,
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: spacing.sm,
  },
  subheadText: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  ctaSection: {
    gap: spacing.sm,
  },
  ctaBtn: {
    minHeight: 52,
    borderRadius: borderRadius.md,
  },
  createAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 52,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
  },
  createAccountText: {
    fontSize: fontSizes.base,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    ...typography.bodySmall,
    paddingHorizontal: spacing.md,
    fontWeight: '500',
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 52,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
  },
  socialBtnText: {
    fontSize: fontSizes.base,
    fontWeight: '600',
  },
  guestBtn: {
    minHeight: 48,
    borderRadius: borderRadius.md,
  },
  hint: {
    ...typography.caption,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingTop: spacing.md,
    lineHeight: 18,
  },
});
