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
import { requestPasswordReset } from '../../services/authService';
import { fontSizes, spacing, typography } from '../../theme';

export default function ForgotPasswordScreen({ navigation }) {
  const toast = useToast();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email?.trim()) {
      toast.show('Please enter your email', { type: 'error' });
      return;
    }
    setLoading(true);
    const { success, error, message } = await requestPasswordReset(email.trim());
    setLoading(false);
    if (success) {
      setSent(true);
      toast.show(message || 'If an account exists, you will receive a reset link.', { type: 'success' });
    } else if (error) {
      toast.show(error, { type: 'error' });
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Reset password</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter your email and we'll send you a link to reset your password.
          </Text>
        </View>

        <Card style={styles.card}>
          {!sent ? (
            <>
              <InputBox
                placeholder="Email"
                value={email}
                setValue={setEmail}
                autoComplete="email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Button
                title="Send reset link"
                onPress={handleSubmit}
                loading={loading}
                disabled={loading}
                fullWidth
                style={styles.primaryBtn}
              />
            </>
          ) : (
            <Text style={[styles.sentText, { color: colors.textSecondary }]}>
              Check your email for a password reset link. You can close this screen and sign in after resetting.
            </Text>
          )}
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Remember your password?{' '}
            <Text style={[styles.link, { color: colors.primary }]} onPress={() => navigation.navigate('login')}>
              Sign in
            </Text>
          </Text>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: { ...typography.subtitle, marginBottom: spacing.xs },
  subtitle: { ...typography.bodySmall, textAlign: 'center' },
  card: { padding: spacing.lg },
  primaryBtn: { marginTop: spacing.sm, marginBottom: spacing.md },
  sentText: { ...typography.bodySmall, marginBottom: spacing.md, textAlign: 'center' },
  helperText: { ...typography.bodySmall, textAlign: 'center' },
  link: { fontWeight: '600' },
});
