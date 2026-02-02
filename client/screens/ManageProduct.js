import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { FontAwesome } from "@expo/vector-icons";
import { shadows } from "../theme";
import { useTheme } from "../context/ThemeContext";
import { getFileForFormData } from "../utils/imageUpload";

// Define the backend API endpoint
const API_URL = "http://10.139.55.179:8080/api/products"; // Update this with your actual API URL

const ManageProduct = ({ navigation }) => {
  const { colors } = useTheme();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
  });
  const [image, setImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/get-all`);
      setProducts(response.data.products);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to fetch products. Please try again later.");
    }
  };

  const handleInputChange = (name, value) => {
    setForm({ ...form, [name]: value });
  };

  const validateForm = () => {
    const { name, description, price, stock, category } = form;
    if (!name || !description || !price || !stock || !category) {
      Alert.alert("Validation Error", "Please fill all fields.");
      return false;
    }
    if (isNaN(price) || isNaN(stock)) {
      Alert.alert("Validation Error", "Price and Stock must be numbers.");
      return false;
    }
    return true;
  };

  const handleProductSubmit = async () => {
    if (!validateForm()) return;
    if (isSubmitting) return;
    setIsSubmitting(true);
    const { name, description, price, stock, category } = form;
    try {
      if (selectedProduct) {
        // Update product
        await axios.put(`${API_URL}/${selectedProduct._id}`, {
          name,
          description,
          price,
          stock,
          category,
        });
      } else {
        // Create new product
        const data = new FormData();
        data.append("name", name);
        data.append("description", description);
        data.append("price", price);
        data.append("stock", stock);
        data.append("category", category);
        if (image) {
          const uri = image.assets?.[0]?.uri ?? image.uri;
          const file = await getFileForFormData(uri, "product.jpg", "image/jpeg");
          if (file) data.append("image", file);
        }
        await axios.post(`${API_URL}/create`, data, {
          headers: { "Content-Type": false },
        });
      }
      fetchProducts();
      resetForm();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to submit product. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProductDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/delete/${id}`);
      fetchProducts();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to delete product. Please try again later.");
    }
  };

  const handleImageUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Sorry, we need camera roll permissions to make this work!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result);
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      price: "",
      stock: "",
      category: "",
    });
    setSelectedProduct(null);
    setImage(null);
  };

  const renderProductItem = ({ item }) => (
    <View style={[styles.productItem, { backgroundColor: colors.card }]}>
      <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.productPrice, { color: colors.textSecondary }]}>${item.price}</Text>
        <View style={styles.productActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setSelectedProduct(item)}
          >
            <FontAwesome name="edit" size={20} color="#007BFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleProductDelete(item._id)}
          >
            <FontAwesome name="trash" size={20} color="#FF0000" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.heading, { color: colors.text }]}>Manage Products</Text>
      <FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={(item) => item._id}
      />
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
        placeholder="Name"
        placeholderTextColor={colors.textSecondary}
        value={form.name}
        onChangeText={(text) => handleInputChange("name", text)}
      />
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
        placeholder="Description"
        placeholderTextColor={colors.textSecondary}
        value={form.description}
        onChangeText={(text) => handleInputChange("description", text)}
      />
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
        placeholder="Price"
        placeholderTextColor={colors.textSecondary}
        value={form.price}
        onChangeText={(text) => handleInputChange("price", text)}
        keyboardType="numeric"
      />
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
        placeholder="Stock"
        placeholderTextColor={colors.textSecondary}
        value={form.stock}
        onChangeText={(text) => handleInputChange("stock", text)}
        keyboardType="numeric"
      />
      <TextInput
        style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
        placeholder="Category"
        placeholderTextColor={colors.textSecondary}
        value={form.category}
        onChangeText={(text) => handleInputChange("category", text)}
      />
      <Button title="Select Image" onPress={handleImageUpload} />
      {image && (
        <Image
          source={{ uri: image.assets?.[0]?.uri ?? image.uri }}
          style={styles.image}
        />
      )}
      <Button
        title={selectedProduct ? "Update Product" : "Create Product"}
        onPress={handleProductSubmit}
        disabled={isSubmitting}
      />
      <Button title="Reset Form" onPress={resetForm} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  productItem: {
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    ...shadows.sm,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 5,
  },
  productInfo: {
    flex: 1,
    marginLeft: 10,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  productPrice: {
    fontSize: 14,
  },
  productActions: {
    flexDirection: "row",
    marginTop: 10,
  },
  actionButton: {
    marginRight: 10,
  },
  input: {
    height: 40,
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  image: {
    width: 100,
    height: 100,
    marginVertical: 10,
  },
});

export default ManageProduct;
