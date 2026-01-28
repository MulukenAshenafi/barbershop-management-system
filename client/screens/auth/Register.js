import React, { useState, useEffect } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import InputBox from "../../components/Form/InputBox";
import config from "../../config";

const Register = ({ navigation }) => {
  const defaultProfileImage =
    "https://uxwing.com/wp-content/themes/uxwing/download/editing-user-action/signup-icon.png";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [contact, setContact] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState(null); // State to hold the selected profile image
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
      setImage(result.assets[0].uri); // Save the selected image URI
    } else {
      console.log("Image selection cancelled");
    }
  };

  const handleSignUp = async () => {
    if (!name || !email || !password || !contact || !location) {
      return Alert.alert("Validation Error", "Please fill in all fields");
    }

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("phone", contact);
      formData.append("location", location);

      if (image) {
        const uriParts = image.split(".");
        const fileType = uriParts[uriParts.length - 1];
        formData.append("file", {
          uri: image,
          name: `profile-pic.${fileType}`,
          type: `image/${fileType}`,
        });
      }

      const res = await axios.post(
        `${config.apiBaseUrl}/customers/signup`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
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
      console.error("Registration Error:", errorMessage);
    }
  };

  useEffect(() => {
    if (response) {
      if (response.success) {
        Alert.alert("Success", "Registered Successfully");
        navigation.navigate("login");
      } else {
        Alert.alert(
          "Registration Error",
          response.message || "An error occurred."
        );
      }
    }

    if (error) {
      Alert.alert("Registration Error", error || "An unknown error occurred.");
    }
  }, [response, error]);

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: image || defaultProfileImage }}
        style={styles.image}
      />

      <TouchableOpacity style={styles.imageButton} onPress={handleImagePick}>
        <Text style={styles.imageButtonText}>
          {image ? "Change Profile Picture" : "Select Profile Picture"}
        </Text>
      </TouchableOpacity>
      <View style={{ alignItems: "center" }}>
        <InputBox
          placeholder="Enter your Name"
          value={name}
          setValue={setName}
          autoComplete="name"
        />
        <InputBox
          placeholder="Enter your Email"
          value={email}
          setValue={setEmail}
          autoComplete="email"
        />
        <InputBox
          placeholder="Enter your Password"
          value={password}
          setValue={setPassword}
          secureTextEntry
        />
        <InputBox
          placeholder="Enter your Contact Number"
          value={contact}
          setValue={setContact}
          autoComplete="tel"
        />
        <InputBox
          placeholder="Enter your Location"
          value={location}
          setValue={setLocation}
        />
      </View>
      <View style={styles.btnContainer}>
        <TouchableOpacity style={styles.logiBtn} onPress={handleSignUp}>
          <Text style={styles.logiBtnText}>Sign Up</Text>
        </TouchableOpacity>
        <Text>
          Already have an account?{" "}
          <Text
            style={styles.link}
            onPress={() => navigation.navigate("login")}
          >
            Login
          </Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    height: "100%",
    padding: 20,
  },
  image: {
    height: 150,
    width: 150,
    borderRadius: 75,
    resizeMode: "cover",
    alignSelf: "center",
    marginBottom: 20,
  },
  imageButton: {
    backgroundColor: "#32CD32",
    borderRadius: 5,
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  imageButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  btnContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  logiBtn: {
    backgroundColor: "#000000",
    width: "80%",
    justifyContent: "center",
    height: 45,
    borderRadius: 5,
    marginTop: 20,
  },
  logiBtnText: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 20,
    color: "#ffffff",
  },
  link: {
    color: "blue",
    fontWeight: "bold",
  },
});

export default Register;
