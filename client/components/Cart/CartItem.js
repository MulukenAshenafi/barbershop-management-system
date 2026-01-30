import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  colors,
  fontSizes,
  spacing,
  borderRadius,
  shadows,
  typography,
  touchTargetMin,
} from '../../theme';

const CartItem = ({ item, onUpdateQty, onRemove }) => {
  const qty = item.quantity || 1;
  const imageUri = item.image ?? item.imageUrl ?? '';

  const handleAdd = () => {
    if (qty < 10) onUpdateQty?.(qty + 1);
  };
  const handleMinus = () => {
    if (qty > 1) onUpdateQty?.(qty - 1);
    else onRemove?.();
  };

  return (
    <View style={styles.container}>
      <Image
        source={imageUri ? { uri: imageUri } : require('../../assets/icon.png')}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.details}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.price}>
          {(item.price || 0).toFixed(2)} ETB × {qty}
        </Text>
        <View style={styles.actions}>
          <View style={styles.qtyRow}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={handleMinus}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyText}>{qty}</Text>
            <TouchableOpacity
              style={[styles.qtyBtn, qty >= 10 && styles.qtyBtnDisabled]}
              onPress={handleAdd}
              disabled={qty >= 10}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={onRemove}
            style={styles.removeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default CartItem;

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    ...shadows.sm,
  },
  image: {
    height: 80,
    width: 80,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
    backgroundColor: colors.gray200,
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: fontSizes.base,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  price: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyBtn: {
    backgroundColor: colors.gray200,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  qtyBtnDisabled: {
    opacity: 0.5,
  },
  qtyBtnText: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.text,
  },
  qtyText: {
    fontSize: fontSizes.base,
    fontWeight: '600',
    minWidth: 28,
    textAlign: 'center',
    color: colors.text,
  },
  removeBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  removeText: {
    fontSize: fontSizes.sm,
    color: colors.error,
    fontWeight: '600',
  },
});
