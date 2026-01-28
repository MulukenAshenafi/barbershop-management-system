import { ScrollView, StyleSheet, View } from "react-native";
import React from "react";
import ProductCard from "./ProductCard";
import { ProductsData } from "../../data/ProductsData";

const Products = () => {
  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
      >
        {ProductsData.map((p) => (
          <ProductCard key={p._id} p={p} />
        ))}
      </ScrollView>
    </View>
  );
};

export default Products;

const styles = StyleSheet.create({
  scrollView: {
    paddingVertical: 10,
  },
});
