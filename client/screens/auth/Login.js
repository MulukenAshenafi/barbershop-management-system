import React, { useState } from 'react';
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
} from 'react-native';
import InputBox from '../../components/Form/InputBox';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useToast } from '../../components/common/Toast';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { loginWithEmail } from '../../services/authService';
import { fontSizes, spacing, borderRadius, typography } from '../../theme';

const barberBookLogo = require('../../assets/Logo — BarberBook Brand.jpeg');

const Login = ({ navigation, route }) => {
  const { colors } = useTheme();
  const toast = useToast();
  const { checkAuth } = useAuth();
  const [email, setEmail] = useState(route?.params?.email ?? '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <Image source={barberBookLogo} style={styles.logo} resizeMode="contain" />
          <Text style={[styles.welcomeTitle, { color: colors.text }]}>Welcome back</Text>
          <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>Sign in to continue</Text>
        </View>

        <Card style={styles.card}>
          <InputBox
            placeholder="Email"
            value={email}
            setValue={setEmail}
            autoComplete="email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <InputBox
            placeholder="Password"
            value={password}
            setValue={setPassword}
            inputType="password"
          />
          <Button
            title="Sign in"
            onPress={handleLogin}
            loading={loading}
            fullWidth
            style={styles.primaryBtn}
          />
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Don't have an account?{' '}
            <Text
              style={[styles.link, { color: colors.primary }]}
              onPress={() => navigation.navigate('register')}
            >
              Sign up
            </Text>
          </Text>
        </Card>

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
    width: 100,
    height: 100,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  welcomeTitle: {
    ...typography.subtitle,
    marginBottom: spacing.xs,
  },
  welcomeSubtitle: {
    ...typography.bodySmall,
  },
  card: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  primaryBtn: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  helperText: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
  link: { fontWeight: '600' },
  copyright: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});

export default Login;
