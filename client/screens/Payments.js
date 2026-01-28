import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, TextInput, Button, Alert } from "react-native";
import axios from "axios";
import config from "../config"; // Import config for API base URL
import AsyncStorage from "@react-native-async-storage/async-storage";

const Payments = ({ route, navigation }) => {
  const {
    customerName,
    barberName,
    bookingData,
    serviceName,
    totalAmount,
    paymentStatus,
    bookingId, // Get bookingId from route params
  } = route.params; // Get totalAmount, bookingData, and bookingId from route params

  const [amount, setAmount] = useState(totalAmount.toString());
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Reset the amount when the component is mounted or the totalAmount changes
    setAmount(totalAmount.toString());
  }, [totalAmount]);

  const handlePayment = async () => {
    if (!amount) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    try {
      setIsProcessing(true);
      const token = await AsyncStorage.getItem("token");

      // Ensure both totalAmount and bookingId are sent
      const response = await axios.post(
        `${config.apiBaseUrl}/booking/payments`,
        {
          totalAmount: parseFloat(amount),
          bookingId: bookingData._id, // Ensure bookingId is included in the request body
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        Alert.alert("Success", "Payment processed successfully!");

        // Clear the amount from the state
        setAmount(""); // Clear amount in UI

        // Navigate to confirmation screen after successful payment
        navigation.navigate("Confirmation", {
          customerName,
          barberName,
          bookingData,
          serviceName,
          totalAmount,
          paymentStatus: "Online Paid",
        });
      } else {
        Alert.alert("Error", response.data.message || "Payment failed");
      }
    } catch (error) {
      console.error(
        "Error processing payment:",
        error.response ? error.response.data : error
      );
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          "Something went wrong during the payment"
      );
    } finally {
      setIsProcessing(false);
    }
  };


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Make a Payment</Text>
      <TextInput
        style={styles.input}
        placeholder="Amount section will only filled if u select bookin slot."
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        editable={false} // Make this field non-editable, using the amount from route params
      />
      <Button
        title={isProcessing ? "Processing..." : "Pay Now"}
        onPress={handlePayment}
        disabled={isProcessing}
      />
    </View>
  );
};

export default Payments;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    fontSize: 18,
    marginBottom: 20,
  },
});
