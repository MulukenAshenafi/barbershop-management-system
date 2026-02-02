import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Card from '../common/Card';
import Button from '../common/Button';
import { OptimizedImage } from '../common/OptimizedImage';
import { useToast } from '../common/Toast';
import { useTheme } from '../../context/ThemeContext';
import {
  fontSizes,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../../theme';

const ProductCard = ({ p, onAddToCart }) => {
  const navigation = useNavigation();
  const toast = useToast();
  const { colors } = useTheme();
  const id = p._id ?? p.id;
  const imageUrl = p.imageUrl ?? p.images?.[0]?.url ?? p.image ?? '';
  const name = p.name ?? '';
  const description = p.description ?? '';
  const price = p.price ?? 0;

  const handleDetails = () => {
    navigation.navigate('productDetails', { _id: id, product: p });
  };

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(
        {
          _id: id,
          name,
          price,
          imageUrl,
          image: imageUrl,
        },
        1
      );
      toast.show(`${name} added to cart`, { type: 'success' });
    }
  };

  return (
    <View style={styles.wrapper}>
      <Card style={styles.card} noShadow>
        {imageUrl ? (
          <OptimizedImage
            source={{ uri: imageUrl }}
            style={styles.cardImage}
            resizeMode="cover"
          />
        ) : (
          <Image
            style={styles.cardImage}
            resizeMode="cover"
            source={require('../../assets/icon.png')}
          />
        )}
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
          {name}
        </Text>
        <Text style={[styles.cardDescription, { color: colors.textSecondary }]} numberOfLines={2}>
          {description.substring(0, 40)}
          {description.length > 40 ? '…' : ''}
        </Text>
        <Text style={[styles.price, { color: colors.primary }]}>{Number(price).toFixed(2)} ETB</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.detailsBtn, { backgroundColor: colors.primary }]}
            onPress={handleDetails}
            activeOpacity={0.9}
          >
            <Text style={styles.btnText}>Details</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cartBtn, { backgroundColor: colors.secondary }]}
            onPress={handleAddToCart}
            activeOpacity={0.9}
          >
            <Text style={styles.btnText}>Add to cart</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </View>
  );
};

export default ProductCard;

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: spacing.sm,
    marginVertical: spacing.xs,
    width: 168,
  },
  card: {
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  cardImage: {
    height: 100,
    width: '100%',
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
  },
  cardTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: fontSizes.xs,
    marginBottom: spacing.xs,
  },
  price: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailsBtn: {
    flex: 1,
    height: 36,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBtn: {
    flex: 1,
    height: 36,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
});
