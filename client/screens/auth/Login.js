import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Dimensions,
  Image,
  StatusBar,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import InputBox from "../../components/Form/InputBox";
import config from "../../config";

const abushLogo = require("../../assets/a-logo-for-a-abush-barber-shop.jpeg");

const { width } = Dimensions.get("window");

const Login = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!username || !password) {
      return Alert.alert(
        "Validation Error",
        "Please enter username and password"
      );
    }

    try {
      const response = await axios.post(
        `${config.apiBaseUrl}/customers/login`,
        {
          username,
          password,
        }
      );

      if (response.data.success) {
        const user = response.data.user || {};

        await AsyncStorage.setItem(
          "customerData",
          JSON.stringify({
            customerId: user.id || "", // Store the customer ID
            customerName: user.name || "Unknown",
            customerEmail: user.email || "",
            customerRole: user.role || "",
            customerPhone: user.phone || "",
            customerProfilePic:
              user.profilePic?.[0]?.url ||
              "https://cdn-icons-png.flaticon.com/512/3177/3177440.png", // Extract the URL from profilePic array

            customerLocation: user.location || "",
            customerPreferences: user.preferences || "",
            customerSpecialization: user.specialization || "",
          })
        );

        Alert.alert("Success", "Login Successfully");
        navigation.navigate("home");
      } else {
        Alert.alert("Login Error", response.data.message || "Unknown error");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "An error occurred while trying to log in.";
      Alert.alert("Login Error", errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.logoContainer}>
        <Image source={abushLogo} style={styles.logo} />
      </View>
      <View style={{ alignItems: "center" }}>
        <InputBox
          placeholder={"Enter your Username"}
          value={username}
          setValue={setUsername}
          autoComplete={"username"}
        />

        <InputBox
          placeholder={"Enter your Password"}
          value={password}
          setValue={setPassword}
          inputType="password" // Now using inputType for password input
        />
      </View>

      <View style={styles.btnContainer}>
        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
          <Text style={styles.loginBtnText}>Login</Text>
        </TouchableOpacity>

        <Text>
          I Have No Account?{"  "}
          <Text
            style={styles.link}
            onPress={() => navigation.navigate("register")}
          >
            Sign Up
          </Text>
        </Text>
      </View>

      {/* Copyright Section */}
      <Text style={styles.copyright}>
        ©2024 Abush Barber Shop. All rights reserved.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",

    height: "100%",
    padding: 20,
    backgroundColor: "#fff",
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: StatusBar.currentHeight || 20,
    marginBottom: 30, // Increased margin for spacing
  },
  logo: {
    width: 150, // Increased size
    height: 150, // Increased size
    borderRadius: 75, // Adjusted to maintain circular shape
    resizeMode: "contain",
  },
  btnContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  loginBtn: {
    backgroundColor: "#000000",
    width: "80%",
    justifyContent: "center",
    height: 40,
    borderRadius: 10,
    marginVertical: 20,
  },
  loginBtnText: {
    color: "#ffffff",
    textAlign: "center",
    textTransform: "uppercase",
    fontSize: 18,
    fontWeight: "500",
  },
  link: {
    color: "red",
    textDecorationLine: "underline",
  },
  copyright: {
    textAlign: "center",
    color: "gray",
    marginTop: 20,
  },
});

export default Login;
