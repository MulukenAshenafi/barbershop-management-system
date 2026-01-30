import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  RefreshControl,
} from 'react-native';
import Layout from '../../components/Layout/Layout';
import api from '../../services/api';
import { ErrorView } from '../../components/common/ErrorView';
import EmptyState from '../../components/common/EmptyState';
import { SkeletonList } from '../../components/common/Skeleton';
import OrderItem from '../../components/Form/OrderItem';
import { useTheme } from '../../context/ThemeContext';
import { spacing, typography } from '../../theme';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get('order/my-orders');
      if (res.data?.success) {
        setOrders(res.data.orders || []);
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  if (error) return <ErrorView message={error} onRetry={fetchOrders} />;

  const { colors } = useTheme();

  return (
    <Layout>
      <View style={styles.container}>
        <Text style={[styles.heading, { color: colors.text }]}>My orders</Text>
        {loading ? (
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            <SkeletonList items={5} />
          </ScrollView>
        ) : (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {orders.length === 0 ? (
            <EmptyState
              icon="package-variant"
              title="No orders yet"
              message="Your order history will appear here."
            />
          ) : (
            orders.map((order) => (
              <OrderItem key={order._id ?? order.id} order={order} />
            ))
          )}
        </ScrollView>
        )}
      </View>
    </Layout>
  );
};

export default MyOrders;

const styles = StyleSheet.create({
  container: { flex: 1 },
  heading: {
    ...typography.sectionTitle,
    marginBottom: spacing.md,
  },
  list: { paddingBottom: spacing.xxl },
});
