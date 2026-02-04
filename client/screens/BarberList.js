import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import api from "../services/api";

const BarberList = () => {
  const [barbers, setBarbers] = useState([]);
  const [error, setError] = useState(null);

  // Fetch barbers on component mount
  useEffect(() => {
    const fetchBarbers = async () => {
      try {
        const res = await api.get("/barbers/get-all");
        if (res.data.success) {
          setBarbers(res.data.barbers);
        } else {
          setError(res.data.message);
        }
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message;
        setError(errorMessage);
        console.error("Error fetching barbers:", errorMessage);
      }
    };

    fetchBarbers();
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <Text>Error: {error}</Text>
      </View>
    );
  }

  const renderBarber = ({ item }) => (
    <View style={styles.barberItem}>
      <Text style={styles.barberName}>{item.name}</Text>
      <Text>Location: {item.location}</Text>
      <Text>Specialization: {item.specialization}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={barbers}
        keyExtractor={(item) => item._id}
        renderItem={renderBarber}
        ListEmptyComponent={() => <Text>No Barbers Available</Text>}
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
  barberItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  barberName: {
    fontWeight: "bold",
    fontSize: 18,
  },
});

export default BarberList;
