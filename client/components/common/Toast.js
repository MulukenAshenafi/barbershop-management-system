/**
 * Toast – slide from top, auto-dismiss after 3s. Theme-aware (light/dark).
 * Use via useToast().show(message, { type: 'success'|'error'|'info' }).
 *
 * Toast vs Alert (project rule):
 * - Use toast for non-blocking feedback: success messages, validation errors, network errors.
 * - Use Alert.alert for confirmations (e.g. "Delete?"), critical blocking messages, or when
 *   the user must acknowledge before continuing.
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Text, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const DEFAULT_DURATION = 3000;

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const { colors, isDark } = useTheme();
  const [message, setMessage] = useState(null);
  const [type, setType] = useState('info'); // 'info' | 'success' | 'error'
  const translateY = React.useRef(new Animated.Value(-100)).current;

  const show = useCallback((msg, options = {}) => {
    setMessage(msg);
    setType(options.type || 'info');
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      speed: 50,
      bounciness: 8,
    }).start();

    const duration = options.duration ?? DEFAULT_DURATION;
    const t = setTimeout(() => {
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setMessage(null));
    }, duration);
    return () => clearTimeout(t);
  }, [translateY]);

  const hide = useCallback(() => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setMessage(null));
  }, [translateY]);

  const bgColor =
    type === 'success' ? colors.success
    : type === 'error' ? colors.error
    : isDark ? colors.surface : colors.primary;
  const textColor = type === 'info' ? (isDark ? colors.text : '#fff') : '#fff';

  return (
    <ToastContext.Provider value={{ show, hide }}>
      {children}
      {message != null && (
        <Animated.View
          style={[
            styles.toast,
            { backgroundColor: bgColor, transform: [{ translateY }] },
          ]}
        >
          <Text style={[styles.text, { color: textColor }]} numberOfLines={2}>{message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  return ctx || { show: () => {}, hide: () => {} };
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    zIndex: 9999,
  },
  text: {
    fontSize: 14,
    textAlign: 'center',
  },
});