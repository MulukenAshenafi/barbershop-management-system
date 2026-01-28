import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import React, { useState } from "react";
import { CartData } from "../data/CartData";
import PriceTable from "../components/Cart/PriceTable";
import Layout from "../components/Layout/Layout";
import CartItem from "../components/Cart/CartItem";

const Cart = ({ navigation }) => {
  const [cartItems, setCartItems] = useState(CartData);

  // Calculate totals
  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const tax = 1.0;
  const shipping = 1.0;
  const grandTotal = subtotal + tax + shipping;

  return (
    <Layout>
      <Text style={styles.heading}>
        {cartItems.length > 0
          ? `You have ${cartItems.length} item(s) in your cart`
          : "Oops, your cart is empty!"}
      </Text>
      {cartItems.length > 0 && (
        <>
          <ScrollView>
            {cartItems.map((item) => (
              <CartItem item={item} key={item._id} />
            ))}
          </ScrollView>
          <View style={styles.summary}>
            <PriceTable title="Subtotal" price={subtotal} />
            <PriceTable title="Tax" price={tax} />
            <PriceTable title="Shipping" price={shipping} />
            <View style={styles.grandTotal}>
              <PriceTable title="Grand Total" price={grandTotal} />
            </View>
            <TouchableOpacity
              style={styles.btnCheckout}
              onPress={() => navigation.navigate("checkout")}
            >
              <Text style={styles.btnCheckoutText}>CHECKOUT</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </Layout>
  );
};

export default Cart;

const styles = StyleSheet.create({
  heading: {
    textAlign: "center",
    color: "#333",
    marginVertical: 20,
    fontSize: 18,
    fontWeight: "bold",
  },
  summary: {
    marginVertical: 20,
  },
  grandTotal: {
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingVertical: 10,
  },
  btnCheckout: {
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    width: "90%",
    backgroundColor: "#000000",
    marginHorizontal: "5%",
    borderRadius: 25,
  },
  btnCheckoutText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 18,
  },
});
