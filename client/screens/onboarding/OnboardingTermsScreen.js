import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    Platform,
    StatusBar,
    Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../components/common/Toast';
import Button from '../../components/common/Button';
import {
    typography,
    fontSizes,
    spacing,
    borderRadius,
    shadows,
} from '../../theme';

const useNativeDriver = Platform.OS !== 'web';

const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL || '';
const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL || '';

export default function OnboardingTermsScreen() {
    const navigation = useNavigation();
    const { colors, isDark } = useTheme();
    const toast = useToast();
    const insets = useSafeAreaInsets();

    const [accepted, setAccepted] = useState(false);
    const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
    const checkScale = useRef(new Animated.Value(1)).current;

    const toggleAccepted = useCallback(() => {
        setAccepted((prev) => {
            const next = !prev;
            Animated.sequence([
                Animated.timing(checkScale, {
                    toValue: 0.8,
                    duration: 80,
                    useNativeDriver,
                }),
                Animated.spring(checkScale, {
                    toValue: 1,
                    tension: 300,
                    friction: 10,
                    useNativeDriver,
                }),
            ]).start();
            return next;
        });
    }, [checkScale]);

    const handleScroll = useCallback(
        ({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const isEnd =
                layoutMeasurement.height + contentOffset.y >= contentSize.height - 40;
            if (isEnd && !hasScrolledToEnd) setHasScrolledToEnd(true);
        },
        [hasScrolledToEnd]
    );

    const handleContinue = () => {
        if (!accepted) {
            toast.show('Please accept the Terms & Policies to continue', { type: 'error' });
            return;
        }
        navigation.navigate('onboarding-welcome');
    };

    const openLink = (url, label) => {
        if (url) Linking.openURL(url).catch(() => toast.show(`Could not open ${label}`, { type: 'error' }));
        else toast.show(`${label} link not configured`, { type: 'error' });
    };

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: colors.background,
                    paddingTop: insets.top + spacing.md,
                    paddingBottom: insets.bottom,
                },
            ]}
        >
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={colors.background}
            />

            {/* Header */}
            <View style={styles.header}>
                <Ionicons name="shield-checkmark" size={28} color={colors.primary} />
                <Text style={[styles.title, { color: colors.text }]}>Terms & Policies</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    IMPORTANT – PLEASE READ CAREFULLY
                </Text>
            </View>

            {/* Terms Content */}
            <View
                style={[
                    styles.termsCard,
                    {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                    },
                    shadows.sm,
                ]}
            >
                <ScrollView
                    style={styles.termsScroll}
                    contentContainerStyle={styles.termsContent}
                    showsVerticalScrollIndicator={true}
                    onScroll={handleScroll}
                    scrollEventThrottle={200}
                >
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Safety: Your Interactions with Other Members
                    </Text>
                    <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>
                        You agree to treat other users in a courteous and respectful manner,
                        both on and off our application and to be respectful when
                        communicating with our team. Any form of harassment, hate speech, or
                        inappropriate behavior will result in immediate account suspension.
                    </Text>

                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Other Members' Content
                    </Text>
                    <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>
                        Although BarberBook reserves the right to review and remove content
                        that violates this Agreement, such content is the sole
                        responsibility of the member who posts it, and BarberBook cannot
                        guarantee that all content will comply with this Agreement. If you
                        see content on the application that violates this Agreement, please
                        report it within the application.
                    </Text>

                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Booking & Cancellation Policy
                    </Text>
                    <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>
                        Appointments can be cancelled up to 2 hours before the scheduled
                        time without penalty. Late cancellations or no-shows may result in a
                        fee at the discretion of the barbershop. BarberBook acts as a
                        platform and is not responsible for service quality provided by
                        individual barbershops.
                    </Text>

                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Payment & Refunds
                    </Text>
                    <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>
                        All payments processed through the app are secure and encrypted.
                        Refund requests are handled on a case-by-case basis and must be
                        submitted within 48 hours of the appointment. BarberBook does not
                        store your payment card details.
                    </Text>

                    <View style={styles.linksRow}>
                        <TouchableOpacity
                            onPress={() => openLink(PRIVACY_URL, 'Privacy Policy')}
                            style={[styles.linkChip, { backgroundColor: colors.gray200 }]}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="document-text-outline" size={16} color={colors.primary} />
                            <Text style={[styles.linkText, { color: colors.primary }]}>Privacy Policy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => openLink(TERMS_URL, 'Terms of Use')}
                            style={[styles.linkChip, { backgroundColor: colors.gray200 }]}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="document-text-outline" size={16} color={colors.primary} />
                            <Text style={[styles.linkText, { color: colors.primary }]}>Terms of Use</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>

            {/* Accept Checkbox + Continue */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={toggleAccepted}
                    activeOpacity={0.8}
                >
                    <Animated.View
                        style={[
                            styles.checkbox,
                            {
                                borderColor: accepted ? colors.primary : colors.gray400,
                                backgroundColor: accepted ? colors.primary : 'transparent',
                                transform: [{ scale: checkScale }],
                            },
                        ]}
                    >
                        {accepted && (
                            <Ionicons name="checkmark" size={16} color={colors.white} />
                        )}
                    </Animated.View>
                    <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                        I accept the Terms & Policies
                    </Text>
                </TouchableOpacity>

                <Button
                    title="Accept & Continue"
                    onPress={handleContinue}
                    variant="primary"
                    fullWidth
                    disabled={!accepted}
                    style={styles.acceptBtn}
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
    header: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        ...typography.title,
        marginTop: spacing.sm,
    },
    subtitle: {
        ...typography.caption,
        marginTop: spacing.xs,
        fontWeight: '600',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    termsCard: {
        flex: 1,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        overflow: 'hidden',
    },
    termsScroll: {
        flex: 1,
    },
    termsContent: {
        padding: spacing.lg,
        paddingBottom: spacing.xl,
    },
    sectionTitle: {
        ...typography.body,
        fontWeight: '700',
        marginTop: spacing.lg,
        marginBottom: spacing.xs,
    },
    sectionBody: {
        ...typography.bodySmall,
        lineHeight: 22,
    },
    linksRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.xl,
    },
    linkChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.full,
    },
    linkText: {
        fontSize: fontSizes.sm,
        fontWeight: '600',
    },
    footer: {
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        marginRight: spacing.sm,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxLabel: {
        ...typography.body,
        fontWeight: '500',
    },
    acceptBtn: {
        minHeight: 52,
    },
});
