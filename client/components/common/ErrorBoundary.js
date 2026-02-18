/**
 * ErrorBoundary – catches JS errors and shows a friendly "Something went wrong" screen.
 * Try Again button resets error state. Logs to console (dev). Theme-aware for dark mode.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { fontSizes, spacing, borderRadius } from '../../theme';

function ErrorBoundaryView({ onReset, error }) {
  const { colors } = useTheme();
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: fontSizes.xl,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    message: {
      fontSize: fontSizes.base,
      color: colors.error || 'red',
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    button: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.primary,
      borderRadius: borderRadius.md,
    },
    buttonText: {
      color: colors.white,
      fontSize: fontSizes.base,
      fontWeight: '600',
    },
  });
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debug Error:</Text>
      <Text style={styles.message}>
        {error?.toString() || "Unknown error"}
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={onReset}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Try again"
      >
        <Text style={styles.buttonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

export class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (__DEV__) {
      console.error('ErrorBoundary:', error, errorInfo);
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorBoundaryView onReset={this.reset} error={this.state.error} />;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
