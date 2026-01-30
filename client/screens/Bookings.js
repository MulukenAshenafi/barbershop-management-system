import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Layout from '../components/Layout/Layout';
import Card from '../components/common/Card';
import { ServicesData } from '../data/ServicesData';
import { colors, spacing, typography, borderRadius } from '../theme';

const Bookings = () => {
  const services = Array.isArray(ServicesData) ? ServicesData : [];

  return (
    <Layout>
      <View style={styles.header}>
        <Text style={styles.title}>Bookings</Text>
        <Text style={styles.subtitle}>Choose a service to book</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          {services.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>Loading services…</Text>
            </Card>
          ) : (
            services.map((service) => (
              <Card key={service.id ?? service._id} style={styles.serviceCard}>
                <Text style={styles.serviceTitle}>{service.name}</Text>
                {service.description ? (
                  <Text style={styles.serviceDescription}>{service.description}</Text>
                ) : null}
                <TouchableOpacity
                  style={styles.bookBtn}
                  activeOpacity={0.9}
                >
                  <Text style={styles.bookBtnText}>Book now</Text>
                </TouchableOpacity>
              </Card>
            ))
          )}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help & support</Text>
          <Card style={styles.supportCard}>
            <TouchableOpacity style={styles.supportBtn} activeOpacity={0.9}>
              <Text style={styles.supportBtnText}>Contact support</Text>
            </TouchableOpacity>
          </Card>
        </View>
      </ScrollView>
    </Layout>
  );
};

export default Bookings;

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.sectionTitle,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodySmall,
  },
  scroll: {
    paddingBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: spacing.md,
    color: colors.textSecondary,
  },
  serviceCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  serviceTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  serviceDescription: {
    ...typography.bodySmall,
    marginBottom: spacing.md,
  },
  bookBtn: {
    backgroundColor: colors.secondary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
  },
  bookBtnText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  emptyCard: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.bodySmall,
  },
  supportCard: {
    padding: spacing.md,
  },
  supportBtn: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  supportBtnText: {
    color: colors.primary,
    fontWeight: '600',
  },
});
