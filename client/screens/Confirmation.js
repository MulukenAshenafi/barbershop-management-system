import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { shadows } from "../theme";
import { useTheme } from "../context/ThemeContext";

const Confirmation = ({ route, navigation }) => {
  const { colors } = useTheme();
  const { bookingData, serviceName, paymentStatus, totalAmount, barberName } =
    route.params;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.success }]}>Booking Confirmed!</Text>

      <View style={[styles.infoBox, { backgroundColor: colors.card }, shadows.md]}>
        <Text style={[styles.infoText, { color: colors.text }]}>Service: {serviceName}</Text>
        <Text style={[styles.infoText, { color: colors.text }]}>Barber: {barberName}</Text>
        <Text style={[styles.infoText, { color: colors.text }]}>
          Booking Date: {new Date(bookingData.bookingTime).toLocaleDateString()}
        </Text>
        <Text style={[styles.infoText, { color: colors.text }]}>
          Booking Time: {new Date(bookingData.bookingTime).toLocaleTimeString()}
        </Text>
        <Text style={[styles.infoText, { color: colors.text }]}>Amount: {totalAmount} birr</Text>
        <Text style={[styles.infoText, { color: colors.text }]}>Payment Status: {paymentStatus}</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.success }]}
        onPress={() => navigation.navigate("home")}
        activeOpacity={0.9}
      >
        <Text style={styles.buttonText}>Go to Home</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Confirmation;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  infoBox: {
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 18,
    marginBottom: 10,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignSelf: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
