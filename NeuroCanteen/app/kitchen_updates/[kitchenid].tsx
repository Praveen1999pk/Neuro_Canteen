import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MapPin, Phone, Calendar, Package, IndianRupee, ArrowLeft } from 'lucide-react-native';
import axiosInstance from '../api/axiosInstance';
import { triggerDeliveryNotification } from '@/services/notifications'

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

  const router = useRouter();
  const { kitchenid } = useLocalSearchParams<{ kitchenid: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [deliveryStatus, setDeliveryStatus] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await axiosInstance.get(`/orders/${kitchenid}`, { timeout: 8000 });
        
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
        setDeliveryStatus(orderData.orderStatus ?? '');
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

    if (kitchenid) fetchOrder();
  }, [kitchenid]);

  const handleUpdateOrder = async () => {
    try {
      await axiosInstance.patch(`orders/${kitchenid}/status`, null, {
        params: { orderStatus: deliveryStatus },
      });
      //for notification
      if (deliveryStatus === 'OUT_FOR_DELIVERY' && order) {
        await triggerDeliveryNotification({
          orderId: order.orderId,
          itemName: order.itemName,
          address: order.address
        });
      }
      // Fetch the updated order to ensure we have the latest data
      const response = await axiosInstance.get(`/orders/${kitchenid}`, { timeout: 8000 });
      const updatedOrder = response.data;
      setOrder(updatedOrder);

      // Navigate back to the kitchen dashboard
      router.back();
    } catch (error) {
      console.error('Error updating order:', error);
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
  // const gstAmount = (itemTotal * GST_PERCENT) / 100;
  const grandTotal = itemTotal + DELIVERY_FEE + PLATFORM_FEE;

  // Determine payment status
  const paymentStatus = order.paymentType === 'UPI' ? 'COMPLETED' : (order.paymentRecived ? 'COMPLETED' : 'PENDING');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1B5E20" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Order #{order.orderId}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Status</Text>
          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <Package size={25} color="#03A791" />
              <Text style={styles.statusLabel}>Status</Text>
              <Text style={styles.statusValue}>
                {!order.orderStatus ? "Waiting for confirmation" : 
                 order.orderStatus === 'RECEIVED' ? "Confirmed" :
                 order.orderStatus === 'PREPARED' ? "Prepared" :
                 order.orderStatus === 'OUT_FOR_DELIVERY' ? "Sent for Delivery" :
                 order.orderStatus}
              </Text>
            </View>
            <View style={styles.statusItem}>
              <IndianRupee size={25} color="#28B463" />
              <Text style={styles.statusLabel}>Payment</Text>
              <Text style={styles.statusValue}>
                {paymentStatus === 'COMPLETED' ? 'Received' : 'Pending'} ({order.paymentType})
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
          <View style={styles.buttonGroup}>
            {['RECEIVED', 'PREPARED', 'OUT_FOR_DELIVERY'].map((status) => {
              let isDisabled = false;
              if (status === 'RECEIVED') {
                // Only allow confirming if not already confirmed
                isDisabled = order.orderStatus !== null;
              } else if (status === 'PREPARED') {
                // Allow 'Prepared' if order is confirmed and not already prepared or sent for delivery
                isDisabled = !(order.orderStatus === 'RECEIVED');
              } else if (status === 'OUT_FOR_DELIVERY') {
                // Allow 'Send for Delivery' if order is confirmed or prepared, and not already sent for delivery
                isDisabled = !(order.orderStatus === 'RECEIVED' || order.orderStatus === 'PREPARED');
              }
              return (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.button,
                    deliveryStatus === status && styles.activeButton,
                    isDisabled && styles.disabledButton
                  ]}
                  onPress={() => setDeliveryStatus(status)}
                  disabled={isDisabled}
                >
                  <Text style={[
                    styles.buttonText,
                    deliveryStatus === status && styles.activeButtonText,
                    isDisabled && styles.disabledButtonText
                  ]}>
                    {status === 'RECEIVED' ? 'Confirm' :
                     status === 'PREPARED' ? 'Prepared' :
                     'Send for Delivery'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {order.orderStatus === 'OUT_FOR_DELIVERY' && (
            <Text style={styles.disabledText}>Order has been sent for delivery. Status cannot be changed.</Text>
          )}
          {order.orderStatus !== null && order.orderStatus !== 'OUT_FOR_DELIVERY' && (
            <Text style={styles.disabledText}>Order has been confirmed. Status cannot be changed back.</Text>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.updateButton, 
            (!deliveryStatus || deliveryStatus === order.orderStatus || order.orderStatus === 'OUT_FOR_DELIVERY') && styles.disabledButton
          ]}
          onPress={handleUpdateOrder}
          disabled={!deliveryStatus || deliveryStatus === order.orderStatus || order.orderStatus === 'OUT_FOR_DELIVERY'}
        >
          <Text style={[
            styles.updateButtonText, 
            (!deliveryStatus || deliveryStatus === order.orderStatus || order.orderStatus === 'OUT_FOR_DELIVERY') && styles.disabledButtonText
          ]}>
            Update Status
          </Text>
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginTop: 44,
  },
  backButton: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    fontSize: 20,
    color: '#1B5E20',
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007074',
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
    color: '#2E86AB',
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  detailText: {
    flex: 1,
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
    marginBottom: 12,
    marginTop: 16,
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
  buttonText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  activeButton: {
    backgroundColor: '#28B463',
    borderColor: '#2E86AB',
  },
  activeButtonText: {
    color: '#fff',
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
    textAlign: 'center',
  },
  updateButton: {
    backgroundColor: '#28B463',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});