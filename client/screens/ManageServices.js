import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import config from "../config";

const ManageServices = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [duration, setDuration] = useState("");
  const [image, setImage] = useState(null);
  const [showForm, setShowForm] = useState(false); // Toggle form visibility
  const navigation = useNavigation();

  // Function to handle image picking
  const handleImagePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "We need media library permissions to select an image."
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // Function to handle form submission
  const handleSubmit = async () => {
    if (!name || !description || !price || !category || !duration || !image) {
      Alert.alert("Validation Error", "All fields and image are required.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("category", category);
    formData.append("duration", duration);

    const uriParts = image.split(".");
    const fileType = uriParts[uriParts.length - 1];
    formData.append("file", {
      uri: image,
      name: `service-image.${fileType}`,
      type: `image/${fileType}`,
    });

    try {
      await axios.post(`${config.apiBaseUrl}/service/create`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      Alert.alert("Success", "Service created successfully");
      navigation.goBack();
    } catch (error) {
      console.error("Error creating service:", error);
      Alert.alert("Error", "Failed to create service");
    }
  };

  return (
    <View style={styles.container}>
      {/* Buttons for viewing services and creating a service */}
      <TouchableOpacity
        style={styles.viewServicesBtn}
        onPress={() => navigation.navigate("ServiceList")} // Navigate to Service List
      >
        <Text style={styles.viewServicesBtnText}>View All Services</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.createServiceBtn}
        onPress={() => setShowForm(!showForm)} // Toggle form visibility
      >
        <Text style={styles.createServiceBtnText}>Create Service</Text>
      </TouchableOpacity>

      {/* Conditional rendering of the Create Service form */}
      {showForm && (
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Service Name"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
          />
          <TextInput
            style={styles.input}
            placeholder="Price"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />
          <TextInput
            style={styles.input}
            placeholder="Duration (e.g., 30 mins)"
            value={duration}
            onChangeText={setDuration}
          />
          <Picker
            selectedValue={category}
            style={styles.picker}
            onValueChange={(itemValue) => setCategory(itemValue)}
          >
            <Picker.Item label="Select Category" value="" />
            <Picker.Item label="Haircut" value="Haircut" />
            <Picker.Item label="Beard Trim" value="Beard Trim" />
            <Picker.Item label="Shave" value="Shave" />
            <Picker.Item label="Hair Wash" value="Hair Wash" />
            <Picker.Item label="Hair Coloring" value="Hair Coloring" />
            <Picker.Item label="Kids Haircut" value="Kids Haircut" />
            <Picker.Item label="Special Packages" value="Special Packages" />
          </Picker>

          <TouchableOpacity
            style={styles.imageButton}
            onPress={handleImagePick}
          >
            <Text style={styles.imageButtonText}>Select Image</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Create Service</Text>
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
  viewServicesBtn: {
    backgroundColor: "#32CD32",
    width: "80%",
    justifyContent: "center",
    height: 45,
    borderRadius: 5,
    marginBottom: 20,
    alignSelf: "center",
  },
  viewServicesBtnText: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 20,
    color: "#fff",
  },
  createServiceBtn: {
    backgroundColor: "#32CD32",
    width: "80%",
    justifyContent: "center",
    height: 45,
    borderRadius: 5,
    alignSelf: "center",
  },
  createServiceBtnText: {
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
  picker: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  imageButton: {
    backgroundColor: "#FF6347",
    borderRadius: 5,
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 15,
  },
  imageButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  submitButton: {
    backgroundColor: "#32CD32",
    borderRadius: 5,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
});

export default ManageServices;
