import React, { useRef } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  View,
  Animated,
  Platform,
} from 'react-native';
import {
  colors,
  fontSizes,
  spacing,
  borderRadius,
  shadows,
  touchTargetMin,
} from '../../theme';

const useNativeDriver = Platform.OS !== 'web';

let haptics = null;
try {
  haptics = require('expo-haptics');
} catch (_) {}

const variants = {
  primary: {
    bg: colors.primary,
    text: colors.white,
  },
  secondary: {
    bg: colors.accent,
    text: colors.white,
  },
  danger: {
    bg: colors.error,
    text: colors.white,
  },
  outline: {
    bg: 'transparent',
    text: colors.primary,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  ghost: {
    bg: colors.gray200,
    text: colors.text,
  },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth,
  style,
  textStyle,
  minHeight = touchTargetMin,
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver,
      speed: 50,
      bounciness: 4,
    }).start();
    if (haptics?.impactAsync) {
      haptics.impactAsync(haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver,
      speed: 50,
      bounciness: 8,
    }).start();
  };

  const v = variants[variant] || variants.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={1}
      style={[
        styles.base,
        {
          backgroundColor: v.bg,
          borderWidth: v.borderWidth ?? 0,
          borderColor: v.borderColor,
          minHeight,
          opacity: disabled && !loading ? 0.6 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
    >
      <Animated.View style={[styles.inner, { transform: [{ scale }] }]}>
        {loading ? (
          <ActivityIndicator size="small" color={v.text} />
        ) : (
          <Text style={[styles.text, { color: v.text }, textStyle]}>{title}</Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  inner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: fontSizes.base,
    fontWeight: '600',
  },
});

export default Button;
