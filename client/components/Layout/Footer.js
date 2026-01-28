import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import React from "react";
import AntDesign from "react-native-vector-icons/AntDesign";
import { useRoute, useNavigation } from "@react-navigation/native";

const Footer = () => {
  const route = useRoute();
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.menuContainer}
        onPress={() => navigation.navigate("home")}
      >
        <AntDesign
          style={[styles.icon, route.name === "home" && styles.active]}
          name="home"
        />
        <Text style={[styles.iconText, route.name === "home" && styles.active]}>
          Home
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuContainer}
        onPress={() => navigation.navigate("services")}
      >
        <AntDesign
          style={[styles.icon, route.name === "services" && styles.active]}
          name="appstore-o"
        />
        <Text
          style={[styles.iconText, route.name === "services" && styles.active]}
        >
          Services
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuContainer}
        onPress={() => navigation.navigate("bookings")}
      >
        <AntDesign
          style={[styles.icon, route.name === "bookings" && styles.active]}
          name="calendar"
        />
        <Text
          style={[styles.iconText, route.name === "bookings" && styles.active]}
        >
          Bookings
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuContainer}
        onPress={() => navigation.navigate("account")}
      >
        <AntDesign
          style={[styles.icon, route.name === "account" && styles.active]}
          name="user"
        />
        <Text
          style={[styles.iconText, route.name === "account" && styles.active]}
        >
          Account
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuContainer}
        onPress={() => navigation.navigate("cart")}
      >
        <AntDesign
          style={[styles.icon, route.name === "cart" && styles.active]}
          name="shoppingcart"
        />
        <Text style={[styles.iconText, route.name === "cart" && styles.active]}>
          Cart
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    elevation: 5,
  },
  menuContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 24,
    color: "#000000",
  },
  iconText: {
    fontSize: 12,
    color: "#000000",
  },
  active: {
    color: "blue",
  },
});

export default Footer;
