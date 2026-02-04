import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Layout from '../components/Layout/Layout';
import InputBox from '../components/Form/InputBox';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { useToast } from '../components/common/Toast';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import { getApiErrorMessage } from '../services/api';
import { fontSizes, spacing, typography } from '../theme';

const Checkout = ({ navigation }) => {
  const toast = useToast();
  const { colors } = useTheme();
  const { items, total, subtotal, tax, shipping, clearCart } = useCart();
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentStarted, setPaymentStarted] = useState(false);
  const orderPaymentIdempotencyKeyRef = useRef(null);
  const codInFlightRef = useRef(false);

  const orderItems = items.map((i) => ({
    product: i._id ?? i.product,
    name: i.name,
    price: i.price,
    quantity: i.quantity || 1,
    image: i.image ?? '',
  }));

  const handleCOD = async () => {
    if (!address.trim() || !city.trim() || !country.trim()) {
      toast.show('Please fill shipping address, city, and country.', { type: 'error' });
      return;
    }
    if (orderItems.length === 0) {
      toast.show('Cart is empty.', { type: 'error' });
      return;
    }
    if (codInFlightRef.current) return;
    codInFlightRef.current = true;
    setLoading(true);
    try {
      const res = await api.post('order/create', {
        shippingInfo: {
          address: address.trim(),
          city: city.trim(),
          country: country.trim(),
        },
        orderItems,
        paymentMethod: 'COD',
        paymentInfo: { id: '', status: '' },
        itemPrice: subtotal,
        tax,
        shippingCharges: shipping,
        totalAmount: total,
      });
      if (res.data.success) {
        clearCart();
        toast.show('Order placed successfully!', { type: 'success' });
        navigation.reset({ index: 0, routes: [{ name: 'myorders' }] });
      } else {
        toast.show(res.data.message || 'Order failed', { type: 'error' });
      }
    } catch (e) {
      toast.show(getApiErrorMessage(e, 'Could not place order.'), { type: 'error' });
    } finally {
      codInFlightRef.current = false;
      setLoading(false);
    }
  };

  const handleOnline = async () => {
    if (!address.trim() || !city.trim() || !country.trim()) {
      toast.show('Please fill shipping address, city, and country.', { type: 'error' });
      return;
    }
    if (orderItems.length === 0) {
      toast.show('Cart is empty.', { type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const createRes = await api.post('order/create', {
        shippingInfo: {
          address: address.trim(),
          city: city.trim(),
          country: country.trim(),
        },
        orderItems,
        paymentMethod: 'ONLINE',
        paymentInfo: { id: '', status: '' },
        itemPrice: subtotal,
        tax,
        shippingCharges: shipping,
        totalAmount: total,
      });
      if (!createRes.data.success) {
        toast.show(createRes.data.message || 'Order create failed', { type: 'error' });
        setLoading(false);
        return;
      }
      const orderId = createRes.data.orderId ?? createRes.data.order?._id;
      if (!orderId) {
        toast.show('Order created but ID missing.', { type: 'error' });
        setLoading(false);
        return;
      }
      if (!orderPaymentIdempotencyKeyRef.current) {
        orderPaymentIdempotencyKeyRef.current = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      }
      const payRes = await api.post(
        'payments/order',
        { totalAmount: total, orderId },
        { headers: { 'Idempotency-Key': orderPaymentIdempotencyKeyRef.current } }
      );
      setLoading(false);
      if (payRes.data.success && payRes.data.checkout_url) {
        setPaymentStarted(true);
        const canOpen = await Linking.canOpenURL(payRes.data.checkout_url);
        if (canOpen) await Linking.openURL(payRes.data.checkout_url);
        else toast.show('Open: ' + payRes.data.checkout_url, { type: 'info' });
      } else {
        toast.show(payRes.data.message || 'Payment init failed', { type: 'error' });
      }
    } catch (e) {
      setLoading(false);
      toast.show(e.response?.data?.message || 'Something went wrong.', { type: 'error' });
    }
  };

  if (items.length === 0 && !paymentStarted) {
    return (
      <Layout>
        <View style={styles.emptyWrap}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Your cart is empty</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Add items from the shop, then come back to checkout.
          </Text>
          <Button
            title="Back to Home"
            onPress={() => navigation.navigate('home')}
            variant="primary"
            style={styles.emptyBtn}
          />
        </View>
      </Layout>
    );
  }

  return (
    <Layout>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
      >
        <Text style={[styles.heading, { color: colors.text }]}>Checkout</Text>
        <Card style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{total.toFixed(2)} ETB</Text>
        </Card>

        <Text style={styles.sectionTitle}>Shipping address</Text>
        <Card style={styles.formCard}>
          <InputBox
            placeholder="Address"
            value={address}
            setValue={setAddress}
          />
          <InputBox placeholder="City" value={city} setValue={setCity} />
          <InputBox placeholder="Country" value={country} setValue={setCountry} />
        </Card>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment method</Text>
        <Card style={styles.paymentCard}>
          <Button
            title="Cash on delivery"
            onPress={handleCOD}
            loading={loading && !paymentStarted}
            disabled={loading}
            variant="primary"
            fullWidth
            style={styles.paymentBtn}
          />
          <Button
            title="Pay online (Chapa)"
            onPress={handleOnline}
            disabled={loading}
            variant="secondary"
            fullWidth
            style={styles.paymentBtn}
          />
        </Card>

        {paymentStarted && (
          <Button
            title="I've completed payment"
            onPress={() => {
              clearCart();
              navigation.reset({
                index: 0,
                routes: [{ name: 'myorders' }],
              });
            }}
            variant="primary"
            fullWidth
            style={styles.doneBtn}
          />
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </Layout>
  );
};

export default Checkout;

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.xxl,
  },
  heading: {
    ...typography.sectionTitle,
    marginBottom: spacing.md,
  },
  totalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  totalLabel: {
    ...typography.body,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
  },
  sectionTitle: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  formCard: {
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  paymentCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  paymentBtn: {
    marginBottom: spacing.sm,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    ...typography.sectionTitle,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyBtn: {
    minWidth: 180,
  },
  doneBtn: {
    marginTop: spacing.sm,
  },
});
