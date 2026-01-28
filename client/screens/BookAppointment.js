// screens/BookAppointment.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import DatePicker from "react-native-datepicker"; // Install this or use any date picker you prefer
import { useNavigation } from "@react-navigation/native";

const BookAppointment = () => {
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const navigation = useNavigation();

  const handleBookAppointment = () => {
    // API call to book the appointment
    Alert.alert(
      "Appointment Booked!",
      `Service: ${service}, Date: ${date}, Time: ${time}`
    );
    navigation.navigate("MyAppointments"); // Navigate to MyAppointments screen
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Book an Appointment</Text>
      <TextInput
        style={styles.input}
        placeholder="Service"
        value={service}
        onChangeText={setService}
      />
      <DatePicker
        style={styles.datePicker}
        date={date}
        mode="date"
        placeholder="Select Date"
        format="YYYY-MM-DD"
        onDateChange={setDate}
      />
      <DatePicker
        style={styles.datePicker}
        date={time}
        mode="time"
        placeholder="Select Time"
        format="HH:mm"
        onDateChange={setTime}
      />
      <TouchableOpacity style={styles.button} onPress={handleBookAppointment}>
        <Text style={styles.buttonText}>Book Appointment</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  datePicker: {
    width: "100%",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "orange",
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
  },
});

export default BookAppointment;
