import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform
} from 'react-native';
import {
  Calendar,
  Clock,
  MapPin,
  Package,
  ArrowUp,
  ArrowDown,
  ChevronRight
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import axiosInstance from '../api/axiosInstance';
import { useNavigation, useRoute } from '@react-navigation/native';


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

  const route = useRoute();
  const {patientuhid} = route.params as {patientuhid: string};
  console.log(patientuhid);

  const [orders,setorders] = useState<Order[]>([])
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
    const response = await axiosInstance.get('/orders/filter', {
      params: {
        orderedRole: 'patient',
        orderedUserId: patientuhid
      }
    });
        const data = response.data;
        console.log(data)
        setorders(data)
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

  const sortedOrders = [...orders].sort((a, b) => {
    const dateA = new Date(a.orderDateTime).getTime();
    const dateB = new Date(b.orderDateTime).getTime();
    return sortNewest ? dateB - dateA : dateA - dateB;
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Orders - {patientuhid}</Text>
          <Text style={styles.headerSubtitle}>Track Patient Orders</Text>
        </View>
        
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

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {sortedOrders.map((order, index) => (
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
                <Text style={styles.orderCategory}>{order.orderedUserId}</Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{order.orderedName}</Text>
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
            
            {/* <TouchableOpacity style={styles.detailsButton}>
              <Text style={styles.detailsButtonText}>View Details</Text>
              <ChevronRight size={16} color="#2E7D32" />
            </TouchableOpacity> */}
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
    backgroundColor: '#1B5E20',
    paddingTop: Platform.OS === 'web' ? 40 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E8F5E9',
    opacity: 0.9,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderIdContainer: {
    flex: 1,
  },
  orderIdLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B5E20',
    marginBottom: 4,
  },
  orderCategory: {
    fontSize: 14,
    color: '#2E7D32',
  },
  statusBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2E7D32',
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
  }
});