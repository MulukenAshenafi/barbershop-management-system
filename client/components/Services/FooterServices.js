import { ScrollView, StyleSheet, View } from "react-native";
import React from "react";
import FooterServicesCard from "./FooterServicesCard";
import { ServicesData } from "../../data/ServicesData";
import Layout from "../Layout/Layout";

const Services = () => {
  return (
    <Layout>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {ServicesData.map((s) => (
            <FooterServicesCard key={s._id} s={s} />
          ))}
        </ScrollView>
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5", // Light gray background
    padding: 10,
  },
  scrollContainer: {
    alignItems: "center", // Center items vertically within the scroll view
  },
});

export default Services;
