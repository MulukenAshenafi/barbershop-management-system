import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useEffect, useState } from "react";
import { ProductsData } from "../data/ProductsData";
import Layout from "../components/Layout/Layout";

const ProductDetails = ({ route }) => {
  const [pDetails, setPDetails] = useState({});
  const [qty, setQty] = useState(1);
  const { params } = route;

  useEffect(() => {
    const getProduct = ProductsData.find((p) => p?._id === params?._id);
    setPDetails(getProduct);
  }, [params?._id]);

  const handleAddQty = () => {
    if (qty === 10) return alert("You can't add more than 10 quantity");
    setQty((prev) => prev + 1);
  };

  const handleMinusQty = () => {
    if (qty <= 1) return;
    setQty((prev) => prev - 1);
  };

  return (
    <Layout>
      <View style={styles.container}>
        <Image
          source={{ uri: pDetails?.imageUrl }}
          style={styles.image}
          resizeMode="contain"
        />
        <View style={styles.detailsContainer}>
          <Text style={styles.title}>{pDetails?.name}</Text>
          <Text style={styles.price}>Price: ${pDetails?.price}</Text>
          <Text style={styles.desc}>Description: {pDetails?.description}</Text>
          <View style={styles.quantityContainer}>
            <TouchableOpacity style={styles.qtyButton} onPress={handleMinusQty}>
              <Text style={styles.qtyButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.qty}>{qty}</Text>
            <TouchableOpacity style={styles.qtyButton} onPress={handleAddQty}>
              <Text style={styles.qtyButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => alert(`${qty} items added to cart`)}
          >
            <Text style={styles.cartButtonText}>
              {pDetails?.quantity > 0 ? "ADD TO CART" : "OUT OF STOCK"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Layout>
  );
};

export default ProductDetails;

const styles = StyleSheet.create({
  container: {
    margin: 10,
  },
  image: {
    height: 200,
    width: "100%",
    borderRadius: 10,
  },
  detailsContainer: {
    marginTop: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 5,
  },
  price: {
    fontSize: 18,
    color: "#444",
    marginBottom: 5,
  },
  desc: {
    fontSize: 14,
    textAlign: "justify",
    marginBottom: 15,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  qtyButton: {
    backgroundColor: "lightgray",
    width: 30,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 10,
    borderRadius: 5,
  },
  qtyButtonText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  qty: {
    fontSize: 16,
  },
  cartButton: {
    backgroundColor: "orange",
    borderRadius: 25,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  cartButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 18,
  },
});
