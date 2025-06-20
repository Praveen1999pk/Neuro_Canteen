import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MapPin, Phone, Calendar, Package, IndianRupee, ArrowLeft } from 'lucide-react-native';
import axiosInstance from '../api/axiosInstance';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { triggerDeliveryNotification } from '../services/notifications';

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

export default function UpdateOrderScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPaymentStatus, setCurrentPaymentStatus] = useState('PENDING');
  const [currentDeliveryStatus, setCurrentDeliveryStatus] = useState<string | null>(null);
  const [pendingPaymentStatus, setPendingPaymentStatus] = useState('PENDING');
  const [pendingDeliveryStatus, setPendingDeliveryStatus] = useState<string | null>(null);
  const [notifiedOrderIds, setNotifiedOrderIds] = useState<number[]>([]);

  // Load notified orders from storage
  const loadNotifiedOrders = async () => {
    try {
      const storedIds = await AsyncStorage.getItem('notifiedOrderIds');
      if (storedIds) {
        setNotifiedOrderIds(JSON.parse(storedIds));
      }
    } catch (error) {
      console.error('Error loading notified orders:', error);
    }
  };

  // Save notified orders to storage
  const saveNotifiedOrders = async (ids: number[]) => {
    try {
      await AsyncStorage.setItem('notifiedOrderIds', JSON.stringify(ids));
    } catch (error) {
      console.error('Error saving notified orders:', error);
    }
  };

  // Handle notification when order status changes to OUT_FOR_DELIVERY
  const handleDeliveryNotification = async (orderData: Order) => {
    if (!orderId || notifiedOrderIds.includes(orderData.orderId)) return;

    try {
      // Trigger notification
      await triggerDeliveryNotification({
        orderId: orderData.orderId,
        itemName: orderData.itemName,
        address: orderData.address,
        orderedName: orderData.orderedName,
        phoneNo: orderData.phoneNo
      });

      // Show alert
      Alert.alert(
        'New Delivery Assignment',
        `Order #${orderData.orderId}\n\n` +
        `Items: ${orderData.itemName}\n` +
        `Address: ${orderData.address}\n` +
        `Customer: ${orderData.orderedName || 'No name provided'}\n` +
        `Phone: ${orderData.phoneNo || 'No phone provided'}`,
        [{ text: 'OK' }]
      );

      // Haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Update notified orders
      const updatedNotifiedIds = [...notifiedOrderIds, orderData.orderId];
      setNotifiedOrderIds(updatedNotifiedIds);
      await saveNotifiedOrders(updatedNotifiedIds);
    } catch (error) {
      console.error('Error handling delivery notification:', error);
    }
  };

  // Fetch order data
  const fetchOrder = async () => {
    if (!orderId) return;

    try {
      const response = await axiosInstance.get(`/orders/${orderId}`, { timeout: 8000 });
      const orderData: Order = response.data;

      // Check if status changed to OUT_FOR_DELIVERY
      if (orderData.deliveryStatus === 'OUT_FOR_DELIVERY' && 
          currentDeliveryStatus !== 'OUT_FOR_DELIVERY' &&
          !notifiedOrderIds.includes(orderData.orderId)) {
        await handleDeliveryNotification(orderData);
      }

      // Update state
      setOrder(orderData);
      setCurrentPaymentStatus(orderData.paymentRecived ? "COMPLETED" : 'PENDING');
      setPendingPaymentStatus(orderData.paymentRecived ? "COMPLETED" : 'PENDING');
      setCurrentDeliveryStatus(orderData.deliveryStatus ?? null);
      setPendingDeliveryStatus(orderData.deliveryStatus ?? null);
    } catch (error) {
      console.error('Error fetching order:', error);
      Alert.alert('Error', 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  // Update order status
  const handleUpdateOrder = async () => {
    if (!orderId) return;

    try {
      await axiosInstance.patch(`orders/${orderId}/delivery-status`, null, {
        params: { deliveryStatus: pendingDeliveryStatus },
      });

      // Refresh order data
      await fetchOrder();
      
      // Navigate back if status is Delivered or Cancelled
      if (pendingDeliveryStatus === 'Delivered' || pendingDeliveryStatus === 'Cancelled') {
        router.back();
      }
    } catch (error) {
      console.error('Error updating order:', error);
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  // Initial load
  useEffect(() => {
    loadNotifiedOrders();
  }, []);

  // Set up polling
  useEffect(() => {
    if (orderId) {
      fetchOrder();
      const interval = setInterval(fetchOrder, 5000);
      return () => clearInterval(interval);
    }
  }, [orderId, notifiedOrderIds]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Order not found</Text>
      </View>
    );
  }

  // Format order data
  const items = order.itemName.split(', ');
  const dateObj = new Date(order.orderDateTime);
  const formattedDate = dateObj.toLocaleDateString();
  const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const totalPrice = order.price;

  // Status display helpers
  const getDeliveryStatusText = () => {
    if (!order.orderStatus) return "Waiting for confirmation";
    if (order.orderStatus === 'OUT_FOR_DELIVERY') return "Out for Delivery";
    if (order.deliveryStatus === 'OrderReceived') return "Order Received";
    if (order.deliveryStatus === 'Delivered') return "Delivered";
    if (order.deliveryStatus === 'Cancelled') return "Cancelled";
    return "Pending";
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <ArrowLeft size={24} color="#fff" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Order #{order.orderId}</Text>
      </View>

      <View style={styles.content}>
        {/* Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Status</Text>
          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <Package size={25} color="#03A791" />
              <Text style={styles.statusLabel}>Delivery</Text>
              <Text style={styles.statusValue}>{getDeliveryStatusText()}</Text>
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

        {/* Items Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          {items.map((item, index) => (
            <Text key={index} style={styles.itemText}>• {item}</Text>
          ))}
        </View>

        {/* Price Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Total Price</Text>
          <Text style={styles.priceText}>₹{totalPrice.toFixed(2)}</Text>
        </View>

        {/* Delivery Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>
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

        {/* Update Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Update Status</Text>

          {/* Payment Status */}
          <Text style={styles.label}>Payment Status</Text>
          <View style={styles.buttonGroup}>
            {['PENDING', 'COMPLETED'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.button, 
                  pendingPaymentStatus === status && styles.activeButton,
                  (order.paymentType === 'CREDIT' || currentPaymentStatus === 'COMPLETED') && styles.disabledButton
                ]}
                onPress={() => {
                  if (order.paymentType !== 'CREDIT' && currentPaymentStatus !== 'COMPLETED') {
                    setPendingPaymentStatus(status);
                  }
                }}
                disabled={order.paymentType === 'CREDIT' || currentPaymentStatus === 'COMPLETED'}
              >
                <Text style={[
                  styles.buttonText, 
                  pendingPaymentStatus === status && styles.activeButtonText,
                  (order.paymentType === 'CREDIT' || currentPaymentStatus === 'COMPLETED') && styles.disabledButtonText
                ]}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {order.paymentType === 'CREDIT' && (
            <Text style={styles.disabledText}>Payment status cannot be changed for CREDIT orders</Text>
          )}
          {currentPaymentStatus === 'COMPLETED' && order.paymentType !== 'CREDIT' && (
            <Text style={styles.disabledText}>Payment has been completed. Status cannot be changed.</Text>
          )}

          {/* Delivery Status */}
          <Text style={styles.label}>Delivery Status</Text>
          <View style={styles.buttonGroup}>
            {['OrderReceived', 'OutForDelivery', 'Delivered', 'Cancelled'].map((status) => {
              const isDisabled = 
                currentDeliveryStatus === 'Delivered' || 
                (status === 'Delivered' && pendingPaymentStatus !== 'COMPLETED' && order.paymentType !== 'CREDIT');

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
          {pendingPaymentStatus !== 'COMPLETED' && order.paymentType !== 'CREDIT' && (
            <Text style={styles.disabledText}>Payment must be completed before marking as delivered.</Text>
          )}
        </View>

        {/* Update Button */}
        <TouchableOpacity 
          style={[
            styles.updateButton,
            (pendingPaymentStatus === currentPaymentStatus && 
             pendingDeliveryStatus === currentDeliveryStatus) && styles.disabledUpdateButton
          ]} 
          onPress={handleUpdateOrder}
          disabled={pendingPaymentStatus === currentPaymentStatus && 
                   pendingDeliveryStatus === currentDeliveryStatus}
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
    marginTop: Platform.OS === 'ios' ? 44 : 0,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 8,
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
    flexShrink: 1,
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
  loadingText: {
    padding: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    padding: 20,
    fontSize: 16,
    textAlign: 'center',
    color: 'red',
  },
});