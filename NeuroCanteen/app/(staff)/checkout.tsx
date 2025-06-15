import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import axiosInstance from '../api/axiosInstance';
import RazorpayCheckout from 'react-native-razorpay';
import { useEffect } from 'react';
import { Link } from 'expo-router';
import { Package, ShoppingCart, Wallet, ArrowLeft } from 'lucide-react-native';

type MenuItem = {
  id: number;
  name: string;
  staffPrice: number;
};

type CartItems = {
  [key: number]: number;
};

type OrderDetails = {
  orderedRole: string;
  orderedName: string;
  orderedUserId: string;
  itemName: string;
  quantity: number;
  category: string;
  price: number;
  orderStatus: string | null;
  paymentType: string;
  paymentStatus: string | null;
  orderDateTime: string;
  address: string;
  paymentRecived?: boolean;
  phoneNo?: string;
};

export default function StaffOrderCheckout() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [tip, setTip] = useState(0);
  const MAX_TIP = 500;
  const [address, setAddress] = useState('');
  const [submittedAddress, setSubmittedAddress] = useState('');
  const [isEditing, setIsEditing] = useState(true);
  const [username, setUsername] = useState('');
  const [creditBalance, setCreditBalance] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState('');
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

  const fetchCreditBalance = async () => {
  try {
    const response = await axiosInstance.get(`/users/credit-balance?userId=${username}`);
    setCreditBalance(response.data.balance);
  } catch (error) {
    console.error("Error fetching credit balance:", error);
  }
};
  }, []);
  

  const cartItems: CartItems = params.cartItems ? JSON.parse(params.cartItems as string) : {};
  const menuItems: MenuItem[] = params.menuItems ? JSON.parse(params.menuItems as string) : [];

  const calculateItemTotal = (item: MenuItem, quantity: number) => {
    return item.staffPrice * quantity;
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
    
    if (phoneNumber && !/^\d{10}$/.test(phoneNumber)) {
      Alert.alert("Error", "Please enter a valid 10-digit phone number or leave it empty");
      return;
    }
    
    const fullAddress = phoneNumber.trim() 
      ? `ph: ${phoneNumber}, address:${address}`
      : address;
      
    setSubmittedAddress(fullAddress);
    setIsEditing(false);
  };

  const handleAddressEdit = () => {
    if (submittedAddress.startsWith('ph:') && submittedAddress.includes(', address:')) {
      const parts = submittedAddress.split(', address:');
      const phonePart = parts[0].replace('ph:', '');
      const addressPart = parts[1];
      
      setPhoneNumber(phonePart);
      setAddress(addressPart);
    } else {
      setPhoneNumber('');
      setAddress(submittedAddress);
    }
    
    setIsEditing(true);
  };

  const verifyPayment = async (response: any) => {
    const paymentData = {
      orderId: response.razorpay_order_id,
      paymentId: response.razorpay_payment_id,
      paymentSignature: response.razorpay_signature,
      paymentMethod: "UPI",
      amount: orderTotal,
      createdAt: new Date().toISOString(),
    };

    const orderDetails: OrderDetails = {
      orderedRole: "Staff",
      orderedName: username,
      orderedUserId: username,
      itemName: Object.keys(cartItems).map(itemId => {
        const item = menuItems.find(menuItem => menuItem.id === parseInt(itemId));
        return item ? `${item.name} X ${cartItems[parseInt(itemId)]}` : '';
      }).join(", "),
      quantity: Object.values(cartItems).reduce((acc, qty) => acc + qty, 0),
      category: "South",
      price: orderTotal,
      orderStatus: null,
      paymentType: "UPI",
      paymentStatus: null,
      orderDateTime: new Date().toISOString(),
      address: submittedAddress,
      paymentRecived: false,
      phoneNo: phoneNumber
    };

    try {
      const result = await axiosInstance.post("/payment/verifyPayment", paymentData);
      if (result.data) {
        orderDetails.paymentRecived = true;
        orderDetails.paymentStatus = "COMPLETED";
        await axiosInstance.post("/orders", orderDetails);
        await AsyncStorage.removeItem('staff_cart');
        router.push({
          pathname: '/(staff)/order-success',
          params: {
            orderHistoryRedirect: '/(staff)/order-history',
            orderedUserId: username,
            orderedRole: 'Staff'
          }
        });
      } else {
        Alert.alert("Error", "Payment verification failed!");
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      Alert.alert("Error", "There was an issue verifying your payment.");
    }
  };

  const handleUPI = async () => {
    if (!submittedAddress) {
      Alert.alert("Error", "Please enter the mobile number and delivery address!");
      return;
    }

    try {
      const payment_metadata = await axiosInstance.post("/payment/createOrder", { price: grandTotal });
      const { orderId, amount } = payment_metadata.data;

      const options = {
        key: "rzp_test_0oZHIWIDL59TxD",
        amount: amount * 100,
        currency: "INR",
        name: "Neuro Canteen",
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

  const handleCOD = async () => {
    if (!submittedAddress) {
      Alert.alert("Error", "Please enter the mobile number and delivery address!");
      return;
    }

    const orderDetails: OrderDetails = {
      orderedRole: "Staff",
      orderedName: username,
      orderedUserId: username,
      itemName: Object.keys(cartItems).map(itemId => {
        const item = menuItems.find(menuItem => menuItem.id === parseInt(itemId));
        return item ? `${item.name} X ${cartItems[parseInt(itemId)]}` : '';
      }).join(", "),
      quantity: Object.values(cartItems).reduce((acc, qty) => acc + qty, 0),
      category: "South",
      price: orderTotal,
      orderStatus: null,
      paymentType: "COD",
      paymentStatus: null,
      orderDateTime: new Date().toISOString(),
      address: submittedAddress,
      phoneNo: phoneNumber
    };

    try {
      await axiosInstance.post("/orders", orderDetails);
      await AsyncStorage.removeItem('staff_cart');
      router.push({
        pathname: '/(staff)/order-success',
        params: {
          orderHistoryRedirect: '/(staff)/order-history',
          orderedUserId: username,
          orderedRole: 'Staff'
        }
      });
    } catch (error) {
      console.error("Order error:", error);
      Alert.alert("Error", "There was an issue submitting your order.");
    }
  };

  const handleCredit = async () => {
    if (!submittedAddress) {
      Alert.alert("Error", "Please enter the delivery address first");
      return;
    }

    Alert.alert(
      "Confirm Credit Purchase",
      `This will add ₹${grandTotal.toFixed(2)} to your credit balance. Continue?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          onPress: async () => {
            const orderDetails: OrderDetails = {
              orderedRole: "Staff",
              orderedName: username,
              orderedUserId: username,
              itemName: Object.keys(cartItems).map(itemId => {
                const item = menuItems.find(menuItem => menuItem.id === parseInt(itemId));
                return item ? `${item.name} X ${cartItems[parseInt(itemId)]}` : '';
              }).join(", "),
              quantity: Object.values(cartItems).reduce((acc, qty) => acc + qty, 0),
              category: "South",
              price: orderTotal,
              orderStatus: null,
              paymentType: "CREDIT",
              paymentStatus: null,
              orderDateTime: new Date().toISOString(),
              address: submittedAddress,
              phoneNo: phoneNumber
            };

            try {
              await axiosInstance.post("/orders", orderDetails);
              await AsyncStorage.removeItem('staff_cart');
              router.push({
                pathname: '/(staff)/order-success',
                params: {
                  orderHistoryRedirect: '/(staff)/order-history',
                  orderedUserId: username,
                  orderedRole: 'Staff'
                }
              });
            } catch (error) {
              console.error("Order error:", error);
              Alert.alert("Error", "There was an issue submitting your order.");
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#2E7D32" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Checkout</Text>
      </View>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        {/* Order Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ShoppingCart size={20} color="#2E7D32" />
            <Text style={styles.sectionTitle}>Order Summary</Text>
          </View>
          {Object.entries(cartItems).map(([itemId, quantity]) => {
            const item = menuItems.find(menuItem => menuItem.id === parseInt(itemId));
            if (!item) return null;
            return (
              <View key={itemId} style={styles.orderItem}>
                <Text style={styles.itemName}>{item.name} x{quantity}</Text>
                <Text style={styles.itemPrice}>₹{calculateItemTotal(item, quantity)}</Text>
              </View>
            );
          })}
        </View>

        {/* Delivery Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>
          <View style={styles.divider} />
          
          {/* Only show phone number field when editing */}
          {isEditing && (
            <View style={styles.phoneNumberContainer}>
              <TextInput
                style={styles.phoneNumberInput}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Mobile Number (Optional)"
                keyboardType="phone-pad"
              />
            </View>
          )}
          
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
        
          {/* Payment Options */}
          <View style={styles.paymentOptions}>
            <TouchableOpacity style={styles.codButton} onPress={handleCOD}>
              <Text style={styles.paymentButtonText}>Cash On Delivery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.upiButton} onPress={handleUPI}>
              <Text style={styles.paymentButtonText}>UPI</Text>
            </TouchableOpacity>
          </View>

          {/* Credit Payment Option */}
          <View style={styles.paymentOptions}>
            <TouchableOpacity 
              style={styles.creditButton}
              onPress={handleCredit}
            >
              <Text style={styles.paymentButtonText}>Pay Later with Credit</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.creditNotice}>
            Choosing "Pay Later with Credit" will add ₹{grandTotal.toFixed(2)} to your credit balance
          </Text>
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemName: {
    flex: 1,
  },
  itemPrice: {
    fontWeight: 'bold',
  },
  phoneNumberContainer: {
    marginBottom: 16,
  },
  phoneNumberInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  addressContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 4,
    marginBottom: 12,
  },
  addressText: {
    fontSize: 16,
    color: '#333',
  },
  editButton: {
    color: '#2E7D32',
    marginTop: 8,
    fontWeight: 'bold',
  },
  addressInputContainer: {
    marginBottom: 16,
  },
  addressInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#4A8F47',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
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
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipNote: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
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
  creditButton: {
    backgroundColor: '#4A8F47',
    padding: 15,
    borderRadius: 4,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  paymentButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  creditNotice: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  paymentOptionsContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    marginTop: 20,
  },
});