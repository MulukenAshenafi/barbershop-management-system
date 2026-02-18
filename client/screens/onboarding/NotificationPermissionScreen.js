import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Easing,
    Platform,
    StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/common/Button';
import NotificationService from '../../services/notifications';
import {
    typography,
    spacing,
    borderRadius,
    shadows,
} from '../../theme';

const useNativeDriver = Platform.OS !== 'web';

export default function NotificationPermissionScreen() {
    const navigation = useNavigation();
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const ringOpacity = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        // Card entrance
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                easing: Easing.out(Easing.cubic),
                useNativeDriver,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 60,
                friction: 10,
                useNativeDriver,
            }),
        ]).start();

        // Bell pulse loop
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.08,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver,
                }),
            ])
        );
        pulse.start();

        // Ring glow loop
        const ringGlow = Animated.loop(
            Animated.sequence([
                Animated.timing(ringOpacity, {
                    toValue: 0.15,
                    duration: 1200,
                    useNativeDriver,
                }),
                Animated.timing(ringOpacity, {
                    toValue: 0.5,
                    duration: 1200,
                    useNativeDriver,
                }),
            ])
        );
        ringGlow.start();

        return () => {
            pulse.stop();
            ringGlow.stop();
        };
    }, [fadeAnim, scaleAnim, pulseAnim, ringOpacity]);

    const handleAllow = async () => {
        try {
            await NotificationService.registerForPushNotifications();
        } catch (_) { }
        navigation.reset({ index: 0, routes: [{ name: 'home' }] });
    };

    const handleSkip = () => {
        navigation.reset({ index: 0, routes: [{ name: 'home' }] });
    };

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: colors.background,
                    paddingTop: insets.top,
                    paddingBottom: insets.bottom + spacing.md,
                },
            ]}
        >
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={colors.background}
            />

            <View style={styles.centerArea}>
                <Animated.View
                    style={[
                        styles.card,
                        {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                        shadows.md,
                    ]}
                >
                    {/* Bell Icon with Pulse */}
                    <View style={styles.iconArea}>
                        <Animated.View
                            style={[
                                styles.iconRing,
                                {
                                    backgroundColor: colors.primary,
                                    opacity: ringOpacity,
                                    transform: [{ scale: pulseAnim }],
                                },
                            ]}
                        />
                        <Animated.View
                            style={[
                                styles.iconCircle,
                                {
                                    backgroundColor: colors.primary + '1A',
                                    transform: [{ scale: pulseAnim }],
                                },
                            ]}
                        >
                            <Ionicons name="notifications" size={40} color={colors.primary} />
                        </Animated.View>
                    </View>

                    <Text style={[styles.title, { color: colors.text }]}>Stay in the Loop</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Allow notifications to get updates on your bookings, special offers, and messages from your barber.
                    </Text>

                    <View style={styles.buttonsContainer}>
                        <Button
                            title="Allow Notifications"
                            onPress={handleAllow}
                            variant="primary"
                            fullWidth
                            style={styles.allowBtn}
                        />
                        <Button
                            title="Not Now"
                            onPress={handleSkip}
                            variant="ghost"
                            fullWidth
                            style={styles.skipBtn}
                        />
                    </View>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: spacing.lg,
    },
    centerArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        width: '100%',
        maxWidth: 380,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        padding: spacing.xl,
        alignItems: 'center',
    },
    iconArea: {
        width: 96,
        height: 96,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    iconRing: {
        position: 'absolute',
        width: 96,
        height: 96,
        borderRadius: 48,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        ...typography.subtitle,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    subtitle: {
        ...typography.body,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: spacing.xl,
    },
    buttonsContainer: {
        width: '100%',
        gap: spacing.sm,
    },
    allowBtn: {
        minHeight: 52,
    },
    skipBtn: {
        minHeight: 48,
    },
});
