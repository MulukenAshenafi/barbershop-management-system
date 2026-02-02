import React from 'react';
import { ScrollView, StyleSheet, View, Text } from 'react-native';
import FooterServicesCard from './FooterServicesCard';
import { ServicesData } from '../../data/ServicesData';
import Layout from '../Layout/Layout';
import EmptyState from '../common/EmptyState';
import { colors, spacing, typography } from '../../theme';

const FooterServices = () => {
  const services = Array.isArray(ServicesData) ? ServicesData : [];

  return (
    <Layout>
      <View style={styles.container}>
        <Text style={styles.title}>Services</Text>
        {services.length === 0 ? (
          <EmptyState
            icon="scissors-cutting"
            title="No services yet"
            message="Check back later for our offerings."
          />
        ) : (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {services.map((s) => (
              <FooterServicesCard key={s._id ?? s.id} s={s} />
            ))}
          </ScrollView>
        )}
      </View>
    </Layout>
  );
};

export default FooterServices;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: spacing.md,
  },
  title: {
    ...typography.sectionTitle,
    marginBottom: spacing.md,
  },
  scroll: {
    paddingBottom: spacing.xxl,
  },
});
