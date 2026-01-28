import { StyleSheet, Text, View } from "react-native";
import React from "react";

const AppointmentItem = ({ appointment }) => {
  return (
    <View style={styles.container}>
      <View style={styles.appointmentInfo}>
        <Text>Appointment ID: {appointment._id}</Text>
        <Text>Date: {appointment.date}</Text>
      </View>

      <Text>Service: {appointment.service.name}</Text>
      <Text>Price: {appointment.service.price}$</Text>
      <Text>Barber: {appointment.barberName}</Text>
      <Text>Status: {appointment.status}</Text>
    </View>
  );
};

export default AppointmentItem;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    margin: 10,
    padding: 10,
    borderRadius: 10,
  },
  appointmentInfo: {
    flexDirection: "row",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderColor: "lightgray",
    paddingBottom: 5,
  },
  status: {
    borderTopWidth: 1,
    fontWeight: "bold",
    borderColor: "lightgray",
    padding: 5,
  },
});
