import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from "./screens/Home";
import About from "./screens/About";
import ProductDetails from "./screens/ProductDetails";
import Cart from "./screens/Cart";
import Checkout from "./screens/Checkout";
import Payments from "./screens/Payments";
import Login from "./screens/auth/Login";
import Register from "./screens/auth/Register";
import Account from "./screens/Account/Account";
import Notifications from "./screens/Account/Notifications";
import Profile from "./screens/Account/Profile";
import MyOrders from "./screens/Account/MyOrders";
import Dashboard from "./screens/Admin/Dashboard";
import ServiceDetails from "./screens/ServiceDetails";
import MyAppointment from "./screens/Account/MyAppointments";
import Services from "./components/Services/FooterServices";
import Bookings from "./screens/Bookings";
import ManageProduct from "./screens/ManageProduct";
import ProductList from "./screens/ProductList";
import ManageServices from "./screens/ManageServices";
import ManageBarbers from "./screens/ManageBarbers";
import BarberList from "./screens/BarberList";
import BookService from "./screens/BookService";
import Confirmation from "./screens/Confirmation";
import SetPreferences_Specialization from "./screens/Preferences/SetPreferences_Specialization";
import ServiceList from "./screens/ServiceList";
import ManageBookings from "./screens/ManageBookings";
import ManagePayments from "./screens/ManagePayments";

const Stack = createNativeStackNavigator(); //routes

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="login">
        <Stack.Screen
          name="home"
          component={Home}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="productDetails" component={ProductDetails} />
        <Stack.Screen name="serviceDetails" component={ServiceDetails} />
        <Stack.Screen name="checkout" component={Checkout} />
        <Stack.Screen
          name="Confirmation"
          component={Confirmation}
          options={{ headerShown: false }}
        />

        <Stack.Screen name="myorders" component={MyOrders} />
        <Stack.Screen name="myappointments" component={MyAppointment} />

        <Stack.Screen name="profile" component={Profile} />
        <Stack.Screen name="notifications" component={Notifications} />
        <Stack.Screen name="adminPanel" component={Dashboard} />
        <Stack.Screen name="ManageProduct" component={ManageProduct} />
        <Stack.Screen name="ProductList" component={ProductList} />
        <Stack.Screen name="ManageServices" component={ManageServices} />
        <Stack.Screen name="ManageBarbers" component={ManageBarbers} />
        <Stack.Screen name="ManagePayments" component={ManagePayments} />
        <Stack.Screen name="ManageBookings" component={ManageBookings} />
        <Stack.Screen name="BarberList" component={BarberList} />

        <Stack.Screen
          name="login"
          component={Login}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="register"
          component={Register}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="payment"
          component={Payments}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="account" component={Account} />
        <Stack.Screen
          name="SetPreferences_Specialization"
          component={SetPreferences_Specialization}
        />
        <Stack.Screen name="services" component={Services} />
        <Stack.Screen name="ServiceList" component={ServiceList} />

        <Stack.Screen name="BookService" component={BookService} />
        <Stack.Screen name="bookings" component={Bookings} />
        <Stack.Screen name="cart" component={Cart} />
        <Stack.Screen name="haircut" component={About} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
