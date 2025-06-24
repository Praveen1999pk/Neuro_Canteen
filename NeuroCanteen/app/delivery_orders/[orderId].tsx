import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MapPin, Phone, Calendar, Package, IndianRupee, ArrowLeft } from 'lucide-react-native';
import axiosInstance from '../api/axiosInstance';

const GST_PERCENT = 12;
const DELIVERY_FEE = 0;
const PLATFORM_FEE = 0;

export default function UpdateOrderScreen() {
  type Order = {
    orderId: number;
    orderedRole: string;
    orderedName: string | null;
    orderedUserId: string;
    itemName: string;
    quantity: number;
    category: string;
    price: number;
    orderStatus: string;
    paymentType: string;
    paymentRecived: boolean;
    paymentStatus: string | null;
    orderDateTime: string;
    deliveryStatus: string | null;
    address: string;
    phoneNo: string | null;
  };

  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPaymentStatus, setCurrentPaymentStatus] = useState('PENDING');
  const [currentDeliveryStatus, setCurrentDeliveryStatus] = useState<string | null>(null);
  const [pendingPaymentStatus, setPendingPaymentStatus] = useState('PENDING');
  const [pendingDeliveryStatus, setPendingDeliveryStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await axiosInstance.get(`/orders/${orderId}`, { timeout: 8000 });
        
        // Validate and clean the response data
        let orderData: Order;
        if (typeof response.data === 'string') {
          // If response.data is a string, try to parse it as JSON
          try {
            orderData = JSON.parse(response.data);
          } catch (parseError) {
            console.error('JSON parse error:', parseError);
            console.error('Response data:', response.data);
            throw new Error('Invalid JSON response from server');
          }
        } else {
          orderData = response.data;
        }
        
        // Validate required fields
        if (!orderData || typeof orderData !== 'object') {
          throw new Error('Invalid order data received');
        }
        
        // Clean and validate string fields
        if (orderData.itemName && typeof orderData.itemName === 'string') {
          orderData.itemName = orderData.itemName.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
        }
        if (orderData.address && typeof orderData.address === 'string') {
          orderData.address = orderData.address.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
        }
        if (orderData.orderedName && typeof orderData.orderedName === 'string') {
          orderData.orderedName = orderData.orderedName.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
        }
        if (orderData.phoneNo && typeof orderData.phoneNo === 'string') {
          orderData.phoneNo = orderData.phoneNo.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
        }
        
        setOrder(orderData);
        setCurrentPaymentStatus(orderData.paymentRecived ? "COMPLETED" : 'PENDING');
        setPendingPaymentStatus(orderData.paymentRecived ? "COMPLETED" : 'PENDING');
        setCurrentDeliveryStatus(orderData.deliveryStatus ?? null);
        setPendingDeliveryStatus(orderData.deliveryStatus ?? null);
      } catch (error) {
        console.error('Error fetching order:', error);
        // Show user-friendly error message
        Alert.alert(
          "Error",
          "Failed to load order details. Please try again.",
          [{ text: "OK", onPress: () => router.back() }]
        );
      } finally {
        setLoading(false);
      }
    };

    if (orderId) fetchOrder();
  }, [orderId]);

  const handleUpdateOrder = async () => {
    try {
      // Check if there are any changes
      if (pendingPaymentStatus !== currentPaymentStatus || pendingDeliveryStatus !== currentDeliveryStatus) {
        // Validate delivery status before updating
        if (pendingDeliveryStatus === 'Delivered' && pendingPaymentStatus !== 'COMPLETED' && order?.paymentType !== 'CREDIT') {
          Alert.alert(
            "Cannot Mark as Delivered",
            "Payment must be completed before marking the order as delivered."
          );
          return;
        }

        // First update payment status
        if (pendingPaymentStatus !== currentPaymentStatus) {
          const paymentResponse = await axiosInstance.patch(`orders/${orderId}/payment-received`, null, {
            params: { paymentReceived: pendingPaymentStatus === "COMPLETED" },
          });

          if (paymentResponse.status === 200) {
            setCurrentPaymentStatus(pendingPaymentStatus);
          }
        }

        // Then update delivery status
        if (pendingDeliveryStatus !== currentDeliveryStatus) {
          const deliveryResponse = await axiosInstance.patch(`orders/${orderId}/delivery-status`, null, {
            params: { deliveryStatus: pendingDeliveryStatus },
          });
          
          if (deliveryResponse.status === 200) {
            setCurrentDeliveryStatus(pendingDeliveryStatus);
            // Reset pending status to allow re-confirmation
            setPendingDeliveryStatus(pendingDeliveryStatus);
          }
        }

        router.back();
      } else {
        // If no changes, still allow the update to process
        const deliveryResponse = await axiosInstance.patch(`orders/${orderId}/delivery-status`, null, {
          params: { deliveryStatus: pendingDeliveryStatus },
        });
        
        if (deliveryResponse.status === 200) {
          setCurrentDeliveryStatus(pendingDeliveryStatus);
          // Reset pending status to allow re-confirmation
          setPendingDeliveryStatus(pendingDeliveryStatus);
        }
        router.back();
      }
    } catch (error) {
      console.error('Error updating order:', error);
      Alert.alert("Error", "Failed to update order status.");
    }
  };

  if (loading) {
    return <View style={styles.container}><Text style={{ padding: 20 }}>Loading...</Text></View>;
  }

  if (!order) {
    return <View style={styles.container}><Text style={{ padding: 20 }}>Order not found</Text></View>;
  }

  const items = order.itemName.split(', ');
  const dateObj = new Date(order.orderDateTime);
  const formattedDate = dateObj.toLocaleDateString();
  const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const itemTotal = order.price;
  
  // Calculate grand total
  const gstAmount = (itemTotal * GST_PERCENT) / 100;
  const grandTotal = itemTotal + DELIVERY_FEE + PLATFORM_FEE + gstAmount;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Order #{order.orderId}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Status</Text>
          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <Package size={25} color="#03A791" />
              <Text style={styles.statusLabel}>Delivery</Text>
              <Text style={styles.statusValue}>
                {!currentDeliveryStatus ? "Waiting for confirmation" : 
                 currentDeliveryStatus === 'OrderReceived' ? "Confirmed" :
                 currentDeliveryStatus === 'OutForDelivery' ? "Out for Delivery" :
                 currentDeliveryStatus === 'Delivered' ? "Delivered" :
                 currentDeliveryStatus === 'Cancelled' ? "Cancelled" :
                 currentDeliveryStatus}
              </Text>
            </View>
            <View style={styles.statusItem}>
              <IndianRupee size={25} color="#28B463" />
              <Text style={styles.statusLabel}>Payment</Text>
              <Text style={styles.statusValue}>
                {currentPaymentStatus === 'COMPLETED' ? 'Received' : 'Pending'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          {items.map((item, index) => {
            // Try to parse name, category, and quantity if possible
            const match = item.match(/^(.*) \((.*)\) X(\d+)$/);
            if (match) {
              return (
                <Text key={index} style={styles.itemText}>• {match[1]} ({match[2]}) x{match[3]}</Text>
              );
            }
            return <Text key={index} style={styles.itemText}>• {item}</Text>;
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Grand Total</Text>
          <Text style={styles.priceText}>₹{grandTotal.toFixed(2)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>
          {order.orderedName && (
            <View style={styles.detailItem}>
              <Text style={[styles.detailText, {fontWeight: 'bold'}]}>Name: {order.orderedName}</Text>
            </View>
          )}
          <View style={styles.detailItem}>
            <MapPin size={20} color="#666" />
            <Text style={styles.detailText}>{order.address || 'No address provided'}</Text>
          </View>
          {order.phoneNo && (
            <View style={styles.detailItem}>
              <Phone size={20} color="#666" />
              <Text style={styles.detailText}>{order.phoneNo}</Text>
            </View>
          )}
          <View style={styles.detailItem}>
            <Calendar size={20} color="#666" />
            <Text style={styles.detailText}>{formattedDate} at {formattedTime}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Update Status</Text>

          <Text style={styles.label}>Payment Status</Text>
          <View style={styles.buttonGroup}>
            {['PENDING', 'COMPLETED'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.button, 
                  pendingPaymentStatus === status && styles.activeButton,
                  (order?.paymentType === 'CREDIT' || currentPaymentStatus === 'COMPLETED') && styles.disabledButton
                ]}
                onPress={() => {
                  if (order?.paymentType !== 'CREDIT' && currentPaymentStatus !== 'COMPLETED') {
                    setPendingPaymentStatus(status);
                  }
                }}
                disabled={order?.paymentType === 'CREDIT' || currentPaymentStatus === 'COMPLETED'}
              >
                <Text style={[
                  styles.buttonText, 
                  pendingPaymentStatus === status && styles.activeButtonText,
                  (order?.paymentType === 'CREDIT' || currentPaymentStatus === 'COMPLETED') && styles.disabledButtonText
                ]}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {order?.paymentType === 'CREDIT' && (
            <Text style={styles.disabledText}>Payment status cannot be changed for CREDIT orders</Text>
          )}
          {currentPaymentStatus === 'COMPLETED' && order?.paymentType !== 'CREDIT' && (
            <Text style={styles.disabledText}>Payment has been completed. Status cannot be changed.</Text>
          )}

          <Text style={styles.label}>Delivery Status</Text>
          <View style={styles.buttonGroup}>
            {['OrderReceived', 'OutForDelivery', 'Delivered', 'Cancelled'].map((status) => {
              const isDisabled = 
                currentDeliveryStatus === 'Delivered' || 
                (status === 'Delivered' && pendingPaymentStatus !== 'COMPLETED' && order?.paymentType !== 'CREDIT');

              return (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.button, 
                    pendingDeliveryStatus === status && styles.activeButton,
                    isDisabled && styles.disabledButton
                  ]}
                  onPress={() => {
                    if (!isDisabled) {
                      setPendingDeliveryStatus(status);
                    }
                  }}
                  disabled={isDisabled}
                >
                  <Text style={[
                    styles.buttonText, 
                    pendingDeliveryStatus === status && styles.activeButtonText,
                    isDisabled && styles.disabledButtonText
                  ]}>
                    {status === 'OrderReceived' ? 'Confirm Delivery' : 
                     status === 'OutForDelivery' ? 'Out for Delivery' :
                     status === 'Delivered' ? 'Delivered' :
                     'Cancelled'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {currentDeliveryStatus === 'Delivered' && (
            <Text style={styles.disabledText}>Order has been delivered. Status cannot be changed.</Text>
          )}
          {pendingPaymentStatus !== 'COMPLETED' && order?.paymentType !== 'CREDIT' && (
            <Text style={styles.disabledText}>Payment must be completed before marking the order as delivered.</Text>
          )}
        </View>

        <TouchableOpacity 
          style={[
            styles.updateButton,
            (pendingPaymentStatus === currentPaymentStatus && 
             pendingDeliveryStatus === currentDeliveryStatus) && styles.disabledUpdateButton
          ]} 
          onPress={handleUpdateOrder}
          disabled={false}
        >
          <Text style={styles.updateButtonText}>Update Order</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F3F4',
  },
  header: {
    padding: 20,
    backgroundColor: '#2E7D32',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginTop: 44,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'column',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    gap: 16,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    width: 80,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  itemText: {
    fontSize: 16,
    color: '#444',
    marginBottom: 8,
  },
  priceText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    color: '#444',
    marginLeft: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  button: {
    minWidth: '48%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  activeButton: {
    backgroundColor: '#2E7D32',
  },
  buttonText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  activeButtonText: {
    color: '#fff',
  },
  updateButton: {
    backgroundColor: '#2E7D32',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
    borderColor: '#E0E0E0',
  },
  disabledButtonText: {
    color: '#9E9E9E',
  },
  disabledText: {
    color: '#9E9E9E',
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  disabledUpdateButton: {
    backgroundColor: '#E0E0E0',
    borderColor: '#E0E0E0',
  },
});