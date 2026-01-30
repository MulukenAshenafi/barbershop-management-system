import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Alert,
} from "react-native";
import api from "../services/api";
import { useToast } from "../components/common/Toast";
import { useTheme } from "../context/ThemeContext";
import Button from "../components/common/Button";
import { getApiErrorMessage } from "../services/api";
import { fontSizes, spacing, borderRadius } from "../theme";

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const Payments = ({ route, navigation }) => {
  const toast = useToast();
  const { colors } = useTheme();
  const {
    customerName,
    barberName,
    bookingData,
    serviceName,
    totalAmount,
    paymentStatus,
    bookingId,
  } = route.params ?? {};

  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutOpened, setCheckoutOpened] = useState(false);
  const amount = totalAmount != null ? String(totalAmount) : "0";
  const idempotencyKeyRef = useRef(null);

  const bid = bookingData?._id ?? bookingId;
  const hasRequiredParams = bid && totalAmount != null;

  const handlePayment = async () => {
    if (!hasRequiredParams) {
      toast.show("Booking info missing. Please start from Book Service.", { type: "error" });
      return;
    }
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = uuidv4();
    }
    const idempotencyKey = idempotencyKeyRef.current;

    setIsProcessing(true);
    try {
      const response = await api.post(
        "payments/booking",
        { totalAmount: parseFloat(amount), bookingId: bid },
        { headers: { "Idempotency-Key": idempotencyKey } }
      );

      if (response.data.success && response.data.checkout_url) {
        setCheckoutOpened(true);
        const opened = await Linking.canOpenURL(response.data.checkout_url);
        if (opened) {
          await Linking.openURL(response.data.checkout_url);
        } else {
          Alert.alert(
            "Payment link",
            "Complete payment at: " + response.data.checkout_url
          );
        }
      } else {
        Alert.alert("Error", response.data.message || "Payment init failed");
      }
    } catch (error) {
      const msg = getApiErrorMessage(error, "Something went wrong. Please try again.");
      Alert.alert("Error", msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const goToConfirmation = () => {
    navigation.navigate("Confirmation", {
      customerName,
      barberName,
      bookingData,
      serviceName,
      totalAmount,
      paymentStatus: "Online Paid",
    });
  };

  if (!hasRequiredParams) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>Booking info missing</Text>
        <Text style={[styles.amount, { color: colors.textSecondary }]}>
          Please start from Book Service to pay for a booking.
        </Text>
        <Button title="Go back" onPress={() => navigation.goBack()} variant="primary" fullWidth />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Pay for your booking</Text>
      <Text style={[styles.amount, { color: colors.textSecondary }]}>Amount: {amount} ETB</Text>

      {!checkoutOpened ? (
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary }, isProcessing && styles.btnDisabled]}
          onPress={handlePayment}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Pay with Chapa</Text>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.doneSection}>
          <Text style={[styles.doneText, { color: colors.textSecondary }]}>
            Complete payment in the browser, then return here.
          </Text>
          <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={goToConfirmation}>
            <Text style={styles.btnText}>I've completed payment</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default Payments;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  amount: {
    fontSize: fontSizes.lg,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  btn: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.7 },
  btnText: {
    color: "#fff",
    fontSize: fontSizes.base,
    fontWeight: "600",
  },
  doneSection: { marginTop: spacing.md },
  doneText: {
    textAlign: "center",
    marginBottom: spacing.md,
  },
});
