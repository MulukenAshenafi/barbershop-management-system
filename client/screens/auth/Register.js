import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
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
import { registerWithEmail } from '../../services/authService';
import { fontSizes, spacing, typography } from '../../theme';

const Register = ({ navigation }) => {
  const toast = useToast();
  const { colors } = useTheme();
  const { checkAuth } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password) {
      toast.show('Please fill in all fields', { type: 'error' });
      return;
    }
    if (password.length < 6) {
      toast.show('Password must be at least 6 characters', { type: 'error' });
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
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Create account</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Join BarberBook — verify your email after signing up.
          </Text>
        </View>

        <Card style={styles.card}>
          <InputBox
            placeholder="First name"
            value={firstName}
            setValue={setFirstName}
            autoComplete="name-given"
          />
          <InputBox
            placeholder="Last name"
            value={lastName}
            setValue={setLastName}
            autoComplete="name-family"
          />
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
            title="Register"
            onPress={handleSignUp}
            loading={loading}
            disabled={loading}
            fullWidth
            style={styles.primaryBtn}
          />
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Already have an account?{' '}
            <Text style={[styles.link, { color: colors.primary }]} onPress={() => navigation.navigate('login')}>
              Sign in
            </Text>
          </Text>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: { ...typography.subtitle, marginBottom: spacing.xs },
  subtitle: { ...typography.bodySmall, textAlign: 'center' },
  card: {
    padding: spacing.lg,
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
});

export default Register;
