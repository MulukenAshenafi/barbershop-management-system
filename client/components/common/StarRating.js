/**
 * Star rating display or editable (1-5). Optional onRatingChange for editable.
 */
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../theme';

const STAR = 'star';
const STAR_EMPTY = 'staro';

export function StarRating({
  rating = 0,
  size = 20,
  editable = false,
  onRatingChange,
}) {
  const { colors } = useTheme();
  const value = Math.max(0, Math.min(5, Number(rating) || 0));
  const fullStars = Math.floor(value);
  const hasHalf = value % 1 >= 0.5;
  const filledColor = colors.warning;
  const emptyColor = colors.textSecondary;

  const handlePress = (index) => {
    if (editable && onRatingChange && index >= 1 && index <= 5) {
      onRatingChange(index);
    }
  };

  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= fullStars || (i === fullStars + 1 && hasHalf);
        const name = filled ? STAR : STAR_EMPTY;
        const Wrapper = editable ? TouchableOpacity : View;
        return (
          <Wrapper
            key={i}
            onPress={() => handlePress(i)}
            activeOpacity={editable ? 0.7 : 1}
            style={styles.starWrap}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <AntDesign
              name={name}
              size={size}
              color={filled ? filledColor : emptyColor}
            />
          </Wrapper>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  starWrap: {
    padding: spacing.xs,
  },
});

export default StarRating;
