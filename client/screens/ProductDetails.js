import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useEffect, useState } from "react";
import { ProductsData } from "../data/ProductsData";
import Layout from "../components/Layout/Layout";
import { useToast } from "../components/common/Toast";
import { useTheme } from "../context/ThemeContext";

const ProductDetails = ({ route }) => {
  const toast = useToast();
  const { colors } = useTheme();
  const [pDetails, setPDetails] = useState({});
  const [qty, setQty] = useState(1);
  const { params } = route;

  useEffect(() => {
    const getProduct = ProductsData.find((p) => p?._id === params?._id);
    setPDetails(getProduct);
  }, [params?._id]);

  const handleAddQty = () => {
    if (qty === 10) {
      toast.show("You can't add more than 10 quantity", { type: "error" });
      return;
    }
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
          <Text style={[styles.title, { color: colors.text }]}>{pDetails?.name}</Text>
          <Text style={[styles.price, { color: colors.textSecondary }]}>Price: ${pDetails?.price}</Text>
          <Text style={[styles.desc, { color: colors.text }]}>Description: {pDetails?.description}</Text>
          <View style={styles.quantityContainer}>
            <TouchableOpacity style={[styles.qtyButton, { backgroundColor: colors.gray200 }]} onPress={handleMinusQty}>
              <Text style={[styles.qtyButtonText, { color: colors.text }]}>-</Text>
            </TouchableOpacity>
            <Text style={[styles.qty, { color: colors.text }]}>{qty}</Text>
            <TouchableOpacity style={[styles.qtyButton, { backgroundColor: colors.gray200 }]} onPress={handleAddQty}>
              <Text style={[styles.qtyButtonText, { color: colors.text }]}>+</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.cartButton, { backgroundColor: colors.secondary }]}
            onPress={() => toast.show(`${qty} items added to cart`, { type: "success" })}
          >
            <Text style={[styles.cartButtonText, { color: colors.white }]}>
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
    borderRadius: 25,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  cartButtonText: {
    fontWeight: "bold",
    fontSize: 18,
  },
});
