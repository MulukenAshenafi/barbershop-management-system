import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSizes, spacing, typography } from '../../theme';

const PriceTable = ({ price, title, currency = 'ETB' }) => {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.price}>
        {Number(price).toFixed(2)} {currency}
      </Text>
    </View>
  );
};

export default PriceTable;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  title: {
    fontSize: fontSizes.base,
    fontWeight: '500',
    color: colors.text,
  },
  price: {
    fontSize: fontSizes.base,
    fontWeight: '600',
    color: colors.text,
  },
});
