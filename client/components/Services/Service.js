import { ScrollView, StyleSheet, View } from "react-native";
import React from "react";
import ServiceCard from "./ServiceCard";
import { ServicesData } from "../../data/ServicesData"; // Ensure the path is correct

const Services = () => {
  return (
    <ScrollView
      horizontal
      contentContainerStyle={styles.container}
      showsHorizontalScrollIndicator={false}
    >
      {ServicesData.map((s) => (
        <ServiceCard key={s._id} s={s} />
      ))}
    </ScrollView>
  );
};

export default Services;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    alignItems: "center", // Center items vertically within the scroll view
  },
});
