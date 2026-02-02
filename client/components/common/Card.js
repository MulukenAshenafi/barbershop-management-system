import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { spacing, borderRadius, shadows } from '../../theme';

export function Card({
  children,
  onPress,
  style,
  padding = spacing.md,
  noShadow,
}) {
  const { colors } = useTheme();
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={onPress ? 0.9 : 1}
      style={[
        styles.card,
        { backgroundColor: colors.card, padding },
        !noShadow && shadows.sm,
        style,
      ]}
    >
      {children}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
});

export default Card;
