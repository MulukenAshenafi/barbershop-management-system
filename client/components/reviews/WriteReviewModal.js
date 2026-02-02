/**
 * Modal to write or edit a review. Requires bookingId or orderId for create.
 * Star rating (required) + comment (max 1000). Success callback with new/updated review.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StarRating } from '../common/StarRating';
import { Button } from '../common/Button';
import { useTheme } from '../../context/ThemeContext';
import { fontSizes, spacing, typography } from '../../theme';

const MAX_COMMENT = 1000;

export function WriteReviewModal({
  visible,
  onClose,
  onSubmit,
  bookingId,
  orderId,
  editReview,
  loading: externalLoading,
}) {
  const { colors } = useTheme();
  const [rating, setRating] = useState(editReview?.rating ?? 0);
  const [comment, setComment] = useState(editReview?.comment ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setRating(editReview?.rating ?? 0);
      setComment(editReview?.comment ?? '');
      setError(null);
    }
  }, [visible, editReview]);

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) {
      setError('Please select a rating (1-5 stars).');
      return;
    }
    if (!comment.trim()) {
      setError('Please write a comment.');
      return;
    }
    if (comment.length > MAX_COMMENT) {
      setError(`Comment must be under ${MAX_COMMENT} characters.`);
      return;
    }
    if (editReview) {
      setLoading(true);
      setError(null);
      try {
        await onSubmit?.({ rating, comment, reviewId: editReview.id });
        onClose?.();
      } catch (e) {
        setError(e.response?.data?.errors?.comment?.[0] || e.message || 'Failed to update.');
      } finally {
        setLoading(false);
      }
      return;
    }
    if (!bookingId && !orderId) {
      setError('Missing booking or order. Cannot submit review.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSubmit?.({ rating, comment, bookingId, orderId });
      onClose?.();
    } catch (e) {
      const msg =
        e.response?.data?.errors?.non_field_errors?.[0] ||
        e.response?.data?.errors?.booking_id?.[0] ||
        e.response?.data?.errors?.order_id?.[0] ||
        e.response?.data?.message ||
        e.message ||
        'Failed to submit review.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const isLoading = loading || externalLoading;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.content, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {editReview ? 'Edit your review' : 'Write a review'}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Text style={[styles.closeText, { color: colors.text }]}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.body}>
            <Text style={[styles.label, { color: colors.text }]}>Rating *</Text>
            <StarRating
              rating={rating}
              editable={!editReview}
              onRatingChange={setRating}
              size={32}
            />
            <Text style={[styles.label, { color: colors.text, marginTop: spacing.lg }]}>Comment *</Text>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={comment}
              onChangeText={setComment}
              placeholder="Share your experience..."
              placeholderTextColor={colors.textSecondary}
              multiline
              maxLength={MAX_COMMENT}
              editable={!isLoading}
            />
            <Text style={[styles.charCount, { color: colors.textSecondary }]}>
              {comment.length} / {MAX_COMMENT}
            </Text>
            {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
          </View>
          <View style={styles.footer}>
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Button title="Cancel" variant="ghost" onPress={onClose} style={styles.cancelBtn} />
                <Button
                  title={editReview ? 'Update' : 'Submit'}
                  onPress={handleSubmit}
                  disabled={isLoading || rating < 1 || !comment.trim()}
                  style={styles.submitBtn}
                />
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  content: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    paddingBottom: spacing.xxl + 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: { ...typography.sectionTitle },
  closeBtn: {
    padding: spacing.sm,
  },
  closeText: {
    fontSize: fontSizes.xl,
  },
  body: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.bodySmall,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: fontSizes.base,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    ...typography.caption,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  error: {
    fontSize: fontSizes.sm,
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  cancelBtn: {
    minWidth: 100,
  },
  submitBtn: {
    minWidth: 120,
  },
});

export default WriteReviewModal;
