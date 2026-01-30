import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Button from './Button';
import { useTheme } from '../../context/ThemeContext';
import { fontSizes, spacing, typography } from '../../theme';

export function EmptyState({
  icon = 'inbox',
  title = 'Nothing here yet',
  message,
  actionLabel,
  onAction,
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name={icon}
        size={56}
        color={colors.textSecondary}
        style={styles.icon}
      />
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {message ? (
        <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          style={styles.button}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    minHeight: 200,
  },
  icon: { marginBottom: spacing.md },
  title: {
    ...typography.sectionTitle,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  message: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  button: { minWidth: 160 },
});

export default EmptyState;
