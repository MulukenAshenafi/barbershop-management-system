/**
 * Single review card: avatar, name, verified badge, stars, comment, edit/delete if editable.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { StarRating } from '../common/StarRating';
import { Card } from '../common/Card';
import { OptimizedImage } from '../common/OptimizedImage';
import { useTheme } from '../../context/ThemeContext';
import { fontSizes, spacing, typography } from '../../theme';

const MAX_LINES = 3;
const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png';

export function ReviewCard({
  item,
  onEdit,
  onDelete,
  onPress,
}) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const name = item.customer_name ?? item.customerName ?? 'Customer';
  const avatar = item.customer_avatar ?? item.customerAvatar ?? DEFAULT_AVATAR;
  const isVerified = item.is_verified ?? item.isVerified ?? false;
  const isEditable = item.is_editable ?? item.isEditable ?? false;
  const comment = item.comment ?? '';
  const rating = item.rating ?? 0;
  const createdAt = item.created_at ?? item.createdAt;
  const dateStr = createdAt
    ? (() => {
        const d = new Date(createdAt);
        const now = new Date();
        const diffMs = now - d;
        const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return d.toLocaleDateString();
      })()
    : '';

  const handleDelete = () => {
    Alert.alert(
      'Delete review',
      'Are you sure you want to delete this review?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete?.(item) },
      ]
    );
  };

  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <OptimizedImage source={{ uri: avatar }} style={styles.avatar} />
        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {name}
            </Text>
            {isVerified && (
              <View style={styles.verifiedBadge}>
                <AntDesign name="checkcircle" size={14} color={colors.success} />
                <Text style={[styles.verifiedText, { color: colors.success }]}>Verified</Text>
              </View>
            )}
          </View>
          <Text style={[styles.date, { color: colors.textSecondary }]}>{dateStr}</Text>
        </View>
        {isEditable && (
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => onEdit?.(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.actionBtn}
            >
              <AntDesign name="edit" size={18} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.actionBtn}
            >
              <AntDesign name="delete" size={18} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}
      </View>
      <StarRating rating={rating} size={16} />
      {comment ? (
        <TouchableOpacity
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.8}
          style={styles.commentWrap}
        >
          <Text
            style={[styles.comment, { color: colors.text }]}
            numberOfLines={expanded ? undefined : MAX_LINES}
          >
            {comment}
          </Text>
          {comment.length > 100 && (
            <Text style={[styles.more, { color: colors.accent }]}>
              {expanded ? 'Show less' : 'Show more'}
            </Text>
          )}
        </TouchableOpacity>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    ...typography.sectionTitle,
    fontSize: fontSizes.base,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  verifiedText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
  date: {
    ...typography.caption,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    padding: spacing.xs,
  },
  commentWrap: {
    marginTop: spacing.sm,
  },
  comment: {
    ...typography.body,
    fontSize: fontSizes.sm,
    lineHeight: 22,
  },
  more: {
    fontSize: fontSizes.sm,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
});

export default ReviewCard;
