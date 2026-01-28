import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout/Layout";
import AntDesign from "react-native-vector-icons/AntDesign";
import { loadUserData, UserData as initialUserData } from "../../data/UserData";

const Account = ({ navigation }) => {
  const [user, setUser] = useState(initialUserData); // State to hold the dynamic user data

  // Load user data from AsyncStorage when the component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      await loadUserData(); // This will update the UserData object
      setUser({ ...initialUserData }); // Set the updated UserData to state
    };

    fetchUserData();
  }, []);

  const handleSetPreferences = () => {
    Alert.alert(
      "Set Preferences",
      "You don't have preferences set. Would you like to set them now?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Set Preferences",
          onPress: () =>
            navigation.navigate("SetPreferences_Specialization", { user }),
        },
      ]
    );
  };

  const handleSetSpecialization = () => {
    Alert.alert(
      "Set Specialization",
      "You don't have specialization set. Would you like to set it now?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Set Specialization",
          onPress: () =>
            navigation.navigate("SetPreferences_Specialization", { user }),
        },
      ]
    );
  };

  return (
    <Layout>
      <View style={styles.container}>
        <Image source={{ uri: user.profilePic }} style={styles.image} />
        <View style={{ justifyContent: "center", alignItems: "center" }}>
          <Text style={styles.name}>
            Hi {""}
            <Text style={{ color: "green" }}>{user.name}</Text> 👋
          </Text>
          <Text>Email: {user.email}</Text>
          <Text>Contact: {user.phone}</Text>
          <Text>Location: {user.location}</Text>
          {user.role === "Customer" &&
            (user.preferences ? (
              <Text>Preferences: {user.preferences}</Text>
            ) : (
              handleSetPreferences()
            ))}
          {user.role === "Barber" &&
            (user.specialization ? (
              <Text>Specialization: {user.specialization}</Text>
            ) : (
              handleSetSpecialization()
            ))}
        </View>
        <View style={styles.btnContainer}>
          <Text style={styles.HeadingAccSet}>Account Setting</Text>
          <TouchableOpacity
            style={styles.BtnAccSetIcon}
            onPress={() => navigation.navigate("profile", { user })}
          >
            <AntDesign style={styles.BtnTextAccSet} name="edit" />
            <Text style={styles.BtnTextAccSet}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.BtnAccSetIcon}
            onPress={() => navigation.navigate("myorders", { id: user._id })}
          >
            <AntDesign style={styles.BtnTextAccSet} name="bars" />
            <Text style={styles.BtnTextAccSet}>My Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.BtnAccSetIcon}
            onPress={() =>
              navigation.navigate("myappointments", { id: user._id })
            }
          >
            <AntDesign style={styles.BtnTextAccSet} name="calendar" />
            <Text style={styles.BtnTextAccSet}>My Appointments</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.BtnAccSetIcon}
            onPress={() => navigation.navigate("notifications")}
          >
            <AntDesign style={styles.BtnTextAccSet} name="bells" />
            <Text style={styles.BtnTextAccSet}>Notification</Text>
          </TouchableOpacity>
          {user.role === "Admin" && (
            <TouchableOpacity
              style={styles.BtnAccSetIcon}
              onPress={() =>
                navigation.navigate("adminPanel", { id: user._id })
              }
            >
              <AntDesign style={styles.BtnTextAccSet} name="windows" />
              <Text style={styles.BtnTextAccSet}>Admin Panel</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.BtnAccSetIcon}
            onPress={() => {
              alert("Logout Successfully");
              navigation.navigate("login");
            }}
          >
            <AntDesign style={styles.BtnTextAccSet} name="logout" />
            <Text style={styles.BtnTextAccSet}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Layout>
  );
};

export default Account;

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    height: "100%",
    padding: 20,
  },
  image: {
    height: 150,
    width: 150,
    borderRadius: 75,
    resizeMode: "cover",
    alignSelf: "center",
    marginBottom: 20,
  },
  name: {
    marginTop: 10,
    fontSize: 20,
  },
  btnContainer: {
    padding: 10,
    backgroundColor: "#ffffff",
    margin: 10,
    marginVertical: 20,
    elevation: 5,
    borderRadius: 10,
    paddingBottom: 30,
  },
  HeadingAccSet: {
    fontSize: 20,
    fontWeight: "bold",
    paddingBottom: 10,
    textAlign: "center",
    borderBottomWidth: 1,
    borderColor: "lightgray",
  },
  BtnAccSetIcon: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
    padding: 5,
  },
  BtnTextAccSet: {
    fontSize: 15,
    marginRight: 10,
  },
});
