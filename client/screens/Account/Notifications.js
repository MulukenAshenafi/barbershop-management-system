import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import Layout from '../../components/Layout/Layout';
import api from '../../services/api';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { ErrorView } from '../../components/common/ErrorView';
import EmptyState from '../../components/common/EmptyState';
import { colors, fontSizes, spacing, borderRadius, typography } from '../../theme';

const NotificationRow = ({ item, onMarkRead }) => {
  const isRead = item.isRead ?? item.is_read;
  return (
    <TouchableOpacity
      style={[styles.row, !isRead && styles.rowUnread]}
      onPress={() => onMarkRead(item)}
      activeOpacity={0.8}
    >
      <Text style={[styles.message, !isRead && styles.messageUnread]}>
        {item.message}
      </Text>
      <Text style={styles.date}>
        {item.date ? new Date(item.date).toLocaleString() : ''}
      </Text>
    </TouchableOpacity>
  );
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchNotifications = useCallback(async (pageNum = 1, append = false) => {
    try {
      setError(null);
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);
      const res = await api.get('notifications/', {
        params: { page: pageNum, page_size: 20 },
      });
      const data = res.data;
      const list = data.notifications ?? data.results ?? [];
      if (append) {
        setNotifications((prev) => [...prev, ...list]);
      } else {
        setNotifications(list);
      }
      setPage(pageNum);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  React.useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications(1);
  };

  const handleMarkRead = async (item) => {
    const id = item._id ?? item.id;
    if (!id) return;
    try {
      await api.patch(`notifications/read/${id}`);
      setNotifications((prev) =>
        prev.map((n) =>
          (n._id ?? n.id) === id ? { ...n, isRead: true, is_read: true } : n
        )
      );
    } catch (e) {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('notifications/read-all');
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, is_read: true }))
      );
    } catch (e) {
      // ignore
    }
  };

  if (loading) return <LoadingScreen message="Loading notifications…" />;
  if (error) return <ErrorView message={error} onRetry={() => fetchNotifications(1)} />;

  return (
    <Layout>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.heading}>Notifications</Text>
          {notifications.some((n) => !(n.isRead ?? n.is_read)) && (
            <TouchableOpacity
              onPress={handleMarkAllRead}
              style={styles.markAllBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
        {notifications.length === 0 ? (
          <EmptyState
            icon="bell-outline"
            title="No notifications yet"
            message="We'll notify you when something new happens."
          />
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => String(item._id ?? item.id)}
            renderItem={({ item }) => (
              <NotificationRow item={item} onMarkRead={handleMarkRead} />
            )}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.footer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : null
            }
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Layout>
  );
};

export default Notifications;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  heading: {
    ...typography.sectionTitle,
  },
  markAllBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  markAllText: {
    color: colors.accent,
    fontWeight: '600',
    fontSize: fontSizes.sm,
  },
  list: {
    paddingBottom: spacing.xxl,
  },
  row: {
    padding: spacing.md,
    marginVertical: spacing.xs,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
  },
  rowUnread: {
    backgroundColor: colors.gray100,
  },
  message: {
    fontSize: fontSizes.base,
    color: colors.text,
  },
  messageUnread: {
    fontWeight: '600',
  },
  date: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  footer: {
    padding: spacing.md,
    alignItems: 'center',
  },
});
