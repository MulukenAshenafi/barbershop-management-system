import React from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Header from './Header';
import Footer from './Footer';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../theme';

const Layout = ({ children, showHeader = false, showFooter = true }) => {
  const { colors } = useTheme();
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={styles.content}>
        {showHeader && <Header />}
        <View style={styles.main}>{children}</View>
      </View>
      {showFooter && (
        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
          <Footer />
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  main: { flex: 1, paddingHorizontal: spacing.md },
  footer: { width: '100%', borderTopWidth: 1 },
});

export default Layout;
