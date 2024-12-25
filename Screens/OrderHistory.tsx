import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase'; // Import your supabase client
import { useNavigation } from "@react-navigation/native";

const PastOrdersScreen = () => {
  const navigation = useNavigation();
  
  const [ratings, setRatings] = useState({});
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

// Function to fetch orders and related data
const fetchOrders = async () => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) throw new Error('Error fetching session: ' + sessionError.message);

    if (!session) {
      console.log('User is not logged in, navigating to Auth screen.');
      navigation.navigate('Auth');
      return;
    }

    const userID = session.user.id;
    console.log('User ID:', userID);

    // Fetch orders for the logged-in user
    const { data: orderData, error: orderError } = await supabase
      .from('Order')
      .select('id, paymentID, order_date, order_status')
      .eq('userID', userID); // Filter by logged-in user

    if (orderError) throw new Error('Error fetching orders: ' + orderError.message);
    console.log('Orders fetched successfully', orderData);

    // Fetch payment amount for each order
    const ordersWithDetails = await Promise.all(
      orderData.map(async (order: any) => {
        // Get payment amount
        const { data: paymentData, error: paymentError } = await supabase
          .from('Payment')
          .select('payment_amount')
          .eq('id', order.paymentID)
          .single();

        if (paymentError) {
          console.error('Error fetching payment data:', paymentError);
          return null; // Skip this order if there's an error fetching payment data
        }

        // If payment amount is fetched, proceed with adding it to the order
        console.log('Payment amount for order:', paymentData);

        // Get order details like items and product details
        const { data: cartData, error: cartError } = await supabase
          .from('CartHistory')
          .select('cartID, productID, quantity, price')
          .eq('orderID', order.id);

        if (cartError) throw new Error('Error fetching cart items: ' + cartError.message);

        const products = await Promise.all(
          cartData.map(async (item: any) => {
            const { data: productData, error: productError } = await supabase
              .from('Product')
              .select('name')
              .eq('id', item.productID);

            if (productError) throw new Error('Error fetching product data: ' + productError.message);
            return {
              name: productData[0].name,
              quantity: item.quantity,
            };
          })
        );

        return { ...order, products, paymentAmount: paymentData.payment_amount }; // Include payment amount
      })
    );

    setOrders(ordersWithDetails);
  } catch (error) {
    console.error('Error fetching orders:', error);
  }
};

const handleReorder = async (orderId) => {
  try {
    // Step 1: Get the session and check if the user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) throw new Error('Error fetching session: ' + sessionError.message);


    if (!session || !session.user) {
      console.error('User is not authenticated');
      return;
    }

    // Step 2: Fetch the order's products
    const { data: cartData, error: cartError } = await supabase
      .from('CartHistory')
      .select('cartID, productID, quantity')
      .eq('orderID', orderId);

    if (cartError) {
      console.error('Error fetching cart items:', cartError);
      return;
    }

    if (!cartData || cartData.length === 0) {
      console.log('No products to reorder');
      return;
    }

    // Step 3: Get prices of the products
    const productsWithPrices = await Promise.all(
      cartData.map(async (item) => {
        const { data: productData, error: productError } = await supabase
          .from('Product')
          .select('id, price')
          .eq('id', item.productID)
          .single();

        if (productError) {
          console.error('Error fetching product data:', productError);
          return null;
        }

        return {
          productID: item.productID,
          quantity: item.quantity,
          price: productData.price,
        };
      })
    );

    // Filter out any null entries (in case of errors fetching prices)
    const validProducts = productsWithPrices.filter(Boolean);

    if (validProducts.length === 0) {
      console.log('No valid products to reorder');
      return;
    }

    // Step 4: Create a new cart for the user (if one doesn't exist)
    const { data: cartDataExisting, error: cartDataError } = await supabase
      .from('Cart')
      .select('id, total_amount')
      .eq('userID', session.user.id)
      .single();

    if (cartDataError && cartDataError.code !== 'PGRST301') {
      console.error('Error checking existing cart:', cartDataError);
      return;
    }

    let cartID = cartDataExisting ? cartDataExisting.id : null;
    let totalAmount = 0;

    // If no existing cart, create a new one
    if (!cartID) {
      const { data: newCartData, error: newCartError } = await supabase
        .from('Cart')
        .insert([{ userID: session.user.id, total_amount: 0 }])
        .single();

      if (newCartError) {
        console.error('Error creating new cart:', newCartError);
        return;
      }

      cartID = newCartData.id;
    }

    // Step 5: Insert items into CartItem and update the total amount
    const cartItemsInsert = validProducts.map((product) => ({
      cartID: cartID,
      productID: product.productID,
      quantity: product.quantity,
      price: product.price,
    }));

    const { data: cartItemData, error: cartItemError } = await supabase
      .from('CartItem')
      .upsert(cartItemsInsert, { onConflict: ['cartID', 'productID'] });

    if (cartItemError) {
      console.error('Error inserting cart items:', cartItemError);
      return;
    }

    // Step 6: Calculate the total amount for the cart
    totalAmount = validProducts.reduce((sum, product) => sum + product.price * product.quantity, 0);

    // Step 7: Update the total amount in the Cart table
    const { data: updatedCartData, error: updateCartError } = await supabase
      .from('Cart')
      .update({ total_amount: totalAmount })
      .eq('id', cartID);

    if (updateCartError) {
      console.error('Error updating total amount:', updateCartError);
      return;
    }

    console.log('Reorder successful. Cart updated with new items and total amount:', totalAmount);

    navigation.navigate('Cart');
  } catch (error) {
    console.error('Error during reorder process:', error);
  }
};



  const handleRating = (orderId: number, rating: any) => {
    setRatings({ ...ratings, [orderId]: rating });
    console.log(`Rating for Order #${orderId}: ${rating} stars`);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Past Orders Section */}
      <Text style={styles.sectionTitle}>Past orders</Text>
      {orders.map((order) => (
        <View key={order.id} style={styles.orderCard}>
          <View style={styles.orderDetails}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderID}>Order # {order.id}</Text>
              {/* Display payment amount */}
              <Text style={styles.price}>Rs.{order.paymentAmount ? order.paymentAmount : 'N/A'}</Text>
            </View>
            <Text style={styles.deliveryDate}>Delivered on {order.order_date}</Text>
            <Text style={styles.items}>
              {order.products.map((product: any) => `${product.name} (x${product.quantity})`).join(', ')}
            </Text>
            <TouchableOpacity style={styles.reorderButton} onPress={() => handleReorder(order.id)}>
              <Text style={styles.reorderText}>Select items to reorder</Text>
            </TouchableOpacity>

            <Text style={styles.rateText}>Tap to rate by {order.ratingDeadline}</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => handleRating(order.id, star)}>
                  <Ionicons
                    name={ratings[order.id] >= star ? "star" : "star-outline"}
                    size={24}
                    color={ratings[order.id] >= star ? "#FF9800" : "#CCC"}
                    style={styles.star}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    margin: 16,
  },
  orderCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  orderImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  orderDetails: {
    flex: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  orderID: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 200
  },
  price: {
    fontSize: 16,
    color: '#000',
  },
  deliveryDate: {
    fontSize: 12,
    color: '#555',
    marginBottom: 4,
  },
  items: {
    fontSize: 12,
    color: '#777',
    marginBottom: 8,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  reorderButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  reorderText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  rateText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#555',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  star: {
    marginRight: 4,
  },
});

export default PastOrdersScreen;
