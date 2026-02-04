import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  TextInput,
} from "react-native";
import api from "../services/api";

const ManageBarbers = ({ navigation }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [contact, setContact] = useState("");
  const [location, setLocation] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false); // State to toggle form visibility

  const handleSignUp = async () => {
    if (
      !name ||
      !email ||
      !password ||
      !contact ||
      !location ||
      !specialization
    ) {
      return Alert.alert("Validation Error", "Please fill in all fields");
    }

    try {
      const res = await api.post("/barbers/signup", {
        name,
        email,
        password,
        phone: contact,
        location,
        specialization,
        role: "Barber",
      });

      setResponse(res.data);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "An unknown error occurred.";
      setError({ message: errorMessage });
      console.error("Registration Error:", errorMessage);
    }
  };

  useEffect(() => {
    if (response) {
      if (response.success) {
        setName("");
        setEmail("");
        setPassword("");
        setContact("");
        setLocation("");
        setSpecialization("");
        Alert.alert("Success", "Barber Registered Successfully");
        navigation.navigate("BarberList");
      } else {
        Alert.alert("Registration Error", response.message);
      }
    }

    if (error) {
      Alert.alert(
        "Registration Error",
        error.message || "An unknown error occurred."
      );
      console.error("Error Details:", error);
    }
  }, [response, error]);

  const handleViewBarberList = () => {
    navigation.navigate("BarberList");
  };

  return (
    <View style={styles.container}>
      {/* Buttons for viewing barbers and registering */}
      <TouchableOpacity
        style={styles.viewBarberListBtn}
        onPress={handleViewBarberList}
      >
        <Text style={styles.viewBarberListBtnText}>View All Barbers</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.registerBarberBtn}
        onPress={() => setShowForm(!showForm)} // Toggle form visibility
      >
        <Text style={styles.registerBarberBtnText}>Register Barber</Text>
      </TouchableOpacity>

      {/* Conditional rendering of form */}
      {showForm && (
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter Barber's Name"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter Barber's Email"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter Barber's Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="Enter Contact Number"
            value={contact}
            onChangeText={setContact}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Enter Barber's Location"
            value={location}
            onChangeText={setLocation}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter Barber's Specialization"
            value={specialization}
            onChangeText={setSpecialization}
          />
          <TouchableOpacity style={styles.logiBtn} onPress={handleSignUp}>
            <Text style={styles.logiBtnText}>Register Barber</Text>
          </TouchableOpacity>
        </View>
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
  viewBarberListBtn: {
    backgroundColor: "#32CD32",
    width: "80%",
    justifyContent: "center",
    height: 45,
    borderRadius: 5,
    marginBottom: 20,
    alignSelf: "center",
  },
  viewBarberListBtnText: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 20,
    color: "#fff",
  },
  registerBarberBtn: {
    backgroundColor: "#32CD32",
    width: "80%",
    justifyContent: "center",
    height: 45,
    borderRadius: 5,
    alignSelf: "center",
  },
  registerBarberBtnText: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 20,
    color: "#fff",
  },
  formContainer: {
    marginTop: 20,
    width: "100%",
    paddingHorizontal: 10,
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  logiBtn: {
    backgroundColor: "#32CD32",
    width: "100%",
    justifyContent: "center",
    height: 45,
    borderRadius: 5,
    marginTop: 20,
  },
  logiBtnText: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 20,
    color: "#fff",
  },
});

export default ManageBarbers;
