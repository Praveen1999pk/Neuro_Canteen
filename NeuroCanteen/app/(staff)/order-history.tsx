import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, CircleCheck as CheckCircle2, Circle as XCircle, CircleAlert as AlertCircle } from 'lucide-react-native';
import axiosInstance from '../api/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

type Order = {
  id: number;
  orderedName: string;
  itemName: string;
  quantity: number;
  price: number;
  orderStatus: string | null;
  paymentType: string;
  paymentStatus: string | null;
  orderDateTime: string;
  address: string;
};

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    getUsernameFromToken();
  }, []);

const getUsernameFromToken = async () => {
  try {
    const token = await AsyncStorage.getItem('jwtToken');
    if (token) {
      console.log('Token:', token);
      const decoded: any = jwtDecode(token);
      const user = decoded.sub || '';
      setUsername(user);
      await fetchOrders(token, user); // Add await here
    }
  } catch (error) {
    console.error('Error decoding token:', error);
    setLoading(false); 
  }
};

const fetchOrders = async (token: string, user: string) => {
  setLoading(true);
  console.log('Fetching orders for user:', user); // Debug log
  try {
    const response = await axiosInstance.get(`/orders`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('Full API response:', response.data); // Debug log

    // Improved filtering with null checks
    const userOrders = response.data.filter((order: Order) => {
      if (!order.orderedName) return false;
      return order.orderedName.trim().toLowerCase() === user.trim().toLowerCase();
    });

    console.log('Filtered orders:', userOrders); // Debug log
    setOrders(userOrders);
    
    if (userOrders.length === 0) {
      console.log('No orders found for user:', user);
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
    // Add error state handling if needed
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};
  const onRefresh = async () => {
    setRefreshing(true);
    const token = await AsyncStorage.getItem('jwtToken');
    if (token && username) {
      fetchOrders(token, username);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 size={20} color="#4CAF50" />;
      case 'Cancelled':
        return <XCircle size={20} color="#F44336" />;
      case 'Processing':
        return <Clock size={20} color="#2196F3" />;
      default:
        return <AlertCircle size={20} color="#FF9800" />;
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'Completed':
        return '#4CAF50';
      case 'Cancelled':
        return '#F44336';
      case 'Processing':
        return '#2196F3';
      default:
        return '#FF9800';
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>Order #{item.id}</Text>
        <Text style={styles.orderDate}>{formatDate(item.orderDateTime)}</Text>
      </View>
      
      <View style={styles.orderDetails}>
        <Text style={styles.itemName} numberOfLines={2}>{item.itemName}</Text>
        <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
      </View>
      
      <View style={styles.orderFooter}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Total:</Text>
          <Text style={styles.price}>₹{item.price}</Text>
        </View>
        
        <View style={styles.statusContainer}>
          <View style={styles.statusIconContainer}>
            {getStatusIcon(item.orderStatus)}
          </View>
          <Text 
            style={[
              styles.statusText, 
              { color: getStatusColor(item.orderStatus) }
            ]}
          >
            {item.orderStatus || 'Pending'}
          </Text>
        </View>
      </View>
      
      <View style={styles.paymentInfo}>
        <Text style={styles.paymentLabel}>Payment Method:</Text>
        <Text style={styles.paymentValue}>{item.paymentType}</Text>
        
        <Text style={styles.paymentLabel}>Payment Status:</Text>
        <Text 
          style={[
            styles.paymentValue,
            { 
              color: item.paymentStatus === 'Completed' ? '#4CAF50' : 
                    item.paymentStatus === 'Failed' ? '#F44336' : '#FF9800' 
            }
          ]}
        >
          {item.paymentStatus || 'Pending'}
        </Text>
      </View>
      
      <View style={styles.addressContainer}>
        <Text style={styles.addressLabel}>Delivery Address:</Text>
        <Text style={styles.addressValue}>{item.address}</Text>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A8F47" />
        <Text style={styles.loadingText}>Loading your orders...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item, index) => item?.id ? String(item.id) : `order-${index}`}

        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No orders found</Text>
              <Text style={styles.emptyText}>You haven't placed any orders yet</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={onRefresh}
              >
                <Text style={styles.retryButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}




const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4A8F47',
  },
  listContent: {
    padding: 15,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  orderDetails: {
    marginBottom: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 15,
    color: '#666',
    marginRight: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A8F47',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconContainer: {
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  paymentInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666',
    width: '40%',
    marginBottom: 4,
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '500',
    width: '60%',
    marginBottom: 4,
  },
  addressContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  addressLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  addressValue: {
    fontSize: 14,
    color: '#333',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#4A8F47',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '500',
  },
});