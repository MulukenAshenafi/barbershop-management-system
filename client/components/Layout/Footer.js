import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { fontSizes, spacing, shadows, touchTargetMin } from '../../theme';

const navItems = [
  { name: 'home', label: 'Home', icon: 'home' },
  { name: 'services', label: 'Services', icon: 'appstore' },
  { name: 'bookings', label: 'Bookings', icon: 'calendar' },
  { name: 'account', label: 'Account', icon: 'user' },
  { name: 'cart', label: 'Cart', icon: 'shopping-cart' },
];

const Footer = () => {
  const { colors } = useTheme();
  const route = useRoute();
  const navigation = useNavigation();

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      {navItems.map((item) => {
        const isActive = route.name === item.name;
        return (
          <TouchableOpacity
            key={item.name}
            style={styles.menuContainer}
            onPress={() => navigation.navigate(item.name)}
            activeOpacity={0.8}
          >
            <AntDesign
              name={item.icon}
              size={22}
              color={isActive ? colors.secondary : colors.textSecondary}
              style={styles.icon}
            />
            <Text
              style={[
                styles.label,
                { color: isActive ? colors.secondary : colors.textSecondary },
                isActive && styles.labelActive,
              ]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    paddingBottom: spacing.sm + 4,
    borderTopWidth: 1,
    ...shadows.sm,
  },
  menuContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
    minHeight: touchTargetMin,
  },
  icon: {
    marginBottom: 2,
  },
  label: { fontSize: fontSizes.xs, fontWeight: '500' },
  labelActive: { fontWeight: '600' },
});

export default Footer;
