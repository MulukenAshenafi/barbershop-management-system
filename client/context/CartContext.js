import React, { createContext, useContext, useState, useCallback } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  const addItem = useCallback((product, quantity = 1) => {
    const id = product._id ?? product.id;
    setItems((prev) => {
      const existing = prev.find((i) => (i._id ?? i.product) === id);
      if (existing) {
        return prev.map((i) =>
          (i._id ?? i.product) === id
            ? { ...i, quantity: (i.quantity || 0) + quantity }
            : i
        );
      }
      return [
        ...prev,
        {
          _id: id,
          product: id,
          name: product.name,
          price: parseFloat(product.price) || 0,
          quantity,
          image: product.imageUrl ?? product.images?.[0]?.url ?? product.image ?? "",
        },
      ];
    });
  }, []);

  const removeItem = useCallback((productId) => {
    setItems((prev) => prev.filter((i) => (i._id ?? i.product) !== String(productId)));
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity < 1) {
      setItems((prev) => prev.filter((i) => (i._id ?? i.product) !== String(productId)));
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        (i._id ?? i.product) === String(productId) ? { ...i, quantity } : i
      )
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const subtotal = items.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 0), 0);
  const tax = 0;
  const shipping = 0;
  const total = subtotal + tax + shipping;

  const value = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
    tax,
    shipping,
    total,
    count: items.reduce((n, i) => n + (i.quantity || 0), 0),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
