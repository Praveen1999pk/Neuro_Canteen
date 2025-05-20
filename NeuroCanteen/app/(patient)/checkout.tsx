import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CreditCard, Cast as CashIcon } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import axiosInstance from '../api/axiosInstance';
import RazorpayCheckout from 'react-native-razorpay';

type MenuItem = {
  id: number;
  name: string;
  description: string;
  patientPrice: number;
  category: string;
};

type CartItems = {
  [key: string]: number;
};

export default function Checkout() {
  const params = useLocalSearchParams();
  const router = useRouter();
  
  const [address, setAddress] = useState('');
  const [submittedAddress, setSubmittedAddress] = useState('');
  const [isEditing, setIsEditing] = useState(true);
  const [tip, setTip] = useState(0);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [razorpayUrl, setRazorpayUrl] = useState('');
  
  const cartItems: CartItems = params.cartItems 
    ? JSON.parse(params.cartItems as string) 
    : {};
    
  const menuItems: MenuItem[] = params.menuItems 
    ? JSON.parse(params.menuItems as string) 
    : [];

  useEffect(() => {
    getUsernameFromToken();
  }, []);

  const getUsernameFromToken = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (token) {
        const decoded: any = jwtDecode(token);
        setUsername(decoded.sub || '');
      } 
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  };

  const handleAddressSubmit = () => {
    if (!address.trim()) {
      Alert.alert('Address Required', 'Please enter a delivery address');
      return;
    }
    setSubmittedAddress(address);
    setIsEditing(false);
  };

  const handleAddressEdit = () => {
    setIsEditing(true);
  };

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

  const handleCOD = async () => {
    if (!submittedAddress) {
      Alert.alert('Address Required', 'Please submit a delivery address');
      return;
    }

    setLoading(true);
    
    const orderDetails = {
      orderedRole: "patient",
      orderedName: username,
      orderedUserId: username,
      itemName: Object.keys(cartItems).map(itemId => {
        const item = menuItems.find(menuItem => menuItem.id === parseInt(itemId));
        return item ? item.name : '';
      }).filter(Boolean).join(", "),
      quantity: Object.values(cartItems).reduce((acc, qty) => acc + qty, 0),
      category: "South",
      price: orderTotal,
      orderStatus: null,
      paymentType: "COD",
      paymentStatus: "PENDING",
      orderDateTime: new Date().toISOString(),
      address: submittedAddress,
    };

    try {
      const response = await axiosInstance.post("/orders", orderDetails);
      console.log("Order submitted successfully", response.data);
      
      await AsyncStorage.removeItem('patient_cart');
      router.push('/(patient)/order-success');
    } catch (error) {
      console.error("Order submission failed", error);
      Alert.alert("Error", "There was an issue submitting your order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUPI = async () => {
    if (!submittedAddress) {
      Alert.alert('Address Required', 'Please submit a delivery address');
      return;
    }
  
    setLoading(true);
  
    try {
      // Step 1: Create Razorpay order
      const payment_metadata = await axiosInstance.post("/payment/createOrder", { price: grandTotal });
      const { orderId, amount } = payment_metadata.data;
  
      const options = {
        description: 'Payment for Order',
        image: 'https://your-logo-url.com/logo.png', // optional
        currency: 'INR',
        key: 'rzp_test_0oZHIWIDL59TxD',
        amount: amount * 100,
        name: 'Crimpson Owl Tech',
        order_id: orderId,
        prefill: {
          email: 'user@example.com',
          contact: '9876543210',
          name: username,
        },
        theme: { color: '#4A8F47' },
      };
  
      // Step 2: Open Razorpay UI
      RazorpayCheckout.open(options)
        .then(async (data: any) => {
          console.log('Payment successful:', data);
  
          // Step 3: Submit order only after payment success
          const orderDetails = {
            orderedRole: "patient",
            orderedName: username,
            orderedUserId: username,
            itemName: Object.keys(cartItems).map(itemId => {
              const item = menuItems.find(menuItem => menuItem.id === parseInt(itemId));
              return item ? item.name : '';
            }).filter(Boolean).join(", "),
            quantity: Object.values(cartItems).reduce((acc, qty) => acc + qty, 0),
            category: "South",
            price: orderTotal,
            orderStatus: null,
            paymentType: "UPI",
            paymentStatus: "SUCCESS",
            orderDateTime: new Date().toISOString(),
            address: submittedAddress,
          };
  
          await axiosInstance.post("/orders", orderDetails);
          await AsyncStorage.removeItem('patient_cart');
          router.push('/(patient)/order-success');
        })
        .catch((error: any) => {
          console.error('Payment failed:', error);
          Alert.alert('Payment Failed', 'Please try again or choose a different payment method.');
        });
    } catch (error) {
      console.error("Payment initiation failed", error);
      Alert.alert("Error", "There was an issue processing your payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.divider} />
          
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.itemColumnText]}>Item</Text>
            <Text style={[styles.tableHeaderText, styles.qtyColumnText]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.priceColumnText]}>Total Price</Text>
          </View>
          
          {Object.keys(cartItems).map(itemId => {
            const item = menuItems.find(menuItem => menuItem.id === parseInt(itemId));
            if (!item) return null;
            
            return (
              <View key={itemId} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.itemColumnText]} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.tableCell, styles.qtyColumnText]}>{cartItems[itemId]}</Text>
                <Text style={[styles.tableCell, styles.priceColumnText]}>₹{calculateItemTotal(item, cartItems[itemId])}</Text>
              </View>
            );
          })}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>
          <View style={styles.divider} />
          
          {submittedAddress && !isEditing ? (
            <View style={styles.addressContainer}>
              <Text style={styles.addressText}>{submittedAddress}</Text>
              <TouchableOpacity style={styles.editButton} onPress={handleAddressEdit}>
                <Text style={styles.editButtonText}>Edit Address</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.addressInputContainer}>
              <TextInput
                style={styles.addressInput}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter your delivery address"
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity 
                style={styles.submitButton} 
                onPress={handleAddressSubmit}
              >
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Total:</Text>
          <View style={styles.divider} />
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Item Total</Text>
            <Text style={styles.summaryValue}>₹{orderTotal}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee (4.0 kms)</Text>
            <Text style={styles.summaryValue}>₹{deliveryFee}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Tip</Text>
            <View style={styles.tipInputContainer}>
              <Text style={styles.rupeeSign}>₹</Text>
              <TextInput
                style={styles.tipInput}
                value={tip.toString()}
                onChangeText={(text) => {
                  const value = parseInt(text) || 0;
                  setTip(Math.max(0, value));
                }}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Platform Fee</Text>
            <Text style={styles.summaryValue}>₹{platformFee}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>GST and Restaurant Charges</Text>
            <Text style={styles.summaryValue}>₹{gstAndCharges}</Text>
          </View>
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>TO PAY</Text>
            <Text style={styles.totalValue}>₹{grandTotal.toFixed(2)}</Text>
          </View>
        </View>
        
        <View style={styles.paymentOptionsContainer}>
          <TouchableOpacity 
            style={[styles.paymentButton, styles.codButton]} 
            onPress={handleCOD}
            disabled={loading}
          >
            <CashIcon size={24} color="white" />
            <Text style={styles.paymentButtonText}>Cash On Delivery</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.paymentButton, styles.upiButton]} 
            onPress={handleUPI}
            disabled={loading}
          >
            <CreditCard size={24} color="white" />
            <Text style={styles.paymentButtonText}>UPI</Text>
          </TouchableOpacity>
        </View>
        
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#4A8F47" />
            <Text style={styles.loadingText}>Processing your order...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    margin: 15,
    padding: 16,
    ...Platform.select({
      web: {
        maxWidth: 800,
        alignSelf: 'center',
        width: '100%',
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tableHeaderText: {
    fontWeight: '600',
    color: '#666',
    fontSize: 14,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableCell: {
    fontSize: 15,
  },
  itemColumnText: {
    flex: 2,
    paddingRight: 10,
  },
  qtyColumnText: {
    flex: 0.5,
    textAlign: 'center',
  },
  priceColumnText: {
    flex: 1,
    textAlign: 'right',
  },
  addressContainer: {
    marginVertical: 10,
  },
  addressText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  editButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    color: '#4A8F47',
    fontWeight: '500',
    fontSize: 14,
  },
  addressInputContainer: {
    marginVertical: 10,
  },
  addressInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 12,
    fontSize: 15,
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#4A8F47',
    padding: 12,
    borderRadius: 6,
    marginTop: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryLabel: {
    fontSize: 15,
    color: '#333',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  tipInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    paddingHorizontal: 8,
  },
  rupeeSign: {
    fontSize: 16,
    fontWeight: '500',
  },
  tipInput: {
    padding: 8,
    marginLeft: 4,
    fontSize: 16,
    minWidth: 60,
  },
  totalRow: {
    borderBottomWidth: 0,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4A8F47',
  },
  paymentOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    ...Platform.select({
      web: {
        maxWidth: 800,
        alignSelf: 'center',
        width: '100%',
      },
    }),
  },
  paymentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  codButton: {
    backgroundColor: '#8E44AD',
  },
  upiButton: {
    backgroundColor: '#4A8F47',
  },
  paymentButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4A8F47',
  },
});