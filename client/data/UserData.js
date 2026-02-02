import AsyncStorage from "@react-native-async-storage/async-storage";

// Define an initial UserData object with default values
export let UserData = {
  _id: "",
  profilePic: "https://cdn-icons-png.flaticon.com/512/3177/3177440.png",
  name: "Unknown",
  email: "",
  role: "",
  phone: "",
  location: "",
  preferences: "",
  specialization: "",
};

// Function to load user data from AsyncStorage and update UserData object
export const loadUserData = async () => {
  try {
    const customerData = await AsyncStorage.getItem("customerData");
    if (customerData) {
      const user = JSON.parse(customerData);
      // Normalize profile pic to a string (backend may return array e.g. [{ url: "..." }])
      let profilePic = user.customerProfilePic || "https://cdn-icons-png.flaticon.com/512/3177/3177440.png";
      if (Array.isArray(profilePic)) {
        profilePic = profilePic[0]?.url ?? profilePic[0] ?? "https://cdn-icons-png.flaticon.com/512/3177/3177440.png";
      } else if (typeof profilePic !== "string") {
        profilePic = "https://cdn-icons-png.flaticon.com/512/3177/3177440.png";
      }
      UserData = {
        _id: user.customerId || "",
        profilePic,

        name: user.customerName || "Unknown",
        email: user.customerEmail || "",
        role: user.customerRole || "",
        phone: user.customerPhone || "",
        location: user.customerLocation || "",
        preferences: user.customerPreferences || "",
        specialization: user.customerSpecialization || "",
      };
    }
  } catch (error) {
    console.error("Error loading user data from AsyncStorage:", error);
  }
};
