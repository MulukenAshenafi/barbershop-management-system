/**
 * Post-auth enrollment gate: choose "I own a Barbershop" or "I want to book services".
 * Shown when user has no BarbershopStaff records and no customer role preference.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button } from '../../components/common/Button';
import Card from '../../components/common/Card';
import { colors, fontSizes, spacing, typography } from '../../theme';
import { setRolePreference } from '../../services/auth';

export default function EnrollmentGateScreen() {
  const navigation = useNavigation();

  const handleOwner = () => {
    navigation.replace('barbershop-registration');
  };

  const handleStaff = () => {
    navigation.replace('join-barbershop');
  };

  const handleCustomer = async () => {
    await setRolePreference('customer');
    navigation.replace('home');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How would you like to use BSBS?</Text>
      <Text style={styles.subtitle}>Choose your path to get started.</Text>

      <Card onPress={handleOwner} style={styles.card}>
        <Text style={styles.cardTitle}>I own a Barbershop</Text>
        <Text style={styles.cardDesc}>Register your shop and manage services, staff, and bookings.</Text>
        <Button title="Get started" onPress={handleOwner} variant="primary" fullWidth style={styles.btn} />
      </Card>

      <Card onPress={handleStaff} style={styles.card}>
        <Text style={styles.cardTitle}>I work at a Barbershop</Text>
        <Text style={styles.cardDesc}>Join with an invite code or search for your shop.</Text>
        <Button title="Join with invite code" onPress={handleStaff} variant="secondary" fullWidth style={styles.btn} />
      </Card>

      <Card onPress={handleCustomer} style={styles.card}>
        <Text style={styles.cardTitle}>I want to book services</Text>
        <Text style={styles.cardDesc}>Browse barbershops and book appointments as a customer.</Text>
        <Button title="Continue as customer" onPress={handleCustomer} variant="outline" fullWidth style={styles.btn} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  title: {
    ...typography.title,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  card: {
    marginBottom: spacing.lg,
  },
  cardTitle: {
    ...typography.sectionTitle,
    marginBottom: spacing.sm,
  },
  cardDesc: {
    ...typography.bodySmall,
    marginBottom: spacing.md,
  },
  btn: {
    marginTop: spacing.sm,
  },
});
