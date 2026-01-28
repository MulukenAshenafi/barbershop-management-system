import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native"; // Import navigation hook
import { ServicesData } from "../data/ServicesData";
import Layout from "../components/Layout/Layout";

const ServiceDetails = ({ route }) => {
  const [serviceDetails, setServiceDetails] = useState({});
  const { params } = route;
  const navigation = useNavigation(); // Use navigation hook

  useEffect(() => {
    const getService = ServicesData.find((s) => s?._id === params?._id);
    setServiceDetails(getService);
  }, [params?._id]);

  const handleBookService = () => {
    // Navigate to BookService screen and pass service details as parameters
    navigation.navigate("BookService", {
      serviceId: serviceDetails?._id,
      serviceName: serviceDetails?.name,
      servicePrice: serviceDetails?.price,
      serviceImage: serviceDetails?.imageUrl,
    });
  };

  return (
    <Layout>
      <View style={styles.container}>
        <Image
          source={{ uri: serviceDetails?.imageUrl }}
          style={styles.image}
          resizeMode="contain"
        />
        <View style={styles.detailsContainer}>
          <Text style={styles.title}>{serviceDetails?.name}</Text>
          <Text style={styles.price}>Price: {serviceDetails?.price} birr</Text>
          <Text style={styles.duration}>
            Duration: {serviceDetails?.duration}
          </Text>
          <Text style={styles.desc}>
            Description: {serviceDetails?.description}
          </Text>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={handleBookService}
          >
            <Text style={styles.bookButtonText}>BOOK NOW</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 10,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  duration: {
    fontSize: 16,
    color: "#666",
    marginBottom: 10,
  },
  desc: {
    fontSize: 14,
    textAlign: "justify",
    marginBottom: 20,
  },
  bookButton: {
    backgroundColor: "#FF6347",
    borderRadius: 25,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  bookButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 18,
  },
});

export default ServiceDetails;
