/**
 * Rating summary: large average, star display, progress bars per star level, total count, "Write a Review" CTA.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StarRating } from '../common/StarRating';
import { Button } from '../common/Button';
import { colors, fontSizes, spacing, typography } from '../../theme';

export function RatingBreakdown({
  averageRating = 0,
  totalReviews = 0,
  ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  onWriteReview,
  showWriteButton = true,
}) {
  const total = totalReviews || Object.values(ratingBreakdown).reduce((a, b) => a + b, 0);
  const maxCount = Math.max(1, ...Object.values(ratingBreakdown));

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.avgBlock}>
          <Text style={styles.avgNumber}>{Number(averageRating).toFixed(1)}</Text>
          <StarRating rating={averageRating} size={22} />
          <Text style={styles.totalText}>
            {total} {total === 1 ? 'review' : 'reviews'}
          </Text>
        </View>
        <View style={styles.barsBlock}>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingBreakdown[star] ?? 0;
            const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
            return (
              <View key={star} style={styles.barRow}>
                <Text style={styles.barLabel}>{star}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${pct}%` }]} />
                </View>
                <Text style={styles.barCount}>{count}</Text>
              </View>
            );
          })}
        </View>
      </View>
      {showWriteButton && onWriteReview && (
        <Button
          title="Write a Review"
          onPress={onWriteReview}
          variant="outline"
          style={styles.writeBtn}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  avgBlock: {
    alignItems: 'center',
    marginRight: spacing.lg,
    minWidth: 80,
  },
  avgNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  totalText: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  barsBlock: {
    flex: 1,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  barLabel: {
    fontSize: fontSizes.sm,
    color: colors.text,
    width: 12,
    marginRight: spacing.sm,
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.gray200,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.warning,
    borderRadius: 4,
  },
  barCount: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    width: 24,
    textAlign: 'right',
    marginLeft: spacing.sm,
  },
  writeBtn: {
    marginTop: spacing.sm,
  },
});

export default RatingBreakdown;
