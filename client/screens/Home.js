import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import React, { useState } from "react";
import Layout from "../components/Layout/Layout";
import Categories from "../components/category/Categories";
import Banner from "../components/Banner/Banner";
import Header from "../components/Layout/Header";
import Products from "../components/Products/Products";
import Services from "../components/Services/Service";

const Home = () => {
  const [activeSection, setActiveSection] = useState("Products");

  return (
    <Layout>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Header />
        <Categories />
        <Banner />

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              activeSection === "Products" && styles.activeButton,
            ]}
            onPress={() => setActiveSection("Products")}
          >
            <Text style={styles.buttonText}>Our Products</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              activeSection === "Services" && styles.activeButton,
            ]}
            onPress={() => setActiveSection("Services")}
          >
            <Text style={styles.buttonText}>Our Services</Text>
          </TouchableOpacity>
        </View>

        {activeSection === "Products" && (
          <View style={styles.section}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Products />
            </ScrollView>
          </View>
        )}

        {activeSection === "Services" && (
          <View style={styles.section}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Services />
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </Layout>
  );
};

export default Home;

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 60, // Adjust this if needed
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#ddd",
    borderRadius: 5,
  },
  activeButton: {
    backgroundColor: "#333",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  section: {
    marginVertical: 5, // Reduced vertical margin
    paddingHorizontal: 10, // Added horizontal padding
    width: "100%",
  },
});
