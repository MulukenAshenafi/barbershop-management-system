import React, { useState, useEffect } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Pressable,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import InputBox from "../../components/Form/InputBox";
import config from "../../config";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Profile = ({ route, navigation }) => {
  const { user } = route.params;

  const [email, setEmail] = useState(user.email);
  const [profilePic, setProfilePic] = useState(user.profilePic);
  const [name, setName] = useState(user.name);
  const [location, setLocation] = useState(user.location);
  const [contact, setContact] = useState(user.phone);
  const [extraField, setExtraField] = useState(
    user.role === "Customer" ? user.preferences : user.specialization
  );
  const [newImage, setNewImage] = useState(null); // State to hold the new profile image
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

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
      setNewImage(result.assets[0].uri); // Save the selected image URI
    } else {
      console.log("Image selection cancelled");
    }
  };

  // Update profile handler
  const handleUpdate = async () => {
    if (!email || !name || !location || !contact || !extraField) {
      return Alert.alert("Validation Error", "Please provide all fields");
    }

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("phone", contact);
      formData.append("location", location);
      formData.append("preferencesOrSpecialization", extraField); // Use this for the extra field

      if (newImage) {
        const uriParts = newImage.split(".");
        const fileType = uriParts[uriParts.length - 1];
        formData.append("file", {
          uri: newImage,
          name: `profile-pic.${fileType}`,
          type: `image/${fileType}`,
        });
      }

      const token = await AsyncStorage.getItem("token");

      const res = await axios.put(
        `${config.apiBaseUrl}/customers/update-profile`, // Update route URL
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setResponse(res.data);
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
    if (response) {
      if (response.success) {
        Alert.alert("Success", "Profile Updated Successfully");
        navigation.navigate("account");
      } else {
        Alert.alert("Update Error", response.message || "An error occurred.");
      }
    }

    if (error) {
      Alert.alert("Update Error", error || "An unknown error occurred.");
    }
  }, [response, error]);

  // Determine the placeholder text for the extra field based on the role
  const extraFieldPlaceholder =
    user.role === "Customer"
      ? "Enter your preferences"
      : "Enter your specialization";

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.imageContainer}>
          <Image
            style={styles.image}
            source={{ uri: newImage || profilePic }}
          />
          <Pressable onPress={handleImagePick}>
            <Text style={styles.updateText}>
              {newImage ? "Change Profile Picture" : "Select Profile Picture"}
            </Text>
          </Pressable>
        </View>
        <InputBox
          value={name}
          setValue={setName}
          placeholder={"Enter your name"}
          autoComplete={"name"}
        />
        <InputBox
          value={email}
          setValue={setEmail}
          placeholder={"Enter your email"}
          autoComplete={"email"}
        />
        <InputBox
          value={location}
          setValue={setLocation}
          placeholder={"Enter your location"}
          autoComplete={"address-line1"}
        />
        <InputBox
          value={contact}
          setValue={setContact}
          placeholder={"Enter your contact number"}
          autoComplete={"tel"}
        />
        <InputBox
          value={extraField}
          setValue={setExtraField}
          placeholder={extraFieldPlaceholder}
          autoComplete={"off"}
        />
        <TouchableOpacity style={styles.btnUpdate} onPress={handleUpdate}>
          <Text style={styles.btnUpdateText}>UPDATE PROFILE</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    height: "100%",
    padding: 20,
  },
  imageContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  image: {
    height: 150,
    width: 150,
    borderRadius: 75,
    resizeMode: "cover",
  },
  updateText: {
    color: "red",
    marginTop: 10,
  },
  btnUpdate: {
    backgroundColor: "#000000",
    height: 45,
    borderRadius: 5,
    marginHorizontal: 30,
    justifyContent: "center",
    marginTop: 20,
  },
  btnUpdateText: {
    color: "#ffffff",
    fontSize: 18,
    textAlign: "center",
    fontWeight: "500",
  },
});

export default Profile;
