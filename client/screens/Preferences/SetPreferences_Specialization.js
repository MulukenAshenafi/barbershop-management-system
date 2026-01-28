import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../../config.js";

const SetPreferences_Specialization = ({ route, navigation }) => {
  const { user } = route.params;
  const [input, setInput] = useState(
    user.role === "Customer" ? user.preferences : user.specialization
  );
  const [error, setError] = useState(null);

  // Update preferences or specialization
  const handleUpdate = async () => {
    if (!input) {
      return Alert.alert("Validation Error", "Please provide a value");
    }

    try {
      const token = await AsyncStorage.getItem("token");
      const endpoint =
        user.role === "Customer" ? "/set-preferences" : "/set-specialization";
      const res = await axios.post(
        `${config.apiBaseUrl}/customers${endpoint}`,
        {
          [user.role === "Customer" ? "preferences" : "specialization"]: input,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.success) {
        Alert.alert("Success", res.data.message);
        navigation.goBack();
      } else {
        Alert.alert("Error", res.data.message);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "An unknown error occurred.";
      setError(errorMessage);
      console.error("Update Error:", errorMessage);
    }
  };

  useEffect(() => {
    if (error) {
      Alert.alert("Update Error", error || "An unknown error occurred.");
    }
  }, [error]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          {user.role === "Customer"
            ? "Enter your preferences"
            : "Enter your specialization"}
        </Text>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder={
            user.role === "Customer" ? "Preferences" : "Specialization"
          }
        />
        <TouchableOpacity style={styles.button} onPress={handleUpdate}>
          <Text style={styles.buttonText}>Update</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  inputContainer: {
    marginVertical: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#000000",
    height: 45,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "500",
  },
});

export default SetPreferences_Specialization;
