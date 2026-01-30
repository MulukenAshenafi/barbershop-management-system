import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text } from 'react-native';
import ProductCard from './ProductCard';
import api from '../../services/api';
import { useCart } from '../../context/CartContext';
import { LoadingScreen } from '../common/LoadingScreen';
import { ErrorView } from '../common/ErrorView';
import { SkeletonCard } from '../common/SkeletonBox';
import EmptyState from '../common/EmptyState';
import { colors, spacing } from '../../theme';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addItem } = useCart();

  useEffect(() => {
    let cancelled = false;
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('product/get-all');
        if (!cancelled) {
          const list = res.data?.products;
          setProducts(Array.isArray(list) ? list : []);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.response?.data?.message || 'Failed to load products');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProducts();
    return () => { cancelled = true; };
  }, []);

  const retry = () => {
    setError(null);
    setLoading(true);
    api.get('product/get-all')
      .then((res) => {
        const list = res.data?.products;
        setProducts(Array.isArray(list) ? list : []);
      })
      .catch(() => setLoading(false))
      .finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <View style={styles.skeletonWrap}>
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }
  if (error) {
    return <ErrorView message={error} onRetry={retry} />;
  }
  if (products.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <EmptyState
          icon="shopping-outline"
          title="No products yet"
          message="Check back later for our catalog."
        />
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollView}
    >
      {products.map((p) => (
        <ProductCard key={p._id ?? p.id} p={p} onAddToCart={addItem} />
      ))}
    </ScrollView>
  );
};

export default Products;

const styles = StyleSheet.create({
  scrollView: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  skeletonWrap: {
    padding: spacing.md,
  },
  emptyWrap: {
    minHeight: 180,
  },
});
