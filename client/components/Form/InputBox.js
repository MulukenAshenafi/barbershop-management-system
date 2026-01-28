import { StyleSheet, TextInput, View } from "react-native";
import React, { useState } from "react";
import { Feather } from "@expo/vector-icons"; // For eye icon

const InputBox = ({
  value,
  setValue,
  placeholder,
  secureTextEntry,
  inputType,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, inputType === "password" && styles.passwordInput]}
        placeholder={placeholder}
        autoCorrect={false}
        secureTextEntry={inputType === "password" && !showPassword}
        value={value}
        onChangeText={(text) => setValue(text)}
      />
      {inputType === "password" && (
        <Feather
          name={showPassword ? "eye" : "eye-off"}
          size={20}
          color="gray"
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeIcon}
        />
      )}
    </View>
  );
};

export default InputBox;

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
    position: "relative",
    width: "88%",
  },
  input: {
    backgroundColor: "#ffffff",
    height: 40,
    paddingLeft: 10,
    borderRadius: 10,
    color: "#000000",
    borderWidth: 1,
    borderColor: "gray",
    width: "100%", // Ensure it takes full width of the container
  },
  passwordInput: {
    paddingRight: 40, // Add space for the eye icon
  },
  eyeIcon: {
    position: "absolute",
    right: 10,
    top: 10, // Adjust to vertically center the icon
  },
});
