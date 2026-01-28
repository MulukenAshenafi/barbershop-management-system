import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import axios from "axios";
import config from "../config"; // Adjust the import as needed

const ManageBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState(null);

  // Fetch bookings on component mount
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await axios.get(`${config.apiBaseUrl}/booking/get-all`, {
          headers: { "Content-Type": "application/json" },
        });
        if (res.data.success) {
          setBookings(res.data.bookings);
        } else {
          setError(res.data.message);
        }
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message;
        setError(errorMessage);
        console.error("Error fetching bookings:", errorMessage);
      }
    };

    fetchBookings();
  }, []);

  // Handle booking approval (example action)
  const handleApproveBooking = async (bookingId) => {
    try {
      const res = await axios.patch(
        `${config.apiBaseUrl}/booking/approve/${bookingId}`
      );
      if (res.data.success) {
        Alert.alert("Success", "Booking approved successfully!");
        // Refresh bookings after action
        setBookings((prevBookings) =>
          prevBookings.map((booking) =>
            booking._id === bookingId
              ? { ...booking, bookingStatus: "Approved" }
              : booking
          )
        );
      } else {
        Alert.alert("Error", res.data.message);
      }
    } catch (error) {
      console.error("Error approving booking:", error);
      Alert.alert("Error", "Could not approve the booking.");
    }
  };

  const renderBooking = ({ item }) => (
    <View style={styles.bookingItem}>
      <Text style={styles.bookingText}>Customer: {item.customerId.name}</Text>
      <Text style={styles.bookingText}>Service: {item.serviceId.name}</Text>
      <Text style={styles.bookingText}>Barber: {item.barberId.name}</Text>
      <Text style={styles.bookingText}>
        Date: {new Date(item.bookingTime).toLocaleString()}
      </Text>
      <Text style={styles.bookingText}>Status: {item.bookingStatus}</Text>
      <Text style={styles.bookingText}>
        Payment Status: {item.paymentStatus}
      </Text>

      {/* Approve Button */}
      {item.bookingStatus === "Confirmed" && (
        <TouchableOpacity
          style={styles.approveBtn}
          onPress={() => handleApproveBooking(item._id)}
        >
          <Text style={styles.approveBtnText}>Approve Booking</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Manage Bookings</Text>
      {error ? (
        <Text>Error: {error}</Text>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item._id}
          renderItem={renderBooking}
          ListEmptyComponent={() => <Text>No Bookings Available</Text>}
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
  bookingItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  bookingText: {
    fontSize: 16,
  },
  approveBtn: {
    backgroundColor: "#32CD32",
    padding: 10,
    marginTop: 10,
    borderRadius: 5,
  },
  approveBtnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
});

export default ManageBookings;
