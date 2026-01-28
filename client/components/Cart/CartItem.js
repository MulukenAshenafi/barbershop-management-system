import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useState } from "react";

const CartItem = ({ item }) => {
  const [qty, setQty] = useState(item.quantity || 1);

  const handleAddQty = () => {
    if (qty === 10) return alert("You can't add more than 10 items.");
    setQty((prev) => prev + 1);
  };

  const handleMinusQty = () => {
    if (qty <= 1) return;
    setQty((prev) => prev - 1);
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: item?.imageUrl }} style={styles.image} />
      <View style={styles.details}>
        <Text style={styles.name}>{item?.name}</Text>
        <Text style={styles.description}>{item?.description}</Text>
        <Text style={styles.price}>${item?.price.toFixed(2)}</Text>
      </View>
      <View style={styles.btnContainer}>
        <TouchableOpacity style={styles.btnQty} onPress={handleMinusQty}>
          <Text style={styles.btnQtyText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.qtyText}>{qty}</Text>
        <TouchableOpacity style={styles.btnQty} onPress={handleAddQty}>
          <Text style={styles.btnQtyText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CartItem;

const styles = StyleSheet.create({
  container: {
    margin: 10,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  image: {
    height: 80,
    width: 80,
    resizeMode: "contain",
    marginRight: 10,
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
  },
  description: {
    fontSize: 12,
    color: "#666",
  },
  price: {
    fontSize: 14,
    fontWeight: "bold",
    marginVertical: 5,
  },
  btnContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  btnQty: {
    backgroundColor: "#f0f0f0",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
  },
  btnQtyText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  qtyText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
