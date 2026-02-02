/**
 * Shop reviews: rating summary, sort, list of ReviewCards, Write a Review.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Layout from '../../components/Layout/Layout';
import api from '../../services/api';
import { RatingBreakdown } from '../../components/reviews/RatingBreakdown';
import { ReviewCard } from '../../components/reviews/ReviewCard';
import { WriteReviewModal } from '../../components/reviews/WriteReviewModal';
import EmptyState from '../../components/common/EmptyState';
import { SkeletonList, SkeletonReviewRow } from '../../components/common/Skeleton';
import { useToast } from '../../components/common/Toast';
import { useTheme } from '../../context/ThemeContext';
import { colors as themeColorsStatic, fontSizes, spacing, typography } from '../../theme';

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest' },
  { key: 'highest', label: 'Highest' },
  { key: 'lowest', label: 'Lowest' },
  { key: 'verified', label: 'Verified only' },
];

export default function ReviewsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const toast = useToast();
  const { colors: themeColors } = useTheme();
  const shopId = route.params?.shopId;
  const [summary, setSummary] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sort, setSort] = useState('newest');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const bookingId = route.params?.bookingId;
  const orderId = route.params?.orderId;

  const fetchSummary = useCallback(async () => {
    if (!shopId) return;
    try {
      const { data } = await api.get(`/barbershops/${shopId}/rating-summary/`);
      setSummary(data);
    } catch (e) {
      setSummary({ average_rating: 0, total_reviews: 0, rating_breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });
    }
  }, [shopId]);

  const fetchReviews = useCallback(async () => {
    if (!shopId) return;
    try {
      const params = { sort };
      if (verifiedOnly || sort === 'verified') params.verified = 'true';
      const { data } = await api.get(`/barbershops/${shopId}/reviews/`, { params });
      setReviews(data.results || []);
    } catch (e) {
      setReviews([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [shopId, sort, verifiedOnly]);

  const load = useCallback(() => {
    setLoading(true);
    fetchSummary();
    fetchReviews();
  }, [fetchSummary, fetchReviews]);

  React.useEffect(() => {
    load();
  }, [shopId, sort, verifiedOnly]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSummary().then(() => fetchReviews());
  };

  const handleWriteReview = () => {
    setEditingReview(null);
    setModalVisible(true);
  };

  const handleSubmitReview = async (payload) => {
    setSubmitting(true);
    try {
      if (payload.reviewId) {
        await api.patch(`/reviews/${payload.reviewId}/`, {
          rating: payload.rating,
          comment: payload.comment,
        });
        toast.show('Review updated', { type: 'success' });
      } else {
        await api.post('/reviews/', {
          rating: payload.rating,
          comment: payload.comment,
          booking_id: payload.bookingId ?? undefined,
          order_id: payload.orderId ?? undefined,
        });
        toast.show('Review posted!', { type: 'success' });
      }
      setModalVisible(false);
      onRefresh();
    } catch (e) {
      const msg = e.response?.data?.detail ?? e.response?.data?.message ?? e.message ?? 'Failed to submit review.';
      if (e.response?.status === 400 && /already|duplicate/i.test(String(msg))) {
        toast.show('You already reviewed this booking', { type: 'error' });
      } else {
        toast.show(msg, { type: 'error' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setEditingReview(item);
    setModalVisible(true);
  };

  const handleDelete = async (item) => {
    try {
      await api.delete(`/reviews/${item.id}/`);
      onRefresh();
    } catch (e) {
      // ignore
    }
  };

  const renderItem = ({ item }) => (
    <ReviewCard
      item={item}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );

  return (
    <Layout>
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        {summary && (
          <RatingBreakdown
            averageRating={summary.average_rating}
            totalReviews={summary.total_reviews}
            ratingBreakdown={summary.rating_breakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }}
            onWriteReview={handleWriteReview}
            showWriteButton={true}
          />
        )}
        <View style={styles.sortRow}>
          {SORT_OPTIONS.map((opt) => {
            const active = opt.key === 'verified' ? verifiedOnly : sort === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.sortChip, active && styles.sortChipActive]}
                onPress={() => {
                  if (opt.key === 'verified') {
                    setVerifiedOnly(!verifiedOnly);
                    setSort('newest');
                  } else {
                    setSort(opt.key);
                    if (opt.key !== 'verified') setVerifiedOnly(false);
                  }
                }}
              >
                <Text style={[styles.sortText, active && styles.sortTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {loading ? (
          <SkeletonList items={5} renderItem={() => <SkeletonReviewRow />} style={styles.list} />
        ) : (
          <FlatList
            data={reviews}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <EmptyState
                icon="comment-outline"
                title="No reviews yet"
                message="Be the first to leave a review!"
                actionLabel="Write a Review"
                onAction={handleWriteReview}
              />
            }
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[themeColors.primary]} />
            }
          />
        )}
      </View>
      <WriteReviewModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setEditingReview(null); }}
        onSubmit={handleSubmitReview}
        bookingId={bookingId}
        orderId={orderId}
        editReview={editingReview}
        loading={submitting}
      />
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.md },
  sortRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  sortChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    backgroundColor: themeColorsStatic.gray200,
  },
  sortChipActive: { backgroundColor: themeColorsStatic.primary },
  sortText: { fontSize: fontSizes.sm, color: themeColorsStatic.text },
  sortTextActive: { color: themeColorsStatic.white, fontWeight: '600' },
  loader: { marginTop: spacing.xl },
  list: { paddingBottom: spacing.xxl },
});
