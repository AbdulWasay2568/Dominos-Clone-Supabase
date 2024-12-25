import React, { useState } from "react"; 
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { RadioButton } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "@/lib/supabase"; // Assuming you have a supabase.js file in /lib folder


import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  CardInfo: undefined;
  PaymentMethods: undefined;
  OrderPlaced:undefined;
};

type PaymentMethodsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PaymentMethods'
>;

interface PaymentMethodsProps {
  navigation: PaymentMethodsScreenNavigationProp;
}

const PaymentMethods: React.FC<PaymentMethodsProps> = ({ route }) => {

  const { cartItems, total, cartID } = route.params || {};

  const navigation = useNavigation();

  const [selectedMethod, setSelectedMethod] = useState("");
  const [isLoading, setIsLoading] = useState(false); // State to track loading status

  const paymentOptions = ["cash", "card"];

const handlePlaceOrder = async () => {
  if (!selectedMethod) {
    alert("Please select a payment method.");
    return;
  }

  // Prepare payment data
  const paymentData = {
    cartID: cartID, // Cart ID from passed params
    payment_amount: total, // Total price from the params
    payment_method: selectedMethod, // Selected payment method (Cash or Card)
    payment_status: selectedMethod === "cash" ? "completed" : "pending", // Determine payment status
  };

  setIsLoading(true); // Show loading indicator

  try {
    // Get the user ID from the current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (!session || sessionError) {
      console.log("User is not logged in", sessionError);
      navigation.navigate("Auth"); // Navigate to Auth screen if not logged in
      setIsLoading(false); // Hide loading indicator
      return;
    }

    const userID = session.user.id; // Extract user ID from session

    // Insert payment data into the "Payment" table
    const { data: paymentDataResponse, error: paymentError } = await supabase
      .from("Payment")
      .insert([paymentData])
      .select("*") // Ensure you get the inserted data back
      .single();

    // Check for errors from the insert operation
    if (paymentError) {
      console.error("Payment insertion error:", paymentError);
      alert(`Payment failed: ${paymentError.message}`);
      setIsLoading(false); // Hide loading indicator
      return;
    }

    // Check if the response is null or empty
    if (!paymentDataResponse) {
      console.error("Payment data is null:", paymentDataResponse);
      alert("Payment failed, no response data.");
      setIsLoading(false); // Hide loading indicator
      return;
    }

    console.log("Payment successful:", paymentDataResponse);

    // After payment insertion, insert data into the "Order" table
    const orderData = {
      paymentID: paymentDataResponse.id, // Use the payment ID returned from the Payment table
      userID: userID, // Add the userID from the session
      order_status: "processing", // Set the initial order status as "processing"
    };

    const { data: orderDataResponse, error: orderError } = await supabase
      .from("Order")
      .insert([orderData])
      .single();

    if (orderError) {
      console.error("Order insertion error:", orderError.message);
      alert(`Order placement failed: ${orderError.message}`);
      setIsLoading(false); // Hide loading indicator
      return;
    }

    console.log("Order placed successfully:", orderDataResponse);

    // Fetch cart items
    const { data: cartItems, error: fetchCartItemsError } = await supabase
      .from("CartItem")
      .select("*")
      .eq("cartID", cartID);

    if (fetchCartItemsError) {
      console.error("Failed to fetch cart items:", fetchCartItemsError);
      setIsLoading(false); // Hide loading indicator
      return;
    }

    const cartHistoryData = cartItems.map((item) => ({
      cartID: item.cartID,
      productID: item.productID,
      quantity: item.quantity,
      price: item.price,
    }));

    console.log("Cart History Data:", cartHistoryData);

    const { error: cartHistoryInsertError } = await supabase
      .from("CartHistory")
      .insert(cartHistoryData);

    if (cartHistoryInsertError) {
      console.error("Failed to insert into CartHistory:", cartHistoryInsertError);
      setIsLoading(false); 
      return;
    }

    const { error: cartItemDeleteError } = await supabase
      .from("CartItem")
      .delete()
      .eq("cartID", cartID);

    if (cartItemDeleteError) {
      console.error("Cart item deletion error:", cartItemDeleteError.message);
      alert(`Failed to remove items from cart: ${cartItemDeleteError.message}`);
      setIsLoading(false); // Hide loading indicator
      return;
    }

    console.log("Cart items deleted successfully.");

    // Navigate to the order confirmation screen
    navigation.navigate("OrderPlaced");
  } catch (error) {
    console.error("Unexpected error:", error);
    alert("An unexpected error occurred. Please try again.");
  } finally {
    setIsLoading(false); // Hide loading indicator after operation completes
  }
};
      
  const handleCardSelection = () => {
    setSelectedMethod("Credit/Debit Card");
    navigation.navigate("CardInfo", { total });
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.subHeader}>Payment Method</Text>

        {/* Cash Payment Option */}
        <TouchableOpacity
          style={styles.radioOption}
          onPress={() => setSelectedMethod("cash")}
        >
          <RadioButton
            value="cash"
            status={selectedMethod === "cash" ? "checked" : "unchecked"}
            onPress={() => setSelectedMethod("cash")}
            color="#007BFF"
          />
          <Text style={styles.radioText}>Cash</Text>
        </TouchableOpacity>

        {/* Credit/Debit Card Payment Option */}
        <TouchableOpacity
          style={styles.radioOption}
          onPress={handleCardSelection}
        >
          <RadioButton
            value="Credit/Debit Card"
            status={selectedMethod === "Credit/Debit Card" ? "checked" : "unchecked"}
            onPress={handleCardSelection}
            color="#007BFF"
          />
          <Text style={styles.radioText}>Credit/Debit Card</Text>
        </TouchableOpacity>

        <Text style={styles.price}>Rs. {total.toString()}</Text>

        {/* Place Order Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handlePlaceOrder}
          disabled={isLoading} // Disable button while loading
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" /> // Loading indicator
          ) : (
            <Text style={styles.buttonText}>Place Order</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  subHeader: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
    color: "#333",
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  radioText: {
    fontSize: 16,
    color: "#333",
  },
  price: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#D32F2F",
    marginVertical: 20,
  },
  button: {
    backgroundColor: "#007BFF",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default PaymentMethods;
