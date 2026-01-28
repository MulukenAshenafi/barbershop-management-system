import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { useNavigation } from "@react-navigation/native";

const ServiceCard = ({ s }) => {
  const navigation = useNavigation();

  const handleMoreButton = (id) => {
    navigation.navigate("serviceDetails", { _id: id });
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
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    marginVertical: 10,
    marginHorizontal: 8,
    width: 150,
    padding: 8,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    height: 100,
    width: "100%",
    marginBottom: 8,
    borderRadius: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center",
  },
  cardDescription: {
    fontSize: 12,
    textAlign: "left",
  },
  BtnContainer: {
    marginTop: 5,
    flexDirection: "row",
    justifyContent: "center", // Center the button now that there is only one
    alignItems: "center",
  },
  btn: {
    backgroundColor: "#000",
    height: 30,
    width: 70,
    borderRadius: 15,
    justifyContent: "center",
  },
  btnText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "bold",
  },
});

export default ServiceCard;
