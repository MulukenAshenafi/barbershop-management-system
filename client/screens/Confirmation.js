import React from "react";
import { StyleSheet, Text, View, Button } from "react-native";

const Confirmation = ({ route, navigation }) => {
  const { bookingData, serviceName, paymentStatus, totalAmount, barberName } =
    route.params; // Get booking and payment info from route params

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Booking Confirmed!</Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>Service: {serviceName}</Text>
        <Text style={styles.infoText}>Barber: {barberName}</Text>
        <Text style={styles.infoText}>
          Booking Date: {new Date(bookingData.bookingTime).toLocaleDateString()}
        </Text>
        <Text style={styles.infoText}>
          Booking Time: {new Date(bookingData.bookingTime).toLocaleTimeString()}
        </Text>
        <Text style={styles.infoText}>Amount: {totalAmount} birr</Text>
        <Text style={styles.infoText}>Payment Status: {paymentStatus}</Text>
      </View>

      <Button
        title="Go to Home"
        onPress={() => navigation.navigate("home")}
        color="#28a745"
      />
    </View>
  );
};

export default Confirmation;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f7f7f7",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#28a745",
  },
  infoBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  infoText: {
    fontSize: 18,
    marginBottom: 10,
    color: "#333",
  },
});
