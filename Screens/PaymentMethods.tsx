import React, { useState } from "react"; 
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { RadioButton } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "@/lib/supabase";

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
  const [isLoading, setIsLoading] = useState(false); 

  const paymentOptions = ["cash", "card"];

const handlePlaceOrder = async () => {
  if (!selectedMethod) {
    alert("Please select a payment method.");
    return;
  }

  const paymentData = {
    cartID: cartID, 
    payment_amount: total, 
    payment_method: selectedMethod, 
    payment_status: selectedMethod === "cash" ? "completed" : "pending", 
  };

  setIsLoading(true); 

  try {

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (!session || sessionError) {
      console.log("User is not logged in", sessionError);
      navigation.navigate("Auth"); 
      setIsLoading(false); 
      return;
    }

    const userID = session.user.id; 

    const { data: paymentDataResponse, error: paymentError } = await supabase
      .from("Payment")
      .insert([paymentData])
      .select("*") 
      .single();

    if (paymentError) {
      console.error("Payment insertion error:", paymentError);
      alert(`Payment failed: ${paymentError.message}`);
      setIsLoading(false); 
      return;
    }

    if (!paymentDataResponse) {
      console.error("Payment data is null:", paymentDataResponse);
      alert("Payment failed, no response data.");
      setIsLoading(false); 
      return;
    }

    console.log("Payment successful:", paymentDataResponse);

    const orderData = {
      paymentID: paymentDataResponse.id, 
      userID: userID, 
      order_status: "processing", 
    };

    const { data: orderDataResponse, error: orderError } = await supabase
      .from("Order")
      .insert([orderData])
      .single();

    if (orderError) {
      console.error("Order insertion error:", orderError.message);
      alert(`Order placement failed: ${orderError.message}`);
      setIsLoading(false); 
      return;
    }

    console.log("Order placed successfully:", orderDataResponse);

    const { data: cartItems, error: fetchCartItemsError } = await supabase
      .from("CartItem")
      .select("*")
      .eq("cartID", cartID);

    if (fetchCartItemsError) {
      console.error("Failed to fetch cart items:", fetchCartItemsError);
      setIsLoading(false); 
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
      setIsLoading(false); 
      return;
    }

    console.log("Cart items deleted successfully.");

    navigation.navigate("OrderPlaced");
  } catch (error) {
    console.error("Unexpected error:", error);
    alert("An unexpected error occurred. Please try again.");
  } finally {
    setIsLoading(false); 
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
          disabled={isLoading} 
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" /> 
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
