import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, FlatList } from "react-native";
import axios from "axios";
import config from "../../config"; // Import config for API base URL
import Layout from "../../components/Layout/Layout";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Import AsyncStorage

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true); // To handle loading state

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Fetch the stored customer data
        const storedCustomerData = await AsyncStorage.getItem("customerData");

        if (!storedCustomerData) {
          console.log("No customer data found in storage");
          return;
        }

        const { customerId } = JSON.parse(storedCustomerData);

        const response = await axios.get(
          `${config.apiBaseUrl}/booking/notifications?userId=${customerId}`
        );
        setNotifications(response.data.notifications);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  if (loading) {
    return (
      <Layout>
        <View style={styles.container}>
          <Text>Loading notifications...</Text>
        </View>
      </Layout>
    );
  }

  return (
    <Layout>
      <View style={styles.container}>
        {notifications.length === 0 ? (
          <Text>Oops! You don't have any Notifications</Text>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View style={styles.notification}>
                <Text>{item.message}</Text>
                <Text>{new Date(item.date).toLocaleString()}</Text>
              </View>
            )}
          />
        )}
      </View>
    </Layout>
  );
};

export default Notifications;

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  notification: {
    padding: 20,
    marginVertical: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 5,
  },
});
