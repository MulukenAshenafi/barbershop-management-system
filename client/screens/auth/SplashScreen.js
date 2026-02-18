import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Easing,
    Image,
    Platform,
    StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { typography, spacing, borderRadius, shadows } from '../../theme';

const useNativeDriver = Platform.OS !== 'web';
const barberBookLogo = require('../../assets/Logo — BarberBook Brand.jpeg');

const SPLASH_DURATION = 2500;
const FADE_DURATION = 800;
const SHIMMER_DURATION = 1400;

export default function SplashScreen() {
    const navigation = useNavigation();
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const textFade = useRef(new Animated.Value(0)).current;
    const shimmerAnim = useRef(new Animated.Value(-1)).current;

    useEffect(() => {
        // Logo entrance: fade + scale
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: FADE_DURATION,
                easing: Easing.out(Easing.cubic),
                useNativeDriver,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 60,
                friction: 12,
                useNativeDriver,
            }),
        ]).start();

        // Text fade-in after logo
        setTimeout(() => {
            Animated.timing(textFade, {
                toValue: 1,
                duration: 500,
                easing: Easing.out(Easing.ease),
                useNativeDriver,
            }).start();
        }, 400);

        // Shimmer loop on the brand name text
        const shimmerLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: SHIMMER_DURATION,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver,
                }),
                Animated.timing(shimmerAnim, {
                    toValue: -1,
                    duration: 0,
                    useNativeDriver,
                }),
            ])
        );
        shimmerLoop.start();

        // Auto-navigate
        const timer = setTimeout(() => {
            navigation.replace('welcome');
        }, SPLASH_DURATION);

        return () => {
            clearTimeout(timer);
            shimmerLoop.stop();
        };
    }, [navigation, fadeAnim, scaleAnim, textFade, shimmerAnim]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

            <Animated.View
                style={[
                    styles.logoContainer,
                    {
                        opacity: fadeAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                {/* Logo image — displayed naturally at full width */}
                <View style={[styles.logoCard, { backgroundColor: colors.surface }, shadows.md]}>
                    <Image source={barberBookLogo} style={styles.logo} resizeMode="contain" />
                </View>
            </Animated.View>

            <Animated.Text
                style={[
                    styles.brandName,
                    {
                        color: colors.text,
                        opacity: textFade,
                        transform: [
                            {
                                translateY: textFade.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [12, 0],
                                }),
                            },
                        ],
                    },
                ]}
            >
                BarberBook
            </Animated.Text>

            <Animated.Text
                style={[
                    styles.tagline,
                    {
                        color: colors.textSecondary,
                        opacity: textFade,
                    },
                ]}
            >
                Your grooming, simplified.
            </Animated.Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoCard: {
        width: 160,
        height: 100,
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 150,
        height: 90,
    },
    brandName: {
        ...typography.hero,
        marginTop: spacing.lg,
        letterSpacing: -0.8,
    },
    tagline: {
        ...typography.bodySmall,
        marginTop: spacing.xs,
        letterSpacing: 0.3,
    },
});
