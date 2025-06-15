import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MapPin, Phone, Calendar, Package, IndianRupee, ArrowLeft } from 'lucide-react-native';
import axiosInstance from '../api/axiosInstance';

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
        const orderData: Order = response.data;
        setOrder(orderData);
        setDeliveryStatus(orderData.orderStatus ?? '');
      } catch (error) {
        console.error('Error fetching order:', error);
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
  const totalPrice = order.price;

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
                {order.paymentRecived ? 'Received' : 'Pending'} ({order.paymentType})
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          {items.map((item, index) => (
            <Text key={index} style={styles.itemText}>• {item}</Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Total Price</Text>
          <Text style={styles.priceText}>₹{totalPrice.toFixed(2)}</Text>
        </View>

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

        <View style={styles.section}>
          <Text style={styles.label}>Update Status</Text>
          <View style={styles.buttonGroup}>
            {['RECEIVED', 'PREPARED', 'OUT_FOR_DELIVERY'].map((status) => {
              const isDisabled = 
                (status === 'PREPARED' && order.orderStatus !== 'RECEIVED') ||
                (status === 'OUT_FOR_DELIVERY' && order.orderStatus !== 'PREPARED');

              return (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.button, 
                    deliveryStatus === status && styles.activeButton,
                    isDisabled && styles.disabledButton
                  ]}
                  onPress={() => {
                    if (!isDisabled) {
                      setDeliveryStatus(status);
                    }
                  }}
                  disabled={isDisabled}
                >
                  <Text style={[
                    styles.buttonText, 
                    deliveryStatus === status && styles.activeButtonText,
                    isDisabled && styles.disabledButtonText
                  ]}>
                    {status === 'RECEIVED' ? 'Confirm Order' : 
                     status === 'PREPARED' ? 'Prepared' : 
                     'Sent for Delivery'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity style={styles.updateButton} onPress={handleUpdateOrder}>
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
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2E7D32',
    marginTop: 4,
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
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  disabledButtonText: {
    color: '#aaa',
  },
  disabledText: {
    fontSize: 14,
    color: '#888',
    marginTop: -8,
    marginBottom: 12,
    fontStyle: 'italic',
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