import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import api from "../services/api";

const ManagePayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch payments on component mount
  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const res = await api.get("/booking/payments/all");
        if (res.data.success) {
          setPayments(res.data.payments);
        } else {
          setError(res.data.message);
        }
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message;
        setError(errorMessage);
        console.error("Error fetching payments:", errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const renderPayment = ({ item }) => (
    <View style={styles.paymentItem}>
      <Text style={styles.paymentText}>Customer: {item.customerId.name}</Text>
      <Text style={styles.paymentText}>Amount: ${item.totalAmount / 100}</Text>
      <Text style={styles.paymentText}>Status: {item.paymentStatus}</Text>
      <Text style={styles.paymentText}>Booking ID: {item.bookingId._id}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Manage Payments</Text>
      {error ? (
        <Text style={styles.errorText}>Error: {error}</Text>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item._id}
          renderItem={renderPayment}
          ListEmptyComponent={() => <Text>No Payments Available</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  paymentItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  paymentText: {
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    fontSize: 16,
  },
});

export default ManagePayments;
