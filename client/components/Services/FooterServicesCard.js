import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { useNavigation } from "@react-navigation/native";

const FooterServicesCard = ({ s }) => {
  const navigation = useNavigation();

  // More details button
  const handleMoreButton = (id) => {
    navigation.navigate("serviceDetails", { _id: id });
    console.log(id);
  };

  // Book now button
  const handleBookNow = () => {
    alert("Booking feature not implemented yet");
  };

  return (
    <View style={styles.card}>
      <Image
        style={styles.cardImage}
        resizeMode="contain"
        source={{ uri: s?.imageUrl }}
      />
      <Text style={styles.cardTitle}>{s?.name}</Text>
      <Text style={styles.cardDescription}>
        {s?.description.substring(0, 30)}...more
      </Text>
      <View style={styles.BtnContainer}>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => handleMoreButton(s._id)}
        >
          <Text style={styles.btnText}>Details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnCard} onPress={handleBookNow}>
          <Text style={styles.btnText}>BOOK NOW</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default FooterServicesCard;

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "lightgray",
    marginVertical: 5,
    marginHorizontal: 8,
    width: "100%",
    padding: 16,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    flexDirection: "column",
  },
  cardImage: {
    height: 300,
    width: "100%",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  cardDescription: {
    fontSize: 14,
    textAlign: "left",
  },
  BtnContainer: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  btn: {
    backgroundColor: "#000000",
    height: 35,
    width: 100,
    borderRadius: 20,
    justifyContent: "center",
  },
  btnCard: {
    backgroundColor: "orange",
    height: 35,
    width: 100,
    borderRadius: 20,
    justifyContent: "center",
  },
  btnText: {
    color: "#ffffff",
    textAlign: "center",
    fontSize: 14,
    fontWeight: "bold",
  },
});
