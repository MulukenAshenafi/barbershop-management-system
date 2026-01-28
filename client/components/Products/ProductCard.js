import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { useNavigation } from "@react-navigation/native";

const ProductCard = ({ p }) => {
  const navigation = useNavigation();

  const handleMoreButton = (id) => {
    navigation.navigate("productDetails", { _id: id });
  };

  const handleAddToCart = () => {
    alert("Added to cart");
  };

  return (
    <View style={styles.card}>
      <Image
        style={styles.cardImage}
        resizeMode="contain"
        source={{ uri: p?.imageUrl }}
      />
      <Text style={styles.cardTitle}>{p?.name}</Text>
      <Text style={styles.cardDescription}>
        {p?.description.substring(0, 30)}...more
      </Text>
      <View style={styles.BtnContainer}>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => handleMoreButton(p._id)}
        >
          <Text style={styles.btnText}>Details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnCard} onPress={handleAddToCart}>
          <Text style={styles.btnText}>ADD TO CART</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "#ddd", // Light gray border
    marginVertical: 10,
    marginHorizontal: 8,
    width: 150, // Width adjusted for consistency
    padding: 8,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    height: 100, // Height adjusted for consistency
    width: "100%",
    marginBottom: 8,
    borderRadius: 10,
  },
  cardTitle: {
    fontSize: 14, // Font size adjusted for consistency
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center",
  },
  cardDescription: {
    fontSize: 12, // Font size adjusted for consistency
    textAlign: "left",
  },
  BtnContainer: {
    marginTop: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  btn: {
    backgroundColor: "#000",
    height: 30,
    width: 70,
    borderRadius: 15,
    justifyContent: "center",
  },
  btnCard: {
    backgroundColor: "#FF6347", // Tomato color for the add-to-cart button
    height: 30,
    width: 70,
    borderRadius: 15,
    justifyContent: "center",
  },
  btnText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "bold",
  },
});

export default ProductCard;
