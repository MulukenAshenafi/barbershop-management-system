import {
  View,
  Text,
  StatusBar,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React from "react";
import Header from "./Header";
import Footer from "./Footer";

const Layout = ({ children }) => {
  return (
    <>
      <StatusBar />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <View style={styles.content}>{children}</View>
        <View style={styles.footer}>
          <Footer />
        </View>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  footer: {
    width: "100%",
    borderTopWidth: 1,
    borderColor: "lightgray",
    padding: 10,
  },
});

export default Layout;
