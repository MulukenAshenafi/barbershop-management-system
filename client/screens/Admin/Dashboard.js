import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import Layout from "../../components/Layout/Layout";
import { FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { shadows } from "../../theme";
import BarbershopSelector from "../../components/barbershop/BarbershopSelector";

const Dashboard = () => {
  const navigation = useNavigation();

  return (
    <Layout>
      <View style={styles.main}>
        <View style={styles.selectorRow}>
          <BarbershopSelector />
        </View>
        <Text style={styles.heading}>Dashboard</Text>
        <View style={styles.btnContainer}>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => navigation.navigate("ManageServices")} // Adjust the name to match your route
          >
            <FontAwesome style={styles.icon} name="cut" />
            <Text style={styles.btnText}>Manage Services</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => navigation.navigate("ManageStaff")}
          >
            <FontAwesome style={styles.icon} name="users" />
            <Text style={styles.btnText}>Manage Staff</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => navigation.navigate("ManageBarbers")}
          >
            <FontAwesome style={styles.icon} name="user-plus" />
            <Text style={styles.btnText}>Manage Barbers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => navigation.navigate("ManageProduct")}
          >
            <FontAwesome style={styles.icon} name="archive" />
            <Text style={styles.btnText}>Manage Products</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => navigation.navigate("ManageBookings")} // Adjust the name to match your route
          >
            <FontAwesome style={styles.icon} name="calendar" />
            <Text style={styles.btnText}>Manage Bookings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => navigation.navigate("ManagePayments")} // Adjust the name to match your route
          >
            <FontAwesome style={styles.icon} name="money" />
            <Text style={styles.btnText}>Manage Payments</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => navigation.navigate("AboutApp")} // Adjust the name to match your route
          >
            <FontAwesome style={styles.icon} name="info-circle" />
            <Text style={styles.btnText}>About App</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  main: {
    backgroundColor: "lightgray",
    height: "96%",
  },
  selectorRow: {
    margin: 10,
    marginBottom: 0,
  },
  heading: {
    backgroundColor: "#000000",
    color: "#ffffff",
    textAlign: "center",
    padding: 10,
    fontSize: 20,
    margin: 10,
    borderRadius: 5,
    fontWeight: "bold",
  },
  btnContainer: {
    margin: 10,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    ...shadows.md,
  },
  icon: {
    fontSize: 25,
    marginRight: 10,
    marginLeft: 20,
  },
  btnText: {
    fontSize: 18,
  },
});

export default Dashboard;
