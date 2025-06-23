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
import { Package, ShoppingCart, Wallet, ArrowLeft, Phone } from 'lucide-react-native';

type MenuItem = {
  id: number;
  name: string;
  staffPrice: number;
  category?: string;
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
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = await AsyncStorage.getItem("jwtToken");
      if (token) {
        try {
          const { sub } = JSON.parse(atob(token.split('.')[1]));
          console.log("Decoded user:", sub);
          setUsername(sub);
          
          // Fetch staff profile data using employeeId
          const response = await axiosInstance.get(`/staff/employee/${sub}`);
          console.log("Staff profile response:", response.data);
          if (response.data && response.data.mobileNumber) {
            setPhoneNumber(response.data.mobileNumber);
          } else {
            console.log("No mobile number found in staff profile");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          // Set loading to false even if there's an error
          setIsLoading(false);
        }
      } else {
        console.error("No JWT token found");
        setIsLoading(false);
  }
};

    fetchUserData();
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
    
    setSubmittedAddress(address.trim());
    setIsEditing(false);
    console.log("Address submitted:", address.trim());
  };

  const handleAddressEdit = () => {
    setAddress(submittedAddress);
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
        return item ? `${item.name} (${item.category}) X ${cartItems[parseInt(itemId)]}` : '';
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
        console.log("Navigating to order success page...");
        
        // Use replace to force fresh navigation and avoid stack issues
        router.replace('/(staff)/order-success');
        console.log("Navigation command executed");
      } else {
        Alert.alert("Error", "Payment verification failed!");
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      Alert.alert("Error", "There was an issue verifying your payment.");
    }
  };

  const handleUPI = async () => {
    if (!submittedAddress || !submittedAddress.trim()) {
      Alert.alert("Error", "Please enter the delivery address!");
      return;
    }

    if (!username) {
      Alert.alert("Error", "User information not loaded. Please try again.");
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
          address: submittedAddress.trim(),
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
    if (!submittedAddress || !submittedAddress.trim()) {
      Alert.alert("Error", "Please enter the delivery address!");
      return;
    }

    if (!username) {
      Alert.alert("Error", "User information not loaded. Please try again.");
      return;
    }

    const orderDetails: OrderDetails = {
      orderedRole: "Staff",
      orderedName: username,
      orderedUserId: username,
      itemName: Object.keys(cartItems).map(itemId => {
        const item = menuItems.find(menuItem => menuItem.id === parseInt(itemId));
        return item ? `${item.name} (${item.category}) X ${cartItems[parseInt(itemId)]}` : '';
      }).join(", "),
      quantity: Object.values(cartItems).reduce((acc, qty) => acc + qty, 0),
      category: "South",
      price: orderTotal,
      orderStatus: null,
      paymentType: "COD",
      paymentStatus: null,
      orderDateTime: new Date().toISOString(),
      address: submittedAddress.trim(),
      phoneNo: phoneNumber
    };

    try {
      console.log("=== Starting COD Order Submission ===");
      console.log("Order details:", orderDetails);
      console.log("Submitted address:", submittedAddress);
      console.log("Username:", username);
      
      const response = await axiosInstance.post("/orders", orderDetails);
      console.log("Order submitted successfully:", response.data);
      
      // Clear cart
      await AsyncStorage.removeItem('staff_cart');
      console.log("Cart cleared successfully");
      
      // Add a small delay to ensure everything is processed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log("Navigating to order success page...");
      
      // Use replace to force fresh navigation and avoid stack issues
      router.replace('/(staff)/order-success');
      console.log("Navigation command executed");
      
    } catch (error: any) {
      console.error("=== COD Order Error ===");
      console.error("Error details:", error);
      console.error("Error message:", error.message);
      console.error("Error response:", error.response?.data);
      Alert.alert("Error", "There was an issue submitting your order. Please try again.");
    }
  };

  const handleCredit = async () => {
    if (!submittedAddress || !submittedAddress.trim()) {
      Alert.alert("Error", "Please enter the delivery address first");
      return;
    }

    if (!username) {
      Alert.alert("Error", "User information not loaded. Please try again.");
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
                return item ? `${item.name} (${item.category}) X ${cartItems[parseInt(itemId)]}` : '';
              }).join(", "),
              quantity: Object.values(cartItems).reduce((acc, qty) => acc + qty, 0),
              category: "South",
              price: orderTotal,
              orderStatus: null,
              paymentType: "CREDIT",
              paymentStatus: null,
              orderDateTime: new Date().toISOString(),
              address: submittedAddress.trim(),
              phoneNo: phoneNumber
            };

            try {
              console.log("Submitting credit order with details:", orderDetails);
              const response = await axiosInstance.post("/orders", orderDetails);
              console.log("Credit order submitted successfully:", response.data);
              
              await AsyncStorage.removeItem('staff_cart');
              
              // Navigate to order success page
              console.log("Navigating to order success page...");
              
              // Use replace to force fresh navigation and avoid stack issues
              router.replace('/(staff)/order-success');
              console.log("Navigation command executed");
            } catch (error) {
              console.error("Order error:", error);
              Alert.alert("Error", "There was an issue submitting your order. Please try again.");
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
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
                <Text style={styles.tableCell}>
                  {item.name} ({item.category}) x{cartItems[parseInt(itemId)]}
                </Text>
                <Text style={styles.tableCell}>₹{calculateItemTotal(item, cartItems[parseInt(itemId)])}</Text>
              </View>
            );
          })}
        </View>

        {/* Delivery Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Package size={20} color="#2E7D32" />
          <Text style={styles.sectionTitle}>Delivery Details</Text>
            </View>
          
          {isEditing ? (
            <View style={styles.inputContainer}>
              <View style={styles.phoneContainer}>
                <Phone size={20} color="#666" style={styles.phoneIcon} />
                <Text style={styles.phoneNumber}>{phoneNumber}</Text>
            </View>
              <TextInput
                style={styles.input}
                placeholder="Enter delivery address"
                value={address}
                onChangeText={setAddress}
                multiline
              />
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddressSubmit}
              >
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.addressContainer}>
              <View style={styles.phoneContainer}>
                <Phone size={20} color="#666" style={styles.phoneIcon} />
                <Text style={styles.phoneNumber}>{phoneNumber}</Text>
              </View>
              <Text style={styles.addressText}>{address}</Text>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={handleAddressEdit}
              >
                <Text style={styles.editButtonText}>Edit</Text>
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
  inputContainer: {
    marginBottom: 16,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  phoneIcon: {
    marginRight: 8,
  },
  phoneNumber: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  input: {
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
  editButtonText: {
    color: '#2E7D32',
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginLeft: 16,
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
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tableHeaderText: {
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tableCell: {
    flex: 1,
  },
});