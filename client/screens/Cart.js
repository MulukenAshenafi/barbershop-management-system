import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';
import { useCart } from '../context/CartContext';
import PriceTable from '../components/Cart/PriceTable';
import Layout from '../components/Layout/Layout';
import CartItem from '../components/Cart/CartItem';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import Card from '../components/common/Card';
import { colors, fontSizes, spacing, typography } from '../theme';

const Cart = ({ navigation }) => {
  const { items, subtotal, tax, shipping, total, updateQuantity, removeItem } = useCart();

  return (
    <Layout>
      <View style={styles.header}>
        <Text style={styles.heading}>
          {items.length > 0 ? 'Your cart' : 'Cart'}
        </Text>
        {items.length > 0 && (
          <Text style={styles.count}>
            {items.length} item{items.length !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      {items.length === 0 ? (
        <EmptyState
          icon="cart-outline"
          title="Your cart is empty"
          message="Add products from the shop to get started."
          actionLabel="Browse products"
          onAction={() => navigation.navigate('home')}
        />
      ) : (
        <>
          <View style={styles.listWrap}>
            <ScrollView
              contentContainerStyle={styles.scroll}
              showsVerticalScrollIndicator={false}
            >
              {items.map((item) => (
                <CartItem
                  key={item._id ?? item.product}
                  item={item}
                  onUpdateQty={(qty) => updateQuantity(item._id ?? item.product, qty)}
                  onRemove={() => removeItem(item._id ?? item.product)}
                />
              ))}
            </ScrollView>
          </View>
          <Card style={styles.summaryCard}>
            <PriceTable title="Subtotal" price={subtotal} />
            <PriceTable title="Tax" price={tax} />
            <PriceTable title="Shipping" price={shipping} />
            <View style={styles.grandTotal}>
              <PriceTable title="Total" price={total} />
            </View>
            <Button
              title="Checkout"
              onPress={() => navigation.navigate('checkout')}
              variant="primary"
              fullWidth
              style={styles.checkoutBtn}
            />
          </Card>
        </>
      )}
    </Layout>
  );
};

export default Cart;

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.md,
  },
  heading: {
    ...typography.sectionTitle,
    marginBottom: spacing.xs,
  },
  count: {
    ...typography.bodySmall,
  },
  listWrap: {
    flex: 1,
  },
  scroll: {
    paddingBottom: spacing.lg,
    flexGrow: 1,
  },
  summaryCard: {
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  grandTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  checkoutBtn: {
    marginTop: spacing.md,
  },
});
