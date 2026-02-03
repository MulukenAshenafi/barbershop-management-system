/**
 * Email sign-in / verification: enter email, then either continue with password
 * or receive a sign-in link (like most standard apps).
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import InputBox from '../../components/Form/InputBox';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { useToast } from '../../components/common/Toast';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  sendEmailSignInLink,
  isFirebaseConfigured,
} from '../../services/authService';
import { fontSizes, spacing, typography } from '../../theme';

export default function EmailSignInScreen({ navigation }) {
  const { colors } = useTheme();
  const toast = useToast();
  const { checkAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  const handleContinueWithPassword = () => {
    if (!email?.trim()) {
      toast.show('Enter your email first', { type: 'error' });
      return;
    }
    navigation.navigate('login', { email: email.trim().toLowerCase() });
  };

  const handleSendLink = async () => {
    if (!email?.trim()) {
      toast.show('Enter your email', { type: 'error' });
      return;
    }
    setLoading(true);
    const { success, error } = await sendEmailSignInLink(email.trim());
    setLoading(false);
    if (success) {
      setLinkSent(true);
      toast.show('Check your email for the sign-in link', { type: 'success' });
    } else {
      toast.show(error || 'Failed to send link', { type: 'error' });
    }
  };

  const firebaseReady = isFirebaseConfigured();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
            <Text style={[styles.headerBackLabel, { color: colors.text }]}>Back</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        >
          <Text style={[styles.pageTitle, { color: colors.text }]}>Sign in with email</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {firebaseReady
              ? 'Enter your email. You can sign in with your password or receive a sign-in link.'
              : 'Enter your email and continue with your password.'}
          </Text>

          <Card style={styles.card}>
          <InputBox
            placeholder="Email"
            value={email}
            setValue={setEmail}
            autoComplete="email"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!linkSent}
          />

          {linkSent ? (
            <View style={styles.linkSentBox}>
              <Text style={[styles.linkSentText, { color: colors.textSecondary }]}>
                We sent a sign-in link to {email}. Open the link in this device to sign in.
              </Text>
              <TouchableOpacity onPress={() => setLinkSent(false)}>
                <Text style={[styles.linkText, { color: colors.primary }]}>Use a different email</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {firebaseReady && (
                <>
                  <Button
                    title="Send sign-in link to my email"
                    onPress={handleSendLink}
                    loading={loading}
                    fullWidth
                    variant="primary"
                    style={styles.btn}
                  />
                  <Text style={[styles.or, { color: colors.textSecondary }]}>or</Text>
                </>
              )}
              <Button
                title="Continue with password"
                onPress={handleContinueWithPassword}
                fullWidth
                variant={firebaseReady ? 'outline' : 'primary'}
                style={styles.btn}
                disabled={!!loading}
              />
            </>
          )}
        </Card>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerBackLabel: {
    fontSize: fontSizes.base,
    fontWeight: '500',
  },
  scrollView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl + 80,
    minHeight: 300,
  },
  pageTitle: {
    ...typography.subtitle,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
    marginBottom: spacing.lg,
  },
  card: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  btn: {
    marginTop: spacing.sm,
  },
  or: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginVertical: spacing.sm,
  },
  linkSentBox: {
    marginTop: spacing.md,
  },
  linkSentText: {
    ...typography.bodySmall,
    marginBottom: spacing.sm,
  },
  linkText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
});
