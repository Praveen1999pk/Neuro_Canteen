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
import { Clock, CircleCheck as CheckCircle2, Circle as XCircle, CircleAlert as AlertCircle, ArrowLeft } from 'lucide-react-native';
import axiosInstance from '../api/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'expo-router';

type OrderItem = {
  name: string;
  quantity: number;
  price: number;
};

type Order = {
  orderId: number; 
  orderedName: string;
  itemName: string;
  quantity: number;
  price: number;
  orderStatus: string | null;
  paymentType: string;
  paymentStatus: string | null;
  orderDateTime: string;
  address: string;
  category?: string;
  deliveryStatus?: string | null;
  orderedRole?: string;
  orderedUserId?: string;
  paymentRecived?: boolean;
  phoneNo?: string | null;
};

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [username, setUsername] = useState('');
  const router = useRouter();

  useEffect(() => {
    getUsernameFromToken();
  }, []);

  const getUsernameFromToken = async () => {
    try {
      const token = await AsyncStorage.getItem('jwtToken');
      if (token) {
        const decoded: any = jwtDecode(token);
        const user = decoded.sub || '';
        setUsername(user);
        await fetchOrders(token, user);
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      setLoading(false); 
    }
  };

  const fetchOrders = async (token: string, user: string) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const userOrders = response.data
        .filter((order: any) => {
          if (!order.orderedName) return false;
          return order.orderedName.trim().toLowerCase() === user.trim().toLowerCase();
        })
        .sort((a: Order, b: Order) => {
          const dateA = new Date(a.orderDateTime).getTime();
          const dateB = new Date(b.orderDateTime).getTime();
          return dateB - dateA; // Sort newest first
        });

      setOrders(userOrders);
      
      if (userOrders.length === 0) {
        console.log('No orders found for user:', user);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const parseOrderItems = (order: Order): OrderItem[] => {
    if (!order.itemName) return [];
    
    const itemNames = order.itemName.split('\n').filter(name => name.trim() !== '');
    const pricePerItem = itemNames.length > 0 ? order.price / itemNames.length : 0;
    const quantityPerItem = itemNames.length > 0 ? order.quantity / itemNames.length : 0;
    
    return itemNames.map(name => ({
      name: name.trim(),
      quantity: Math.round(quantityPerItem * 100) / 100,
      price: Math.round(pricePerItem * 100) / 100
    }));
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

  const renderOrderItem = ({ item }: { item: Order }) => {
    const orderItems = parseOrderItems(item);
    
    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>Order #{item.orderId}</Text>
          <Text style={styles.orderDate}>{formatDate(item.orderDateTime)}</Text>
        </View>
        
        <View style={styles.itemsTable}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.itemColumn]}>Item</Text>
            <Text style={[styles.tableHeaderText, styles.qtyColumn]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.priceColumn]}>Price</Text>
          </View>
          
          {orderItems.map((foodItem, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.itemColumn]}>{foodItem.name}</Text>
              <Text style={[styles.tableCell, styles.qtyColumn]}>{foodItem.quantity}</Text>
              <Text style={[styles.tableCell, styles.priceColumn]}>₹{foodItem.price.toFixed(2)}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.orderFooter}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Total:</Text>
            <Text style={styles.price}>₹{item.price.toFixed(2)}</Text>
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
  };

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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order History</Text>
      </View>
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item, index) => item?.orderId ? String(item.orderId) : `order-${index}`}
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
    backgroundColor: '#F5F5F5',
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
  itemsTable: {
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableHeaderText: {
    fontWeight: '600',
    color: '#333',
  },
  tableRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  tableCell: {
    fontSize: 14,
    color: '#555',
  },
  itemColumn: {
    flex: 3,
  },
  qtyColumn: {
    flex: 1,
    textAlign: 'right',
  },
  priceColumn: {
    flex: 1.5,
    textAlign: 'right',
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
  header: {
    backgroundColor: '#2E7D32',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
  },
  backButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
});