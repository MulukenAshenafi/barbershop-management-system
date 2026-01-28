import axios from "axios";
import config from "../config";

// Initialize the ServicesData array
export let ServicesData = [];

// Function to fetch services from the backend
export const fetchServicesData = async () => {
  try {
    const response = await axios.get(`${config.apiBaseUrl}/service/get-all`); // Replace with your actual API URL
    const services = response.data.services;

    // Map the services to the expected format and update ServicesData
    ServicesData = services.map((service) => ({
      _id: service._id,
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      category: service.category,
      imageUrl: service.imageUrl || "", // Ensure that image URL is handled
    }));

    return ServicesData; // Return the formatted data if needed
  } catch (error) {
    console.error("Error fetching services:", error);
    return []; // Return an empty array if there's an error
  }
};

// Automatically fetch data as soon as the module is imported
fetchServicesData();
