import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  TextInput
} from 'react-native';
import {
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  Package,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ArrowLeft,
  Search
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import axiosInstance from '../api/axiosInstance';

interface Order {
  orderId: number;
  orderedRole: string;
  orderedName: string;
  orderedUserId: string;
  itemName: string;
  quantity: number;
  category: string;
  price: number;
  orderStatus: string | null;
  paymentType: 'COD' | 'Online' | string; // Extend as needed
  paymentRecived: boolean;
  paymentStatus: string | null;
  orderDateTime: string; // Or `Date` if you're parsing it
  deliveryStatus: string | null;
  address: string;
  phoneNo: string | null;
}

export default function OrderHistoryScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [sortNewest, setSortNewest] = React.useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const [orders, setorders] = useState<Order[]>([]);
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await axiosInstance.get<Order[]>('/orders');
        const data = response.data.filter(order => order.orderedRole === 'Dietitian');
        setorders(data);
      } catch (error) {
        console.error('Failed to fetch rooms:', error);
      }
    };

    fetchRooms();
  }, [sortNewest]);
  


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const sortedAndFilteredOrders = [...orders]
    .filter(order => 
      order.orderedUserId.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const dateA = new Date(a.orderDateTime).getTime();
      const dateB = new Date(b.orderDateTime).getTime();
      return sortNewest ? dateB - dateA : dateA - dateB;
    });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order History</Text>
        <TouchableOpacity 
          style={styles.sortButton}
          onPress={() => setSortNewest(!sortNewest)}
        >
          <Text style={styles.sortButtonText}>
            {sortNewest ? 'Latest First' : 'Oldest First'}
          </Text>
          {sortNewest ? 
            <ArrowDown size={14} color="#E8F5E9" /> : 
            <ArrowUp size={14} color="#E8F5E9" />
          }
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by UHID..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#64748b"
          />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {sortedAndFilteredOrders.map((order, index) => (
          <Animated.View 
            key={order.orderId} 
            style={[
              styles.orderCard,
              { 
                opacity: fadeAnim,
                transform: [{ 
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 20 * index]
                  }) 
                }]
              }
            ]}
          >
            <View style={styles.orderHeader}>
              <View style={styles.orderIdContainer}>
                <Text style={styles.orderIdLabel}>Order #{order.orderId}</Text>
                <Text style={styles.orderCategory}>{order.phoneNo}</Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{order.orderedUserId}</Text>
              </View>
            </View>

            <View style={styles.orderContent}>
              <View style={styles.infoRow}>
                <Package size={18} color="#2E7D32" />
                <Text style={styles.infoText}>
                  {order.itemName} ({order.quantity} items)
                </Text>
              </View>

              <View style={styles.infoRow}>
                <DollarSign size={18} color="#2E7D32" />
                <Text style={styles.infoText}>
                  ₹{order.price.toFixed(2)}
                </Text>
                <View style={styles.paymentBadge}>
                  <Text style={styles.paymentText}>{order.orderStatus}</Text>
                </View>
              </View>

              <View style={styles.timeContainer}>
                <View style={styles.infoRow}>
                  <Calendar size={16} color="#2E7D32" />
                  <Text style={styles.timeText}>
                    {formatDate(order.orderDateTime)}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Clock size={16} color="#2E7D32" />
                  <Text style={styles.timeText}>
                    {formatTime(order.orderDateTime)}
                  </Text>
                </View>
              </View>

              {order.address && (
                <View style={styles.addressRow}>
                  <MapPin size={18} color="#2E7D32" />
                  <Text style={styles.addressText}>{order.address}</Text>
                </View>
              )}
            </View>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    backgroundColor: '#2E7D32',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerContent: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    marginTop: 4,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sortButtonText: {
    color: '#E8F5E9',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 6,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderIdContainer: {
    flex: 1,
  },
  orderIdLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  orderCategory: {
    fontSize: 14,
    color: '#2E7D32',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
  orderContent: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#1B5E20',
    marginLeft: 12,
    flex: 1,
    fontWeight: '500',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  timeText: {
    fontSize: 14,
    color: '#2E7D32',
    marginLeft: 8,
    fontWeight: '500',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8F5E9',
  },
  addressText: {
    fontSize: 14,
    color: '#1B5E20',
    marginLeft: 12,
    flex: 1,
  },
  paymentBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  paymentText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F8E9',
    paddingVertical: 12,
    borderRadius: 16,
  },
  detailsButtonText: {
    color: '#2E7D32',
    fontWeight: '600',
    fontSize: 14,
    marginRight: 4,
  },
  backButton: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '500',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#0f172a',
  },
});