import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Dimensions,
  Pressable,
} from 'react-native';
import Carousel from 'react-native-x-carousel';
import { BannerData } from '../../data/BannerData';
import { colors, fontSizes, spacing, borderRadius, typography } from '../../theme';

const { width } = Dimensions.get('window');

const PaginationDots = ({ total = 1, activeIndex = 0 }) => (
  <View style={styles.pagination}>
    {Array.from({ length: total }).map((_, index) => (
      <View
        key={index}
        style={[
          styles.dot,
          index === activeIndex && styles.dotActive,
        ]}
      />
    ))}
  </View>
);

const Banner = () => {
  const renderItem = (data) => (
    <View key={data._id} style={styles.cardContainer}>
      <Pressable onPress={() => {}} style={({ pressed }) => [styles.pressable, pressed && styles.pressablePressed]}>
        <Image style={styles.cardImage} source={data.coverImageUri} resizeMode="cover" />
        <View style={[styles.cornerLabel, { backgroundColor: data.cornerLabelColor }]}>
          <Text style={styles.cornerLabelText}>{data.cornerLabelText}</Text>
        </View>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <Carousel
        pagination={(props) => <PaginationDots {...props} />}
        renderItem={renderItem}
        data={BannerData}
        loop
        autoplay
      />
    </View>
  );
};

export default Banner;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  cardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width,
  },
  pressable: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  pressablePressed: {
    opacity: 0.95,
  },
  cardImage: {
    width: width * 0.88,
    height: width * 0.38,
    borderRadius: borderRadius.lg,
  },
  cornerLabel: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderTopLeftRadius: borderRadius.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  cornerLabelText: {
    fontSize: fontSizes.xs,
    color: colors.white,
    fontWeight: '600',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gray400,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
