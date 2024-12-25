import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "@/lib/supabase";
import loader from '@/components/Loader'
import Loader from "@/components/Loader";

const Cart = () => {
  const [cartItems, setCartItems] = useState<{ id: number; name: string; image: string; price: number; quantity: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartID, setCartID] = useState(null); // State to hold cartID

  

  const navigation = useNavigation();

  const deliveryCharges = 100;

  // Function to fetch cart data
  const fetchCartData = async () => {
    try {
      setLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
      if (!session || sessionError) {
        console.log("User is not logged in");
        navigation.navigate("Auth");
        return;
      }
  
      const userID = session.user.id;
  
      const { data, error } = await supabase
        .from("Cart")
        .select(`id, total_amount, CartItem (
          productID,
          quantity,
          price,
          Product(name, image_url)
        )`)
        .eq("userID", userID);
  
      if (error) throw error;
  
      const formattedCartItems = data[0]?.CartItem.map((cartItem) => ({
        id: cartItem.productID,
        name: cartItem.Product.name,  // Extract product name
        image: cartItem.Product.image_url,  // Extract product image
        price: cartItem.price,
        quantity: cartItem.quantity,
      })) || [];
  
      setCartItems(formattedCartItems);
      setCartID(data[0]?.id); // Set cartID dynamically
    } 
    catch (error) {
      if (error instanceof Error) {
        console.error("Error fetching cart data:", error.message);
      } else {
        console.error('An unexpected error occurred:', error);
      }
    } 
    finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCartData();
  }, []);

  const handleUpdateQuantity = async (id:number, newQuantity:number) => {
    if (newQuantity <= 0 || !cartID) return;

    try {
      // Fetch the product price
      const { data: productData, error: productError } = await supabase
        .from("Product")
        .select("price")
        .eq("id", id)
        .single();

      if (productError) throw productError;

      const productPrice = productData.price;

      // Update the cart items in state
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        )
      );

      console.log("Updated Quantity:", newQuantity);
      console.log("cartID:", cartID); // Check the dynamic cartID
      console.log("productID:", id);  // Check the productID

      // Fetch existing cart item(s) to make sure it exists before updating
      const { data: existingCartItems, error: fetchError } = await supabase
        .from("CartItem")
        .select("*")
        .eq("productID", id)
        .eq("cartID", cartID);  // Use dynamic cartID

      if (fetchError) {
        console.error("Error fetching cart item(s):", fetchError.message);
        return;
      }

      console.log("Existing Cart Items:", existingCartItems);

      // Handle multiple or no rows found
      if (existingCartItems.length === 0) {
        console.error("No cart items found for this product in the cart.");
        return;
      }

      // Update the quantity in CartItem table
      const { data, error: updateError } = await supabase
        .from("CartItem")
        .update({ quantity: newQuantity })
        .eq("productID", id)
        .eq("cartID", cartID);  // Use dynamic cartID

      if (updateError) {
        console.error("Error updating cart item:", updateError.message);
      } else {
        console.log("Updated cart item:", data);
      }

      // Fetch updated cart items data
      const { data: cartItemsData, error: cartItemsError } = await supabase
        .from("CartItem")
        .select("price, quantity")
        .eq("cartID", cartID);  // Use dynamic cartID

      if (cartItemsError) {
        console.error("Error fetching cart items data:", cartItemsError.message);
        return;
      }

      // Calculate total amount
      const totalAmount = cartItemsData.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );

      // Update the total amount in the Cart table
      const { error: updateTotalError } = await supabase
        .from("Cart")
        .update({ total_amount: totalAmount })
        .eq("id", cartID);  // Use dynamic cartID

      if (updateTotalError) {
        console.error("Error updating total amount:", updateTotalError.message);
      }

      // Fetch updated cart data
      fetchCartData();
    }
    catch (error) {
        if (error instanceof Error) {
          console.error("Error updating quantity:", error.message);
        } else {
          console.error('An unexpected error occurred:', error);
        }
    }
  };

  // Handle item removal from cart
  const handleRemoveItem = async (id:number) => {
    try {
      // Get the current user's session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (!session || sessionError) {
        console.log("User is not logged in");
        navigation.navigate("Auth");
        return;
      }
  
      const userID = session.user.id;
  
      // Fetch the user's cartID (assuming a single cart per user)
      const { data: cartData, error: cartError } = await supabase
        .from("Cart")
        .select("id")
        .eq("userID", userID)
        .single();
  
      if (cartError) {
        console.error("Error fetching cart:", cartError.message);
        return;
      }
  
      const cartID = cartData.id; // Use the cartID of the logged-in user
  
      // Delete the item from the CartItem table using the correct cartID and productID
      const { error: deleteError } = await supabase
        .from("CartItem")
        .delete()
        .eq("productID", id)  // Product ID to identify the item
        .eq("cartID", cartID);  // Use the cartID of the logged-in user
  
      if (deleteError) {
        throw deleteError;  // If there's an error deleting, throw it
      }
  
      // Fetch the updated cart items
      const { data: updatedCartItemsData, error: fetchError } = await supabase
        .from("CartItem")
        .select("price, quantity")
        .eq("cartID", cartID);  // Filter by the cartID
  
      if (fetchError) {
        throw fetchError;  // If there's an error fetching the updated cart items, throw it
      }
  
      // Check if there are still items in the cart after deletion
      if (!updatedCartItemsData || updatedCartItemsData.length === 0) {
        console.log("No cart items left.");
        // Optionally handle the case when the cart is empty
        await supabase
          .from("Cart")
          .update({ total_amount: 0 })  // Set total_amount to 0 if the cart is empty
          .eq("id", cartID);  // Cart ID for the correct cart to update
      } else {
        // Calculate the new total amount
        const totalAmount = updatedCartItemsData.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
  
        // Update the total amount in the Cart table
        const { error: updateTotalError } = await supabase
          .from("Cart")
          .update({ total_amount: totalAmount })
          .eq("id", cartID);  // Cart ID for the correct cart to update
  
        if (updateTotalError) {
          throw updateTotalError;  // If there's an error updating the total amount, throw it
        }
      }
  
      // Fetch the updated cart data (this will re-fetch the items)
      fetchCartData(); // This function should be defined to fetch the latest cart data
  
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error removing item:", error.message);
      } else {
        console.error('An unexpected error occurred:', error);
      }
    } 
  };
  
  

  const calculateTotal = () => cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const calculateDiscount = () => calculateTotal() * 0.1;
  const calculateGrandTotal = () => calculateTotal() + deliveryCharges - calculateDiscount();

  const confirmOrderBtn = async () => {
    try {
      if (!cartID || cartItems.length === 0) {
        console.error("No cart items found to proceed with order.");
        return;
      }

      const { data: cart } = await supabase
        .from("Cart")
        .select("id, total_amount")
        .eq("id", cartID)
        // .single();

        console.log('this is order : ',cart)

      if (!cart) {
        console.error("No cart found.");
        return;
      }

      
      console.log("Order confirmed successfully!");
      navigation.navigate("PaymentMethods", {
        cartItems,
        cartID,
        total: calculateGrandTotal(),
      });
    } catch (err) {
      setLoading(false);
  };
}

if (loading) {
  return (
    <>
      <Loader />
    </>
  );
}


  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.orderDetails}>
        <Text style={styles.sectionTitle}>Order Details</Text>
        {cartItems.map((item) => (
          <View key={item.id} style={styles.itemContainer}>
            <View style={styles.itemDetailsContainer} >
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.selectedItem}>Rs. {item.price} X {item.quantity}</Text>
            </View>
            <View style={styles.quantityContainer}>
              <TouchableOpacity onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)}>
                <Ionicons name="remove-circle" size={24} color="#f00" />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{item.quantity}</Text>
              <TouchableOpacity onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)}>
                <Ionicons name="add-circle" size={24} color="#00f" />
              </TouchableOpacity>
              <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveItem(item.id)}
            >
              <Ionicons name="trash" size={24} color="#f00" />
            </TouchableOpacity>

            </View>
          </View>
        ))}
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>Total</Text>
          <Text style={styles.summaryText}>Rs. {calculateTotal()}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>Your Discount (10%)</Text>
          <Text style={styles.summaryText}>- Rs. {calculateDiscount()}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>Delivery Charges</Text>
          <Text style={styles.summaryText}>Rs. {deliveryCharges}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryTitle}>Grand Total</Text>
          <Text style={styles.summaryTitle}>Rs. {calculateGrandTotal()}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.confirmButton} onPress={confirmOrderBtn}>
        <Text style={styles.confirmButtonText}>Confirm Order</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  orderDetails: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  itemName: {
    fontSize: 16,
  },
  selectedItem: {
    color: 'grey',
  },

  itemDetailsContainer:{

    flexDirection:'column',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:'flex-end'
  },
  quantityText: {
    marginHorizontal: 10,
  },
  removeButton: {
    padding: 10,
  },
  summaryContainer: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  summaryText: {
    fontSize: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: "#007BFF",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default Cart;
