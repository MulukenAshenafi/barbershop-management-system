import { ScrollView, StyleSheet, Text, View } from "react-native";
import React from "react";
import Layout from "../../components/Layout/Layout";
import { AppointmentData } from "../../data/AppointmentData";
import AppointmentItem from "../../components/Form/AppointmentItem";

const MyAppointments = () => {
  return (
    <Layout>
      <View style={styles.container}>
        <Text style={styles.heading}>My Appointments</Text>
        <ScrollView>
          {AppointmentData.map((appointment) => (
            <AppointmentItem key={appointment._id} appointment={appointment} />
          ))}
        </ScrollView>
      </View>
    </Layout>
  );
};

export default MyAppointments;

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
  heading: {
    textAlign: "center",
    color: "gray",
    fontWeight: "bold",
    fontSize: 20,
  },
});
