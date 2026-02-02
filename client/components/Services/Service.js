import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text } from 'react-native';
import ServiceCard from './ServiceCard';
import api, { getApiErrorMessage } from '../../services/api';
import { SkeletonCard } from '../common/SkeletonBox';
import { ErrorView } from '../common/ErrorView';
import EmptyState from '../common/EmptyState';
import { colors, spacing } from '../../theme';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchServices = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('service/get-all');
        if (!cancelled) {
          const list = res.data?.services;
          setServices(Array.isArray(list) ? list : []);
        }
      } catch (e) {
        if (!cancelled) {
          setError(getApiErrorMessage(e, 'Failed to load services'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchServices();
    return () => { cancelled = true; };
  }, []);

  const retry = () => {
    setError(null);
    setLoading(true);
    api.get('service/get-all')
      .then((res) => {
        const list = res.data?.services;
        setServices(Array.isArray(list) ? list : []);
      })
      .catch(() => setLoading(false))
      .finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <View style={styles.skeletonWrap}>
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }
  if (error) {
    return <ErrorView message={error} onRetry={retry} />;
  }
  if (services.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <EmptyState
          icon="scissors-cutting"
          title="No services yet"
          message="Check back later for our offerings."
        />
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      contentContainerStyle={styles.container}
      showsHorizontalScrollIndicator={false}
    >
      {services.map((s) => (
        <ServiceCard key={s._id ?? s.id} s={s} />
      ))}
    </ScrollView>
  );
};

export default Services;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  skeletonWrap: {
    padding: spacing.md,
  },
  emptyWrap: {
    minHeight: 180,
  },
});
