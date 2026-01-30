import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Layout from '../../components/Layout/Layout';
import Card from '../../components/common/Card';
import { NotificationBadge } from '../../components/common/NotificationBadge';
import { OptimizedImage } from '../../components/common/OptimizedImage';
import { AntDesign } from '@expo/vector-icons';
import { loadUserData, UserData as initialUserData } from '../../data/UserData';
import { clearAuth } from '../../services/auth';
import NotificationService from '../../services/notifications';
import { useTheme } from '../../context/ThemeContext';
import {
  colors,
  fontSizes,
  spacing,
  borderRadius,
  typography,
} from '../../theme';

const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png';

function resolveAvatarUri(profilePic) {
  if (!profilePic) return DEFAULT_AVATAR;
  if (typeof profilePic === 'string') return profilePic;
  if (Array.isArray(profilePic) && profilePic.length > 0) {
    const first = profilePic[0];
    return typeof first === 'string' ? first : (first?.url ?? DEFAULT_AVATAR);
  }
  return DEFAULT_AVATAR;
}

const THEME_LABELS = { light: 'Light', dark: 'Dark', system: 'System' };

const Account = ({ navigation }) => {
  const { themeMode, setThemeMode, isDark } = useTheme();
  const [user, setUser] = useState(initialUserData);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleAppearancePress = () => {
    Alert.alert(
      'Appearance',
      'Choose theme',
      [
        { text: 'Light', onPress: () => setThemeMode('light') },
        { text: 'Dark', onPress: () => setThemeMode('dark') },
        { text: 'System', onPress: () => setThemeMode('system') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  useEffect(() => {
    const fetchUserData = async () => {
      await loadUserData();
      setUser({ ...initialUserData });
    };
    fetchUserData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      NotificationService.getUnreadCount().then(setUnreadCount);
    }, [])
  );

  const handleSetPreferences = () => {
    Alert.alert(
      'Set preferences',
      'Would you like to set your preferences now?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Set preferences',
          onPress: () =>
            navigation.navigate('SetPreferences_Specialization', { user }),
        },
      ]
    );
  };

  const handleSetSpecialization = () => {
    Alert.alert(
      'Set specialization',
      'Would you like to set your specialization now?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Set specialization',
          onPress: () =>
            navigation.navigate('SetPreferences_Specialization', { user }),
        },
      ]
    );
  };

  const menuItems = [
    {
      icon: 'edit',
      label: 'Edit profile',
      onPress: () => navigation.navigate('profile', { user }),
    },
    {
      icon: 'bars',
      label: 'My orders',
      onPress: () => navigation.navigate('myorders', { id: user._id }),
    },
    {
      icon: 'calendar',
      label: 'My appointments',
      onPress: () => navigation.navigate('myappointments', { id: user._id }),
    },
    {
      icon: 'bell',
      label: 'Notifications',
      onPress: () => navigation.navigate('notifications'),
      badge: unreadCount,
    },
    {
      icon: 'setting',
      label: 'Notification settings',
      onPress: () => navigation.navigate('notification-preferences'),
    },
    {
      icon: 'bulb',
      label: 'Appearance',
      onPress: handleAppearancePress,
      rightLabel: THEME_LABELS[themeMode] || 'System',
    },
  ];

  if (user.role === 'Admin') {
    menuItems.push({
      icon: 'windows',
      label: 'Admin panel',
      onPress: () => navigation.navigate('adminPanel', { id: user._id }),
    });
  }

  return (
    <Layout>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileSection}>
          <OptimizedImage
            source={{ uri: resolveAvatarUri(user.profilePic) }}
            style={styles.avatar}
            resizeMode="cover"
          />
          <Text style={styles.greeting}>
            Hi <Text style={styles.nameHighlight}>{user.name}</Text>
          </Text>
          <Text style={styles.email}>{user.email}</Text>
          {user.phone ? (
            <Text style={styles.meta}>Contact: {user.phone}</Text>
          ) : null}
          {user.location ? (
            <Text style={styles.meta}>Location: {user.location}</Text>
          ) : null}
          {user.role === 'Customer' &&
            (user.preferences ? (
              <Text style={styles.meta}>Preferences: {user.preferences}</Text>
            ) : (
              <TouchableOpacity onPress={handleSetPreferences}>
                <Text style={styles.link}>Set preferences</Text>
              </TouchableOpacity>
            ))}
          {user.role === 'Barber' &&
            (user.specialization ? (
              <Text style={styles.meta}>Specialization: {user.specialization}</Text>
            ) : (
              <TouchableOpacity onPress={handleSetSpecialization}>
                <Text style={styles.link}>Set specialization</Text>
              </TouchableOpacity>
            ))}
        </View>

        <Card style={styles.menuCard}>
          <Text style={styles.menuTitle}>Account</Text>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuRow}
              onPress={item.onPress}
              activeOpacity={0.8}
            >
              <AntDesign
                name={item.icon}
                size={20}
                color={colors.gray600}
                style={styles.menuIcon}
              />
              <Text style={styles.menuLabel}>{item.label}</Text>
              {item.rightLabel ? (
                <Text style={styles.menuRightLabel}>{item.rightLabel}</Text>
              ) : null}
              {item.badge != null && item.badge > 0 ? (
                <NotificationBadge count={item.badge} style={styles.badge} />
              ) : null}
              <AntDesign name="right" size={16} color={colors.gray400} />
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.menuRow, styles.logoutRow]}
            onPress={async () => {
              await NotificationService.unregister();
              await clearAuth();
              navigation.reset({ index: 0, routes: [{ name: 'login' }] });
            }}
            activeOpacity={0.8}
          >
            <AntDesign name="logout" size={20} color={colors.error} />
            <Text style={styles.logoutText}>Log out</Text>
            <AntDesign name="right" size={16} color={colors.gray400} />
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </Layout>
  );
};

export default Account;

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xxl,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    resizeMode: 'cover',
    marginBottom: spacing.md,
    backgroundColor: colors.gray200,
  },
  greeting: {
    ...typography.sectionTitle,
    marginBottom: spacing.xs,
  },
  nameHighlight: {
    color: colors.success,
  },
  email: {
    ...typography.bodySmall,
    marginBottom: spacing.xs,
  },
  meta: {
    ...typography.bodySmall,
    marginTop: spacing.xs,
  },
  link: {
    color: colors.secondary,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
  },
  menuTitle: {
    ...typography.body,
    fontWeight: '600',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  menuIcon: {
    marginRight: spacing.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: fontSizes.base,
    color: colors.text,
  },
  menuRightLabel: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  badge: {
    marginRight: spacing.sm,
  },
  logoutRow: {
    borderBottomWidth: 0,
  },
  logoutText: {
    flex: 1,
    fontSize: fontSizes.base,
    color: colors.error,
    fontWeight: '600',
  },
});
