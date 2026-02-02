/**
 * Skeleton loaders with shimmer effect.
 * Variants: Skeleton.Text, Skeleton.Card, Skeleton.Avatar, Skeleton.List
 */
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing, Platform } from 'react-native';

const useNativeDriver = Platform.OS !== 'web';

const SHIMMER_DURATION = 1200;

function useShimmer() {
  const translateX = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: 1,
          duration: SHIMMER_DURATION,
          useNativeDriver,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(translateX, {
          toValue: -1,
          duration: 0,
          useNativeDriver,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [translateX]);

  return translateX;
}

/**
 * Base skeleton box with shimmer overlay. Uses theme-like gray (works in light/dark when passed).
 */
export function SkeletonBox({ width = '100%', height = 20, style, backgroundColor, highlightColor }) {
  const translateX = useShimmer();
  const bg = backgroundColor ?? '#E9ECEF';
  const highlight = highlightColor ?? 'rgba(255,255,255,0.4)';

  return (
    <View style={[styles.box, { width, height, backgroundColor: bg }, style]} overflow="hidden">
      <Animated.View
        style={[
          styles.shimmer,
          {
            backgroundColor: highlight,
            transform: [
              {
                translateX: translateX.interpolate({
                  inputRange: [-1, 1],
                  outputRange: [-200, 200],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
}

export function SkeletonText({ lines = 1, width, style }) {
  const w = width ?? (lines === 1 ? '80%' : '100%');
  return (
    <View style={[styles.textRow, style]}>
      {lines === 1 ? (
        <SkeletonBox height={14} width={w} />
      ) : (
        Array.from({ length: lines }).map((_, i) => (
          <SkeletonBox
            key={i}
            height={14}
            width={i === lines - 1 && lines > 1 ? '60%' : '100%'}
            style={{ marginTop: i === 0 ? 0 : 8 }}
          />
        ))
      )}
    </View>
  );
}

export function SkeletonAvatar({ size = 48 }) {
  return (
    <View style={styles.avatarWrap}>
      <SkeletonBox width={size} height={size} style={[styles.avatar, { width: size, height: size }]} />
    </View>
  );
}

export function SkeletonCard({ style }) {
  return (
    <View style={[styles.card, style]}>
      <SkeletonBox height={120} style={styles.cardImage} />
      <SkeletonBox width="70%" height={16} style={styles.cardLine1} />
      <SkeletonBox width="50%" height={14} style={styles.cardLine2} />
      <SkeletonBox width="30%" height={14} style={styles.cardLine3} />
    </View>
  );
}

/**
 * Placeholder list of skeleton rows (e.g. for appointments, orders, reviews).
 * @param {number} items - Number of placeholder rows
 * @param {function} renderItem - Optional (index) => ReactNode for custom row; default is SkeletonCard
 */
export function SkeletonList({ items = 5, renderItem, style }) {
  return (
    <View style={[styles.list, style]}>
      {Array.from({ length: items }).map((_, i) => (
        <View key={i}>
          {renderItem ? renderItem(i) : <SkeletonCard />}
        </View>
      ))}
    </View>
  );
}

/** Appointment-style row (one line avatar + lines) */
export function SkeletonAppointmentRow() {
  return (
    <View style={styles.appointmentRow}>
      <SkeletonBox width={56} height={56} style={styles.appointmentAvatar} />
      <View style={styles.appointmentContent}>
        <SkeletonBox width="70%" height={16} />
        <SkeletonBox width="50%" height={14} style={{ marginTop: 8 }} />
        <SkeletonBox width="40%" height={14} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

/** Review-style row (avatar + text lines) */
export function SkeletonReviewRow() {
  return (
    <View style={styles.reviewRow}>
      <SkeletonAvatar size={40} />
      <View style={styles.reviewContent}>
        <SkeletonBox width={120} height={14} />
        <SkeletonBox width="100%" height={12} style={{ marginTop: 8 }} />
        <SkeletonBox width="90%" height={12} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
  },
  textRow: {},
  avatarWrap: {},
  avatar: { borderRadius: 9999 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardImage: {
    borderRadius: 8,
    width: '100%',
  },
  cardLine1: { marginTop: 8 },
  cardLine2: { marginTop: 4 },
  cardLine3: { marginTop: 4 },
  list: {},
  appointmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  appointmentAvatar: { borderRadius: 28 },
  appointmentContent: { flex: 1, marginLeft: 12 },
  reviewRow: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  reviewContent: { flex: 1, marginLeft: 12 },
});

export default SkeletonBox;
