import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Platform,
    StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/common/Button';
import {
    typography,
    fontSizes,
    spacing,
    borderRadius,
    shadows,
} from '../../theme';

const useNativeDriver = Platform.OS !== 'web';

const FEATURES = [
    {
        icon: 'cut-outline',
        title: 'Book Appointments',
        subtitle: 'Find barbershops near you and book with your favorite barber in seconds.',
    },
    {
        icon: 'cart-outline',
        title: 'Browse Services & Products',
        subtitle: 'Discover grooming services and premium products all in one place.',
    },
    {
        icon: 'notifications-outline',
        title: 'Stay Updated',
        subtitle: 'Get notified about your bookings, offers, and messages instantly.',
    },
];

function FeatureRow({ icon, title, subtitle, colors, delay }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(24)).current;

    useEffect(() => {
        const timer = setTimeout(() => {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 450,
                    useNativeDriver,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 450,
                    useNativeDriver,
                }),
            ]).start();
        }, delay);
        return () => clearTimeout(timer);
    }, [fadeAnim, slideAnim, delay]);

    return (
        <Animated.View
            style={[
                styles.featureRow,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                },
            ]}
        >
            <View
                style={[
                    styles.featureIconCircle,
                    { backgroundColor: colors.primary + '18' },
                ]}
            >
                <Ionicons name={icon} size={26} color={colors.primary} />
            </View>
            <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>{title}</Text>
                <Text style={[styles.featureSubtitle, { color: colors.textSecondary }]}>
                    {subtitle}
                </Text>
            </View>
        </Animated.View>
    );
}

export default function OnboardingWelcomeScreen() {
    const navigation = useNavigation();
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();

    const titleFade = useRef(new Animated.Value(0)).current;
    const titleSlide = useRef(new Animated.Value(-16)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(titleFade, {
                toValue: 1,
                duration: 500,
                useNativeDriver,
            }),
            Animated.timing(titleSlide, {
                toValue: 0,
                duration: 500,
                useNativeDriver,
            }),
        ]).start();
    }, [titleFade, titleSlide]);

    const handleContinue = () => {
        navigation.navigate('notification-permission');
    };

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: colors.background,
                    paddingTop: insets.top + spacing.xxl,
                    paddingBottom: insets.bottom + spacing.md,
                },
            ]}
        >
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={colors.background}
            />

            {/* Title Section */}
            <Animated.View
                style={[
                    styles.titleBlock,
                    {
                        opacity: titleFade,
                        transform: [{ translateY: titleSlide }],
                    },
                ]}
            >
                <Text style={[styles.welcomeLabel, { color: colors.primary }]}>Welcome to</Text>
                <Text style={[styles.heroTitle, { color: colors.text }]}>BarberBook</Text>
                <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
                    Everything you need for the perfect grooming experience.
                </Text>
            </Animated.View>

            {/* Features */}
            <View style={styles.featuresList}>
                {FEATURES.map((feature, i) => (
                    <FeatureRow
                        key={feature.title}
                        icon={feature.icon}
                        title={feature.title}
                        subtitle={feature.subtitle}
                        colors={colors}
                        delay={300 + i * 200}
                    />
                ))}
            </View>

            {/* CTA */}
            <View style={styles.ctaContainer}>
                <Button
                    title="Get Started"
                    onPress={handleContinue}
                    variant="primary"
                    fullWidth
                    style={styles.ctaBtn}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: spacing.lg,
    },
    titleBlock: {
        marginBottom: spacing.xl,
    },
    welcomeLabel: {
        ...typography.body,
        fontWeight: '600',
        marginBottom: spacing.xs,
        letterSpacing: 0.5,
    },
    heroTitle: {
        fontSize: 36,
        fontWeight: '800',
        letterSpacing: -1,
        marginBottom: spacing.sm,
    },
    heroSubtitle: {
        ...typography.body,
        lineHeight: 24,
    },
    featuresList: {
        flex: 1,
        justifyContent: 'center',
        gap: spacing.lg,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    featureIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        ...typography.body,
        fontWeight: '700',
        marginBottom: 2,
    },
    featureSubtitle: {
        ...typography.bodySmall,
        lineHeight: 20,
    },
    ctaContainer: {
        paddingTop: spacing.lg,
    },
    ctaBtn: {
        minHeight: 52,
    },
});
