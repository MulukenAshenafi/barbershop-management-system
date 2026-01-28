import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Calendar } from "react-native-calendars";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import DateTimePicker from "@react-native-community/datetimepicker";
import config from "../config";

const BookService = ({ route, navigation }) => {
  const { serviceId, serviceName, servicePrice, serviceImage } = route.params;
  const [barbers, setBarbers] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [customer, setCustomer] = useState({ _id: "", name: "" });
  const [markedDates, setMarkedDates] = useState({});
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const customerData = await AsyncStorage.getItem("customerData");
        if (customerData) {
          setCustomer(JSON.parse(customerData));
        }
      } catch (error) {
        console.error("Error fetching customer data:", error);
      }
    };
    fetchCustomer();
  }, []);

  useEffect(() => {
    const fetchBarbers = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const response = await axios.get(
          `${config.apiBaseUrl}/barbers/get-all`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setBarbers(response.data.barbers);
      } catch (error) {
        console.error("Error fetching barbers:", error);
        Alert.alert("Error", "Unable to fetch barbers. Please try again.");
      }
    };
    fetchBarbers();
  }, []);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (selectedBarber && selectedDate) {
        try {
          const token = await AsyncStorage.getItem("token");
          const response = await axios.get(
            `${config.apiBaseUrl}/booking/availability`,
            {
              params: {
                barberId: selectedBarber,
                date: selectedDate,
              },
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setAvailableSlots(response.data.availableSlots || []);

          const marked = {};
          if (response.data.availableSlots.length === 0) {
            marked[selectedDate] = { selected: true, selectedColor: "red" };
          } else {
            marked[selectedDate] = { selected: true, selectedColor: "green" };
          }
          setMarkedDates(marked);
        } catch (error) {
          console.error("Error fetching availability:", error);
          Alert.alert(
            "Error",
            "Unable to check availability. Please try again."
          );
        }
      }
    };
    fetchAvailability();
  }, [selectedBarber, selectedDate]);

  const handleTimePick = (event, selectedDate) => {
    setShowTimePicker(false);
    if (event.type === "set" && selectedDate) {
      setSelectedTime(selectedDate);
    }
  };

  const handleBooking = async (paymentMethod) => {
    if (!selectedTime) {
      Alert.alert("Error", "Please select a time slot.");
      return;
    }

    try {
      const customerData = await AsyncStorage.getItem("customerData");
      const customer = customerData ? JSON.parse(customerData) : {};

      if (!customer.customerId) {
        Alert.alert("Error", "Customer not found. Please log in again.");
        return;
      }

      // Determine payment status based on the payment method
      const paymentStatus =
        paymentMethod === "cash" ? "Pending to be paid on cash" : "Online Pending";

      const bookingData = {
        serviceId,
        barberId: selectedBarber,
        customerId: customer.customerId,
        bookingTime: selectedTime.toISOString(),
        customerNotes: "", // Add customer notes if needed
        paymentStatus, // Set payment status based on payment method
      };

      const token = await AsyncStorage.getItem("token");
      const response = await axios.post(
        `${config.apiBaseUrl}/booking/create`,
        bookingData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Get the bookingId from the response
      const bookingId = response.data.booking._id;

      // Find the selected barber's name
      const selectedBarberName =
        barbers.find((barber) => barber._id === selectedBarber)?.name ||
        "Unknown Barber";

      const navigationData = {
        customerName: customer.name,
        barberName: selectedBarberName,
        bookingData: response.data.booking,
        serviceName,
        totalAmount: servicePrice,
        bookingId, // Pass bookingId here
      };

      if (paymentMethod === "cash") {
        Alert.alert("Success", "Booking created successfully");
        navigation.navigate("Confirmation", {
          ...navigationData,
          paymentStatus: "Pending to be paid on cash",
        });
      } else if (paymentMethod === "online") {
        navigation.navigate("payment", {
          ...navigationData,
          paymentStatus: "Online Paid",
        });
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      Alert.alert("Error", "Unable to create booking. Please try again.");
    }
  };


  const confirmPaymentMethod = () => {
    Alert.alert(
      "Choose Payment Option",
      "Please select a payment method:",
      [
        {
          text: "Cash on Person",
          onPress: () => handleBooking("cash"),
        },
        {
          text: "Online Payment",
          onPress: () => handleBooking("online"),
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Book Your Service</Text>
      <Picker
        selectedValue={selectedBarber}
        onValueChange={(itemValue) => setSelectedBarber(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="Select Barber" value="" />
        {barbers.map((barber) => (
          <Picker.Item
            key={barber._id}
            label={barber.name}
            value={barber._id}
          />
        ))}
      </Picker>
      <Calendar
        onDayPress={(day) => {
          setSelectedDate(day.dateString);
          setAvailableSlots([]);
          setSelectedTime(null);
        }}
        markedDates={markedDates}
        theme={{
          selectedDayBackgroundColor: "#5cb85c",
          todayTextColor: "#007bff",
        }}
      />
      {selectedDate && (
        <View style={styles.timePickerContainer}>
          <TouchableOpacity
            onPress={() => setShowTimePicker(true)}
            style={styles.timePickerButton}
          >
            <Text style={styles.buttonText}>Pick a Time</Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              mode="time"
              value={selectedTime || new Date()}
              display="spinner"
              onChange={handleTimePick}
              is24Hour={true}
            />
          )}
          {selectedTime && (
            <Text style={styles.selectedTime}>
              Selected Time:{" "}
              {selectedTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          )}
        </View>
      )}
      <TouchableOpacity
        onPress={confirmPaymentMethod}
        style={styles.confirmButton}
      >
        <Text style={styles.buttonText}>Confirm Booking</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f7f7f7",
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  picker: {
    height: 50,
    width: "100%",
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 5,
  },
  timePickerContainer: {
    marginTop: 20,
  },
  timePickerButton: {
    padding: 12,
    backgroundColor: "#007bff",
    borderRadius: 5,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  selectedTime: {
    fontSize: 18,
    marginTop: 10,
    color: "#333",
  },
  confirmButton: {
    padding: 15,
    backgroundColor: "#28a745",
    borderRadius: 5,
    marginTop: 30,
  },
});

export default BookService;
