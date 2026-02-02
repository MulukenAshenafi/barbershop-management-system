import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Card from '../common/Card';
import { colors, fontSizes, spacing, typography } from '../../theme';

const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const OrderItem = ({ order }) => {
  const id = order._id ?? order.id;
  const items = order.orderItems ?? order.order_items ?? [];
  const total = order.totalAmount ?? order.total_amount ?? 0;
  const status = order.orderStatus ?? order.order_status ?? 'processing';
  const date = order.created_at ?? order.createdAt;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.orderId}>Order #{String(id).slice(-8)}</Text>
        <Text style={styles.date}>{formatDate(date)}</Text>
      </View>
      {items.length > 0 && (
        <View style={styles.items}>
          {items.map((item, idx) => (
            <Text key={idx} style={styles.itemText}>
              {item.name} × {item.quantity} — {(item.price || 0).toFixed(2)} ETB
            </Text>
          ))}
        </View>
      )}
      <Text style={styles.total}>Total: {Number(total).toFixed(2)} ETB</Text>
      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Status</Text>
        <View style={[styles.statusBadge, status === 'delivered' && styles.statusDelivered]}>
          <Text style={[styles.statusText, status === 'delivered' && styles.statusDeliveredText]}>{status}</Text>
        </View>
      </View>
    </Card>
  );
};

export default OrderItem;

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    marginBottom: spacing.sm,
  },
  orderId: {
    fontWeight: '600',
    color: colors.primary,
    fontSize: fontSizes.base,
  },
  date: {
    ...typography.bodySmall,
  },
  items: {
    marginBottom: spacing.sm,
  },
  itemText: {
    fontSize: fontSizes.sm,
    color: colors.text,
    marginVertical: 2,
  },
  total: {
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  statusLabel: {
    ...typography.bodySmall,
    marginRight: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.gray200,
  },
  statusDelivered: {
    backgroundColor: 'rgba(40, 167, 69, 0.15)',
  },
  statusText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: colors.text,
  },
  statusDeliveredText: {
    color: colors.success,
  },
});
