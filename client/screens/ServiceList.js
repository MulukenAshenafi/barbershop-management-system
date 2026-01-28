import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import axios from "axios";
import config from "../config";

const ServiceList = () => {
  const [services, setServices] = useState([]);
  const [error, setError] = useState(null);

  // Fetch services on component mount
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await axios.get(`${config.apiBaseUrl}/service/get-all`, {
          headers: { "Content-Type": "application/json" },
        });
        if (res.data.success) {
          setServices(res.data.services);
        } else {
          setError(res.data.message);
        }
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message;
        setError(errorMessage);
        console.error("Error fetching services:", errorMessage);
      }
    };

    fetchServices();
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <Text>Error: {error}</Text>
      </View>
    );
  }

  const renderService = ({ item }) => (
    <View style={styles.serviceItem}>
      <Text style={styles.serviceName}>{item.name}</Text>
      <Text>Category: {item.category}</Text>
      <Text>Price: ${item.price}</Text>
      <Text>Duration: {item.duration}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={services}
        keyExtractor={(item) => item._id}
        renderItem={renderService}
        ListEmptyComponent={() => <Text>No Services Available</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  serviceItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  serviceName: {
    fontWeight: "bold",
    fontSize: 18,
  },
});

export default ServiceList;
