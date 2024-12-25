import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase'; 
import { useNavigation } from "@react-navigation/native";

const PastOrdersScreen = () => {
  const navigation = useNavigation();
  
  const [ratings, setRatings] = useState({});
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

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
      .eq('userID', userID); 

    if (orderError) throw new Error('Error fetching orders: ' + orderError.message);
    console.log('Orders fetched successfully', orderData);

    // Fetch payment amount for each order
    const ordersWithDetails = await Promise.all(
      orderData.map(async (order: any) => {

        const { data: paymentData, error: paymentError } = await supabase
          .from('Payment')
          .select('payment_amount')
          .eq('id', order.paymentID)
          .single();

        if (paymentError) {
          console.error('Error fetching payment data:', paymentError);
          return null; 
        }

        console.log('Payment amount for order:', paymentData);

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

        return { ...order, products, paymentAmount: paymentData.payment_amount }; 
      })
    );

    setOrders(ordersWithDetails);
  } catch (error) {
    console.error('Error fetching orders:', error);
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
