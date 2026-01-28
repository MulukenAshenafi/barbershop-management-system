import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import React from "react";
import Layout from "../components/Layout/Layout";
import { ServicesData } from "../data/ServicesData";

const Bookings = () => {
  return (
    <Layout>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Service Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Services</Text>
            {ServicesData.map((service) => (
              <View key={service.id} style={styles.serviceCard}>
                <Text style={styles.serviceTitle}>{service.name}</Text>
                <Text style={styles.serviceDescription}>
                  {service.description}
                </Text>
                <TouchableOpacity style={styles.button}>
                  <Text style={styles.buttonText}>Book Now</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Help and Support */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Help & Support</Text>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Contact Support</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Layout>
  );
};

export default Bookings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    padding: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  serviceCard: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  serviceDescription: {
    fontSize: 14,
    color: "#555",
  },
  button: {
    backgroundColor: "#FF6347",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
  },
});
