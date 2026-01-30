/**
 * Cart context – addItem, removeItem, updateQuantity, clearCart.
 */
import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { CartProvider, useCart } from '../context/CartContext';

function wrapper({ children }) {
  return <CartProvider>{children}</CartProvider>;
}

describe('CartContext', () => {
  it('addItem adds a new product', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    const product = { _id: 'p1', name: 'Product 1', price: 10, imageUrl: '' };

    act(() => {
      result.current.addItem(product, 1);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].name).toBe('Product 1');
    expect(result.current.items[0].quantity).toBe(1);
    expect(result.current.count).toBe(1);
    expect(result.current.subtotal).toBe(10);
  });

  it('addItem same product twice increases quantity', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    const product = { _id: 'p1', name: 'Product 1', price: 10 };

    act(() => {
      result.current.addItem(product, 1);
      result.current.addItem(product, 2);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(3);
    expect(result.current.count).toBe(3);
    expect(result.current.subtotal).toBe(30);
  });

  it('removeItem removes the product', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    const product = { _id: 'p1', name: 'Product 1', price: 10 };

    act(() => {
      result.current.addItem(product, 1);
    });
    expect(result.current.items).toHaveLength(1);

    act(() => {
      result.current.removeItem('p1');
    });
    expect(result.current.items).toHaveLength(0);
    expect(result.current.count).toBe(0);
  });

  it('updateQuantity updates quantity and removes if 0', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    const product = { _id: 'p1', name: 'Product 1', price: 10 };

    act(() => {
      result.current.addItem(product, 2);
    });

    act(() => {
      result.current.updateQuantity('p1', 5);
    });
    expect(result.current.items[0].quantity).toBe(5);

    act(() => {
      result.current.updateQuantity('p1', 0);
    });
    expect(result.current.items).toHaveLength(0);
  });

  it('clearCart empties items', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => {
      result.current.addItem({ _id: 'p1', name: 'P1', price: 5 }, 1);
    });
    expect(result.current.items.length).toBeGreaterThan(0);

    act(() => {
      result.current.clearCart();
    });
    expect(result.current.items).toHaveLength(0);
    expect(result.current.subtotal).toBe(0);
  });
});
