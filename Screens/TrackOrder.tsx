import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TrackOrderScreen = () => {
  return (
    <ScrollView style={styles.container}>

      {/* Feedback Section */}
      <View style={styles.section}>
        <Text style={styles.subHeader}>How was your experience?</Text>
        <View style={styles.feedbackContainer}>
          <Text style={styles.emoji}>😡</Text>
          <Text style={styles.emoji}>😐</Text>
          <Text style={styles.emoji}>😊</Text>
          <Text style={styles.emoji}>😍</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Share your feedback to help us improve"
          multiline
        />
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Submit Review</Text>
        </TouchableOpacity>
      </View>

      {/* Real-Time Order Tracking */}
      <View style={styles.section}>
        <Text style={styles.subHeader}>Track Your Order's Real-Time State</Text>
        <TextInput style={styles.input} placeholder="Phone Number" keyboardType="phone-pad" />
        <TextInput style={styles.input} placeholder="Order ID" />
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Track</Text>
        </TouchableOpacity>
      </View>

            {/* Order Tracking Section */}
      <View style={styles.section}>
        <Text style={styles.subHeader}>Order Placed</Text>
        <Text style={styles.infoText}>
          We have received your order, please note that you will receive a confirmation SMS shortly.
        </Text>
        <Text style={styles.orderId}>Your Order ID is <Text style={styles.bold}>3396763</Text></Text>
        <Text style={styles.trackerText}>
          WE'RE FIRING IT UP - EME DHA began custom-making your order at 2024-12-08 00:40:18.000
        </Text>

        {/* Pizza Tracker */}
        <View style={styles.trackerContainer}>
          <View style={styles.trackerStepActive}><Text style={styles.trackerNumber}>1</Text></View>
          <View style={styles.trackerStep}><Text style={styles.trackerNumber}>2</Text></View>
          <View style={styles.trackerStep}><Text style={styles.trackerNumber}>3</Text></View>
          <View style={styles.trackerStep}><Text style={styles.trackerNumber}>4</Text></View>
          <View style={styles.trackerStep}><Text style={styles.trackerNumber}>5</Text></View>
        </View>
        <View style={styles.trackerLabels}>
          <Text style={styles.trackerLabel}>Order Placed</Text>
          <Text style={styles.trackerLabel}>Prep</Text>
          <Text style={styles.trackerLabel}>Bake</Text>
          <Text style={styles.trackerLabel}>Quality Check</Text>
          <Text style={styles.trackerLabel}>Out for Delivery</Text>
        </View>

        {/* Order Details */}
        <View style={styles.orderDetails}>
          <View style={styles.detailText}>
            <Text>Order ID: <Text style={styles.bold}>3396763</Text></Text>
          </View>

          <View style={styles.detailText}>
            <Text>Store Name: EME DHA</Text>
          </View>

          <View style={styles.detailText}>
            <Text>1X Chicken Wings</Text>
          </View>
          
          <View style={styles.detailText}>
            <Text>Total: Rs. 750</Text>
          </View>
          <View style={styles.detailText}>
            <Text>Delivery Fee: Rs. 129</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text>Grand Total:</Text>
            <Text>Rs. 879</Text>
          </View>
        </View>
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ccc',
    padding: 16,
  },
  section: {
    backgroundColor: "#fff",
    padding:10,
    borderRadius: 10,

    marginBottom: 24,
  },
  subHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 14,
    marginBottom: 8,
  },
  trackerText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 16,
  },
  trackerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  trackerStep: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackerStepActive: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackerNumber: {
    color: '#fff',
    fontWeight: 'bold',
  },
  trackerLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trackerLabel: {
    fontSize: 12,
    color: '#555',
  },
  orderDetails: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 8,
  },
  detailText: {
    fontSize: 14,
    marginBottom: 4,
  },
  grandTotal: {
    backgroundColor: 'red',
    color:'#fff',
    flexDirection:'row',

    alignItems:'center',
    justifyContent:'space-between',
    width:280,

    height:50,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  feedbackContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  emoji: {
    fontSize: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  bold: {
    fontWeight: 'bold',
  },
});

export default TrackOrderScreen;
