import { StatusBar } from "expo-status-bar";
import { useRef, useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet, Linking, Alert } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { setUnauthorizedHandler, setSubscriptionExpiredHandler } from "./services/api";
import { getRolePreference, setPendingInviteToken } from "./services/auth";
import NotificationService, { setNotificationNavigationRef } from "./services/notifications";
import { CartProvider } from "./context/CartContext";
import { BarbershopProvider, useBarbershop } from "./context/BarbershopContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider, useToast } from "./components/common/Toast";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { colors } from "./theme";
import config from "./config";

import Home from "./screens/Home";
import About from "./screens/About";
import ProductDetails from "./screens/ProductDetails";
import Cart from "./screens/Cart";
import Checkout from "./screens/Checkout";
import Payments from "./screens/Payments";
import WelcomeScreen from "./screens/auth/WelcomeScreen";
import Login from "./screens/auth/Login";
import Register from "./screens/auth/Register";
import PhoneLogin from "./screens/auth/PhoneLogin";
import EmailSignInScreen from "./screens/auth/EmailSignInScreen";
import EmailLinkHandler from "./components/auth/EmailLinkHandler";
import Account from "./screens/Account/Account";
import Notifications from "./screens/Account/Notifications";
import NotificationPreferences from "./screens/Account/NotificationPreferences";
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
import EnrollmentGateScreen from "./screens/enrollment/EnrollmentGateScreen";
import BarbershopRegistrationScreen from "./screens/enrollment/BarbershopRegistrationScreen";
import JoinBarbershopScreen from "./screens/enrollment/JoinBarbershopScreen";
import ManageStaffScreen from "./screens/Admin/ManageStaffScreen";
import ExploreShopsScreen from "./screens/ExploreShopsScreen";
import ShopPublicProfileScreen from "./screens/ShopPublicProfileScreen";
import ReviewsScreen from "./screens/Shop/ReviewsScreen";

const Stack = createNativeStackNavigator();

function ThemeAwareStatusBar() {
  const { isDark } = useTheme();
  return (
    <StatusBar style={isDark ? "light" : "dark"} backgroundColor="transparent" />
  );
}

function useNavigationTheme() {
  const { colors, isDark } = useTheme();
  return {
    dark: isDark,
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.primary,
    },
  };
}

function ThemedNavigationContainer({ navigationRef, linking, children }) {
  const theme = useNavigationTheme();
  return (
    <NavigationContainer ref={navigationRef} linking={linking} theme={theme}>
      {children}
    </NavigationContainer>
  );
}

/** When isAuth, decide initial route: enrollment-gate vs home based on myShops and role_preference. */
function EnrollmentAwareNavigator({ isAuth }) {
  const { myShops, loading } = useBarbershop();
  const [routeReady, setRouteReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState("home");

  useEffect(() => {
    if (!isAuth) return;
    if (loading) return;
    let cancelled = false;
    getRolePreference().then((rp) => {
      if (cancelled) return;
      const noShops = !myShops || myShops.length === 0;
      const noPreference = !rp || rp !== "customer";
      if (noShops && noPreference) {
        setInitialRoute("enrollment-gate");
      } else {
        setInitialRoute("home");
      }
      setRouteReady(true);
    });
    return () => { cancelled = true; };
  }, [isAuth, loading, myShops]);

  if (!routeReady) {
    return (
      <View style={styles.gate}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator initialRouteName={initialRoute}>
      <Stack.Screen name="welcome" component={WelcomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="login" component={Login} options={{ headerShown: false }} />
      <Stack.Screen name="register" component={Register} options={{ headerShown: false }} />
      <Stack.Screen name="phone-login" component={PhoneLogin} options={{ headerShown: false }} />
      <Stack.Screen name="enrollment-gate" component={EnrollmentGateScreen} options={{ headerShown: false }} />
      <Stack.Screen name="barbershop-registration" component={BarbershopRegistrationScreen} options={{ title: "Register Barbershop" }} />
      <Stack.Screen name="join-barbershop" component={JoinBarbershopScreen} options={{ title: "Join Barbershop" }} />
      <Stack.Screen name="ManageStaff" component={ManageStaffScreen} options={{ title: "Manage Staff" }} />
      <Stack.Screen name="ExploreShops" component={ExploreShopsScreen} options={{ title: "Explore Shops" }} />
      <Stack.Screen name="ShopPublicProfile" component={ShopPublicProfileScreen} options={{ title: "Shop" }} />
      <Stack.Screen name="Reviews" component={ReviewsScreen} options={{ title: "Reviews" }} />
      <Stack.Screen name="home" component={Home} options={{ headerShown: false }} />
      <Stack.Screen name="productDetails" component={ProductDetails} />
      <Stack.Screen name="serviceDetails" component={ServiceDetails} />
      <Stack.Screen name="checkout" component={Checkout} />
      <Stack.Screen name="Confirmation" component={Confirmation} options={{ headerShown: false }} />
      <Stack.Screen name="myorders" component={MyOrders} />
      <Stack.Screen name="myappointments" component={MyAppointment} />
      <Stack.Screen name="profile" component={Profile} />
      <Stack.Screen name="notifications" component={Notifications} />
      <Stack.Screen name="notification-preferences" component={NotificationPreferences} options={{ title: "Notification settings" }} />
      <Stack.Screen name="adminPanel" component={Dashboard} />
      <Stack.Screen name="ManageProduct" component={ManageProduct} />
      <Stack.Screen name="ProductList" component={ProductList} />
      <Stack.Screen name="ManageServices" component={ManageServices} />
      <Stack.Screen name="ManageBarbers" component={ManageBarbers} />
      <Stack.Screen name="ManagePayments" component={ManagePayments} />
      <Stack.Screen name="ManageBookings" component={ManageBookings} />
      <Stack.Screen name="BarberList" component={BarberList} />
      <Stack.Screen name="payment" component={Payments} options={{ headerShown: false }} />
      <Stack.Screen name="account" component={Account} />
      <Stack.Screen name="SetPreferences_Specialization" component={SetPreferences_Specialization} />
      <Stack.Screen name="services" component={Services} />
      <Stack.Screen name="ServiceList" component={ServiceList} />
      <Stack.Screen name="BookService" component={BookService} />
      <Stack.Screen name="bookings" component={Bookings} />
      <Stack.Screen name="cart" component={Cart} />
      <Stack.Screen name="haircut" component={About} />
    </Stack.Navigator>
  );
}

function AuthGate({ children }) {
  const { isAuth, checked, checkAuth } = useAuth();

  if (!checked) {
    return (
      <View style={styles.gate}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // When config.forceWelcome is true, always show Welcome first (e.g. for testing or fresh UX)
  const effectiveAuth = config.forceWelcome ? false : isAuth;
  return children(effectiveAuth);
}

/** Sets 401 handler to show "Session expired" toast then redirect to Welcome. Must be inside ToastProvider. */
function ApiHandlersSetup({ navigationRef }) {
  const toast = useToast();
  useEffect(() => {
    setUnauthorizedHandler((message) => {
      toast.show(message || "Session expired", { type: "error" });
      setTimeout(() => {
        try {
          if (navigationRef.current?.isReady()) {
            navigationRef.current.reset({
              index: 0,
              routes: [{ name: "welcome" }],
            });
          }
        } catch (e) {}
      }, 300);
    });
    return () => setUnauthorizedHandler(null);
  }, [toast, navigationRef]);
  return null;
}

function PushNotificationSetup({ isAuth, navigationRef }) {
  useEffect(() => {
    if (!isAuth) return;
    setNotificationNavigationRef(() => navigationRef);
    NotificationService.setupNotificationHandlers();
    NotificationService.registerForPushNotifications();
  }, [isAuth, navigationRef]);
  return null;
}

function parseInviteUrl(url) {
  if (!url || typeof url !== "string") return null;
  try {
    const u = url.replace(/^barberbook:\/\//, "https://x/").replace(/^barberbook:\//, "https://x/");
    const parsed = new URL(u);
    const token = parsed.searchParams.get("token");
    return token ? token.trim() : null;
  } catch (e) {
    return null;
  }
}

export default function App() {
  const navigationRef = useRef(null);

  useEffect(() => {
    setSubscriptionExpiredHandler(() => {
      Alert.alert(
        "Shop unavailable",
        "This shop is temporarily unavailable. Please try another shop or try again later."
      );
    });
    return () => setSubscriptionExpiredHandler(null);
  }, []);

  useEffect(() => {
    const handleUrl = async (url) => {
      if (!url || typeof url !== "string") return;
      const token = parseInviteUrl(url);
      if (token) {
        await setPendingInviteToken(token);
        try {
          if (navigationRef.current?.isReady()) {
            navigationRef.current.navigate("join-barbershop", { token });
          }
        } catch (e) {}
        return;
      }
      try {
        const u = url.replace(/^barberbook:\/\//, "https://x/").replace(/^barberbook:\//, "https://x/");
        const parsed = new URL(u);
        const path = parsed.pathname || "";
        const nav = navigationRef.current;
        if (!nav?.isReady?.()) return;
        if (path.startsWith("/booking/")) {
          const id = path.split("/booking/")[1]?.split("/")[0];
          if (id) nav.navigate("myappointments", { bookingId: id });
        } else if (path.startsWith("/order/")) {
          const id = path.split("/order/")[1]?.split("/")[0];
          if (id) nav.navigate("myorders", { orderId: id });
        } else if (path.startsWith("/shop/")) {
          const id = path.split("/shop/")[1]?.split("/")[0];
          if (id) nav.navigate("ShopPublicProfile", { shopId: id });
        }
      } catch (e) {}
    };
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });
    const sub = Linking.addEventListener("url", ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
      <ThemeProvider>
        <ToastProvider>
          <ApiHandlersSetup navigationRef={navigationRef} />
          <ThemeAwareStatusBar />
          <CartProvider>
            <AuthProvider>
            <EmailLinkHandler />
            <AuthGate>
              {(isAuth) => (
                <BarbershopProvider>
                  <ThemedNavigationContainer
                    navigationRef={navigationRef}
                    linking={{
                      prefixes: ["barberbook://"],
                      config: {
                        screens: {
                          myappointments: "booking/:bookingId",
                          myorders: "order/:orderId",
                          ShopPublicProfile: "shop/:shopId",
                        },
                      },
                    }}
                  >
                    <PushNotificationSetup isAuth={isAuth} navigationRef={navigationRef} />
              {isAuth ? (
                <EnrollmentAwareNavigator isAuth={isAuth} />
              ) : (
                <Stack.Navigator initialRouteName="welcome">
                  <Stack.Screen name="welcome" component={WelcomeScreen} options={{ headerShown: false }} />
                  <Stack.Screen name="email-sign-in" component={EmailSignInScreen} options={{ headerShown: false }} />
                  <Stack.Screen name="login" component={Login} options={{ headerShown: false }} />
                  <Stack.Screen name="register" component={Register} options={{ headerShown: false }} />
                  <Stack.Screen name="phone-login" component={PhoneLogin} options={{ headerShown: false }} />
                  <Stack.Screen name="join-barbershop" component={JoinBarbershopScreen} options={{ title: "Join Barbershop" }} />
                  <Stack.Screen name="home" component={Home} options={{ headerShown: false }} />
                  <Stack.Screen name="ExploreShops" component={ExploreShopsScreen} options={{ title: "Explore Shops" }} />
                  <Stack.Screen name="ShopPublicProfile" component={ShopPublicProfileScreen} options={{ title: "Shop" }} />
                  <Stack.Screen name="Reviews" component={ReviewsScreen} options={{ title: "Reviews" }} />
                  <Stack.Screen name="productDetails" component={ProductDetails} />
                  <Stack.Screen name="serviceDetails" component={ServiceDetails} />
                  <Stack.Screen name="checkout" component={Checkout} />
                  <Stack.Screen name="Confirmation" component={Confirmation} options={{ headerShown: false }} />
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
                  <Stack.Screen name="payment" component={Payments} options={{ headerShown: false }} />
                  <Stack.Screen name="account" component={Account} />
                  <Stack.Screen name="SetPreferences_Specialization" component={SetPreferences_Specialization} />
                  <Stack.Screen name="services" component={Services} />
                  <Stack.Screen name="ServiceList" component={ServiceList} />
                  <Stack.Screen name="BookService" component={BookService} />
                  <Stack.Screen name="bookings" component={Bookings} />
                  <Stack.Screen name="cart" component={Cart} />
                  <Stack.Screen name="haircut" component={About} />
                </Stack.Navigator>
              )}
                  </ThemedNavigationContainer>
                </BarbershopProvider>
              )}
            </AuthGate>
            </AuthProvider>
          </CartProvider>
        </ToastProvider>
      </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  gate: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
});
