import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSizes, spacing } from '../../theme';

/**
 * Small badge showing unread count. Hide when count is 0.
 */
export function NotificationBadge({ count, style }) {
  const n = Number(count) || 0;
  if (n <= 0) return null;
  const label = n > 99 ? '99+' : String(n);
  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.text} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  text: {
    color: '#fff',
    fontSize: fontSizes.xs,
    fontWeight: '700',
  },
});

export default NotificationBadge;
