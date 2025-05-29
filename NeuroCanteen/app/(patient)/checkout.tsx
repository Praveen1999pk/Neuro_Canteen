import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import axiosInstance from '../api/axiosInstance';
import RazorpayCheckout from 'react-native-razorpay';
import { useEffect } from 'react';

type MenuItem = {
  id: number;
  name: string;
  patientPrice: number;
};

type CartItems = {
  [key: number]: number;
};

export default function patientOrderCheckout() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [tip, setTip] = useState(0);
  const MAX_TIP = 500;
  const [address, setAddress] = useState('');
  const [submittedAddress, setSubmittedAddress] = useState('');
  const [isEditing, setIsEditing] = useState(true);
  const [uhid, setUhid] = useState('');
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [username, setUsername] = useState('');
  useEffect(() => {
  const fetchUsername = async () => {
    const token = await AsyncStorage.getItem("jwtToken");
    if (token) {
      try {
        const { sub } = JSON.parse(atob(token.split('.')[1]));
        console.log("Decoded user:", sub);
        setUsername(sub);
      } catch (error) {
        console.error("Error decoding JWT token:", error);
      }
    }
  };
  fetchUsername();
}, []);


  const cartItems: CartItems = params.cartItems ? JSON.parse(params.cartItems as string) : {};
  const menuItems: MenuItem[] = params.menuItems ? JSON.parse(params.menuItems as string) : [];

  const calculateItemTotal = (item: MenuItem, quantity: number) => {
    return item.patientPrice * quantity;
  };

  const calculateOrderTotal = () => {
    let total = 0;
    for (const itemId in cartItems) {
      const item = menuItems.find(menuItem => menuItem.id === parseInt(itemId));
      if (item) {
        total += calculateItemTotal(item, cartItems[itemId]);
      }
    }
    return total;
  };
  
  const orderTotal = calculateOrderTotal();
  const deliveryFee = 0;
  const platformFee = 0;
  const gstAndCharges = 0;
  const grandTotal = orderTotal + deliveryFee + platformFee + gstAndCharges + tip;

  const handleAddressSubmit = () => {
    if (!address.trim()) {
      Alert.alert("Error", "Please enter a delivery address");
      return;
    }
    setSubmittedAddress(address);
    setIsEditing(false);
  };

  const handleAddressEdit = () => {
    setIsEditing(true);
  };

  const handleUPI = async () => {
      const token = await AsyncStorage.getItem("jwtToken");
      if (token) {
        try {
          const userpayload = JSON.parse(atob(token.split('.')[1]));
          setUsername(userpayload.sub);
          console.log("user", username);
          setUsername(username);
        } catch (error) {
          console.error('Error decoding token:', error);
        }
      }


    try {
      const payment_metadata = await axiosInstance.post("/payment/createOrder", { price: grandTotal });
      const { orderId, amount } = payment_metadata.data;

      const options = {
        key: "rzp_test_0oZHIWIDL59TxD",
        amount: amount * 100,
        currency: "INR",
        name: "Your Company Name",
        description: "Payment for Order",
        order_id: orderId,
        prefill: {
          name: username,
          email: "user@example.com",
          contact: "1234567890",
        },
        notes: {
          address: submittedAddress,
        },
      };

      RazorpayCheckout.open(options)
        .then(async (response) => {
          await verifyPayment(response);
        })
        .catch((error) => {
          if (error.code !== 'USER_CLOSED') {
            Alert.alert("Payment Failed", "Please try again or choose a different payment method.");
          }
        });
    } catch (error) {
      console.error("Payment error:", error);
      Alert.alert("Error", "There was an issue processing your payment.");
    }
  };

  const verifyPayment = async (response: any) => {
    const paymentData = {
      orderId: response.razorpay_order_id,
      paymentId: response.razorpay_payment_id,
      paymentStatus: response.razorpay_payment_status || "captured",
      paymentMethod: response.method || "upi",
      amount: orderTotal,
      createdAt: new Date().toISOString(),
    };
    const token = await AsyncStorage.getItem("jwtToken");
    if (token) {
      try {
        const usernamepayload = JSON.parse(atob(token.split('.')[1]));
        setUsername(usernamepayload.sub);

        console.log("user", username);
        setUsername(username);
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }

    const orderDetails = {
      orderedRole: "patient",
      orderedName: username,
      orderedUserId: username,
      itemName: Object.keys(cartItems).map(itemId => {
        const item = menuItems.find(menuItem => menuItem.id === parseInt(itemId));
        return item ? item.name : '';
      }).join(", "),
      quantity: Object.values(cartItems).reduce((acc, qty) => acc + qty, 0),
      category: "South",
      price: orderTotal,
      orderStatus: null,
      paymentType: "UPI",
      paymentStatus: null,
      orderDateTime: new Date().toISOString(),
      address: submittedAddress,
    };

    try {
      const result = await axiosInstance.post("/payment/verifyPayment", paymentData);
      if (result.status === 200) {
        await axiosInstance.post("/orders", orderDetails);
        await AsyncStorage.removeItem('patient_cart');
        router.push('/(patient)/order-success');
      } else {
        Alert.alert("Error", "Payment verification failed!");
      }
    } catch (error) {
      console.error("Verification error:", error);
      Alert.alert("Error", "There was an issue verifying your payment.");
    }
  };

  const handleCOD = async () => {
    const token = await AsyncStorage.getItem("jwtToken");
    if (token) {
      try {
        const userpayload = JSON.parse(atob(token.split('.')[1]));
        setUsername(userpayload.sub);
        console.log("user", username);
        setUsername(username);
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }


    const orderDetails = {
      orderedRole: "patient",
      orderedName: username,
      orderedUserId: username,
      itemName: Object.keys(cartItems).map(itemId => {
        const item = menuItems.find(menuItem => menuItem.id === parseInt(itemId));
        return item ? item.name : '';
      }).join(", "),
      quantity: Object.values(cartItems).reduce((acc, qty) => acc + qty, 0),
      category: "South",
      price: orderTotal,
      orderStatus: null,
      paymentType: "COD",
      paymentStatus: null,
      orderDateTime: new Date().toISOString(),
      address: submittedAddress,
    };

    try {
      await axiosInstance.post("/orders", orderDetails);
      await AsyncStorage.removeItem('patient_cart');
      router.push('/(patient)/order-success');
    } catch (error) {
      console.error("Order error:", error);
      Alert.alert("Error", "There was an issue submitting your order.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.divider} />
          
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderText}>Item</Text>
            <Text style={styles.tableHeaderText}>Qty</Text>
            <Text style={styles.tableHeaderText}>Price</Text>
          </View>
          
          {Object.keys(cartItems).map(itemId => {
            const item = menuItems.find(menuItem => menuItem.id === parseInt(itemId));
            if (!item) return null;
            
            return (
              <View key={itemId} style={styles.tableRow}>
                <Text style={styles.tableCell}>{item.name}</Text>
                <Text style={styles.tableCell}>{cartItems[parseInt(itemId)]}</Text>
                <Text style={styles.tableCell}>₹{calculateItemTotal(item, cartItems[parseInt(itemId)])}</Text>
              </View>
            );
          })}
        </View>

        {/* Delivery Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>
          <View style={styles.divider} />
          
          {submittedAddress && !isEditing ? (
            <View style={styles.addressContainer}>
              <Text style={styles.addressText}>{submittedAddress}</Text>
              <TouchableOpacity onPress={handleAddressEdit}>
                <Text style={styles.editButton}>Edit Address</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.addressInputContainer}>
              <TextInput
                style={styles.addressInput}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter delivery address"
                multiline
                numberOfLines={4}
              />
              <TouchableOpacity style={styles.submitButton} onPress={handleAddressSubmit}>
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Order Total */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Total:</Text>
          <View style={styles.divider} />
          
          <View style={styles.summaryRow}>
            <Text>Item Total</Text>
            <Text>₹{orderTotal}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text>Delivery Fee</Text>
            <Text>₹{deliveryFee}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text>Delivery Tip</Text>
            <View style={styles.tipContainer}>
              <TextInput
                style={styles.tipInput}
                value={tip.toString()}
                onChangeText={(text) => {
                  const newTip = Math.max(0, Math.min(MAX_TIP, parseFloat(text) || 0));
                  setTip(newTip);
                }}
                keyboardType="numeric"
                placeholder="0"
              />
              <Text style={styles.tipNote}>Max: ₹{MAX_TIP}</Text>
            </View>
          </View>
          
          <View style={styles.summaryRow}>
            <Text>Platform Fee</Text>
            <Text>₹{platformFee}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text>GST and Charges</Text>
            <Text>₹{gstAndCharges}</Text>
          </View>
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>TO PAY</Text>
            <Text style={styles.totalValue}>₹{grandTotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment Options */}
        <View style={styles.paymentOptions}>
          <TouchableOpacity style={styles.codButton} onPress={handleCOD}>
            <Text style={styles.paymentButtonText}>Cash On Delivery</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.upiButton} onPress={handleUPI}>
            <Text style={styles.paymentButtonText}>UPI</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tableHeaderText: {
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
  },
  addressContainer: {
    marginBottom: 16,
  },
  addressText: {
    marginBottom: 8,
  },
  editButton: {
    color: 'blue',
    textAlign: 'right',
  },
  addressInputContainer: {
    marginBottom: 16,
  },
  addressInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    minHeight: 100,
    marginBottom: 8,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#4A8F47',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalRow: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 8,
  },
  totalLabel: {
    fontWeight: 'bold',
  },
  totalValue: {
    fontWeight: 'bold',
  },
  tipInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 4,
    width: 60,
    textAlign: 'center',
  },
  paymentOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  codButton: {
    backgroundColor: '#4A8F47',
    padding: 15,
    borderRadius: 4,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  upiButton: {
    backgroundColor: '#4A8F47',
    padding: 15,
    borderRadius: 4,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  paymentButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  inputLabel: {
    marginBottom: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
  },
  modalButton: {
    backgroundColor: '#4A8F47',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  tipContainer: {
  flexDirection: 'row',
  alignItems: 'center',
},
tipNote: {
  fontSize: 12,
  color: '#666',
  marginLeft: 8,
},
});