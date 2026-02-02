import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Switch,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Layout from '../../components/Layout/Layout';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { colors as themeColorsFallback, fontSizes, spacing, typography } from '../../theme';


const PreferenceRow = ({ label, value, onValueChange, colors }) => (
  <View style={styles.row}>
    <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: colors.gray300, true: colors.primary }}
      thumbColor={colors.white}
    />
  </View>
);

const NotificationPreferences = () => {
  const { colors: themeColors } = useTheme();
  const colors = themeColors ?? themeColorsFallback;
  const [prefs, setPrefs] = useState({
    notifications_enabled: true,
    notify_booking_confirmations: true,
    notify_24h_reminders: true,
    notify_1h_reminders: true,
    notify_orders: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPrefs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('notifications/preferences/');
      const p = res.data?.preferences ?? {};
      setPrefs({
        notifications_enabled: p.notifications_enabled !== false,
        notify_booking_confirmations: p.notify_booking_confirmations !== false,
        notify_24h_reminders: p.notify_24h_reminders !== false,
        notify_1h_reminders: p.notify_1h_reminders !== false,
        notify_orders: p.notify_orders !== false,
      });
    } catch (e) {
      // keep defaults
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPrefs();
  }, [fetchPrefs]);

  const update = async (key, value) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaving(true);
    try {
      await api.patch('notifications/preferences/', next);
    } catch (e) {
      setPrefs(prefs);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Layout>
    );
  }

  return (
    <Layout>
      <ScrollView style={[styles.scroll, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Notification settings</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Control which push notifications you receive. Disabling "All notifications" turns off all
          pushes.
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <PreferenceRow
            colors={colors}
            label="All notifications"
            value={prefs.notifications_enabled}
            onValueChange={(v) => update('notifications_enabled', v)}
          />
          <PreferenceRow
            colors={colors}
            label="Booking confirmations"
            value={prefs.notify_booking_confirmations}
            onValueChange={(v) => update('notify_booking_confirmations', v)}
          />
          <PreferenceRow
            colors={colors}
            label="24 hours before appointment"
            value={prefs.notify_24h_reminders}
            onValueChange={(v) => update('notify_24h_reminders', v)}
          />
          <PreferenceRow
            colors={colors}
            label="1 hour before appointment"
            value={prefs.notify_1h_reminders}
            onValueChange={(v) => update('notify_1h_reminders', v)}
          />
          <PreferenceRow
            colors={colors}
            label="Order updates"
            value={prefs.notify_orders}
            onValueChange={(v) => update('notify_orders', v)}
          />
        </View>
        {saving && (
          <View style={styles.saving}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.savingText, { color: colors.textSecondary }]}>Saving…</Text>
          </View>
        )}
      </ScrollView>
    </Layout>
  );
};

export default NotificationPreferences;

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { ...typography.sectionTitle, marginBottom: spacing.xs },
  subtitle: {
    fontSize: fontSizes.sm,
    color: themeColorsFallback.textSecondary,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: themeColorsFallback.card,
    borderRadius: 8,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: themeColorsFallback.gray200,
  },
  label: { fontSize: fontSizes.base, color: themeColorsFallback.text },
  saving: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  savingText: { fontSize: fontSizes.sm, color: themeColorsFallback.textSecondary },
});
