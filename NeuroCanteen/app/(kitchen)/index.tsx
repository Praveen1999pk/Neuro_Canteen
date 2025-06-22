// app/delivery_orders/index.tsx
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, RefreshControl, Modal, FlatList } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { Package, ShoppingCart, Rss, Search, Filter, ArrowLeft, ArrowDown, ArrowUp, Bell } from 'lucide-react-native';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useRouter } from 'expo-router';
import React from 'react';
import SockJS from 'sockjs-client';
import { Audio } from 'expo-av';

// type PaymentFilter = 'ALL' | 'PAID' | 'NOT_PAID';
type OrderStatusFilter = 'ALL' | 'RECEIVED' | 'CONFIRMED' | 'PREPARED' | 'OUT_FOR_DELIVERY';
type RoleFilter = 'ALL' | 'Staff' | 'Patient' | 'Out Patient';

type Notification = {
  id: number;
  orderId: number;
  orderedName: string;
  itemName: string;
  quantity: number;
};

export default function DeliveryOrders() {
  const [searchQuery, setSearchQuery] = useState('');
  // const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('RECEIVED');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const previousOrdersRef = useRef<Order[]>([]);
  
  // Notification states
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Audio state
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  
  type Order = {
    orderId: number;
    orderedRole: string;
    orderedName: string;
    itemName: string;
    quantity: number;
    price: number;
    orderStatus: string;
    paymentType: string;
    paymentRecived: boolean;
    address: string;
    deliveryStatus: string;
    orderDateTime: string;
  };  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const lastOrderCountRef = useRef<number>(0);

  // Load notification sound
  useEffect(() => {
    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/inapp_notifying.wav')
        );
        setSound(sound);
        soundRef.current = sound;
      } catch (error) {
        console.error('Error loading notification sound:', error);
      }
    };

    loadSound();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  // Play notification sound
  const playNotificationSound = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.replayAsync();
      }
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  // Socket connection for real-time notifications
  useEffect(() => {
    const initSocket = () => {
      try {
        const socket = new SockJS('http://170.187.200.195:8142/order-updates');

        socket.onmessage = (event: any) => {
          const message = JSON.parse(event.data);
          const newOrder = message.payload;

          if (message.type === 'ORDER_CREATED') {
            const newNotification: Notification = {
              id: Date.now(),
              orderId: newOrder.orderId,
              orderedName: newOrder.orderedName,
              itemName: newOrder.itemName,
              quantity: newOrder.quantity,
            };
            
            setNotifications((prev) => [newNotification, ...prev]);
            
            // Play notification sound
            playNotificationSound();
            
            // Update orders list
            setOrders((prevOrders) => [newOrder, ...prevOrders]);
          } else if (message.type === 'ORDER_UPDATED') {
            setOrders((prevOrders) =>
              prevOrders.map((order) =>
                order.orderId === newOrder.orderId ? newOrder : order
              )
            );
          }
        };

        socket.onerror = (error: any) => {
          console.error('Socket connection error:', error);
        };

        return () => socket.close();
      } catch (error) {
        console.error('Error initializing socket:', error);
      }
    };

    initSocket();
  }, []);

  const dismissNotification = (notificationId: number) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
  };

  const checkForNewOrders = async () => {
    try {
      const response = await axiosInstance.get("/orders", { 
        timeout: 5000,
        params: { status: 'RECEIVED' }
      });
      
      const currentOrderCount = response.data.length;
      if (currentOrderCount > lastOrderCountRef.current) {
        // New orders detected, fetch all orders
        fetchOrders();
        // Update new orders count
        setNewOrdersCount(prev => prev + (currentOrderCount - lastOrderCountRef.current));
      }
      lastOrderCountRef.current = currentOrderCount;
    } catch (error) {
      console.error("Error checking for new orders:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/orders", { timeout: 5000 });
      const sortedOrders = response.data.sort(
        (a: Order, b: Order) => new Date(b.orderDateTime).getTime() - new Date(a.orderDateTime).getTime()
      );
      
      // Check for new orders
      if (previousOrdersRef.current.length > 0) {
        const newOrders = sortedOrders.filter(
          (newOrder: Order) => !previousOrdersRef.current.some(
            prevOrder => prevOrder.orderId === newOrder.orderId
          )
        );
        if (newOrders.length > 0 && statusFilter !== 'RECEIVED') {
          setNewOrdersCount(prev => prev + newOrders.length);
        }
      }
      
      previousOrdersRef.current = sortedOrders;
      setOrders(sortedOrders);
      lastOrderCountRef.current = sortedOrders.length;
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        console.error("Request timed out");
      } else {
        console.error("Failed to fetch orders", error);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  // Check for new orders when on waiting orders tab
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (statusFilter === 'RECEIVED') {
      // Check immediately when switching to waiting orders
      checkForNewOrders();
      
      // Then check every 5 seconds
      intervalId = setInterval(checkForNewOrders, 5000);
    }

    // Cleanup interval on unmount or when switching tabs
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [statusFilter]);

  // Reset new orders count when changing tabs
  useEffect(() => {
    setNewOrdersCount(0);
  }, [statusFilter]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders
      .filter(order => {
        const matchesSearch = (order.itemName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
          order.orderId.toString().includes(searchQuery);

        const matchesStatus = 
          (statusFilter === 'RECEIVED' && !order.orderStatus) ||
          (statusFilter === 'CONFIRMED' && order.orderStatus === 'RECEIVED') ||
          (statusFilter === 'PREPARED' && order.orderStatus === 'PREPARED') ||
          (statusFilter === 'OUT_FOR_DELIVERY' && order.orderStatus === 'OUT_FOR_DELIVERY');

        const matchesRole = roleFilter === 'ALL' ||
          (roleFilter === 'Staff' && order.orderedRole === 'Staff') ||
          (roleFilter === 'Patient' && order.orderedRole.toLowerCase() === 'patient') ||
          (roleFilter === 'Out Patient' && order.orderedRole.toLowerCase() === 'out_patient');
          
        return matchesSearch && matchesStatus && matchesRole;
      })
      .sort((a, b) => {
        // First sort by orderDateTime
        const dateComparison = new Date(b.orderDateTime).getTime() - new Date(a.orderDateTime).getTime();
        if (dateComparison !== 0) {
          return sortDirection === 'desc' ? dateComparison : -dateComparison;
        }
        
        // If dates are equal, sort by orderId
        return sortDirection === 'desc' ? b.orderId - a.orderId : a.orderId - b.orderId;
      });
  }, [orders, searchQuery, statusFilter, roleFilter, sortDirection]);

  const FilterButton = ({ title, isActive, onPress }: { title: string; isActive: boolean; onPress: () => void }) => (
    <TouchableOpacity
      style={[styles.filterButton, isActive && styles.activeFilterButton]}
      onPress={onPress}
    >
      <Text style={[styles.filterButtonText, isActive && styles.activeFilterButtonText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  // Add focus effect to refresh orders when returning to the screen
  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kitchen Dashboard</Text>
          <TouchableOpacity 
            style={styles.notificationBell}
            onPress={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={24} color="#fff" />
            {notifications.length > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{notifications.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>{filteredOrders.length} Active Orders</Text>
      </View>

      {/* Notification Modal */}
      <Modal
        visible={showNotifications}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.notificationsPanel}>
            <View style={styles.notificationsHeader}>
              <Text style={styles.notificationsTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <Text style={styles.closeButton}>×</Text>
              </TouchableOpacity>
            </View>
            
            {notifications.length === 0 ? (
              <Text style={styles.noNotificationsText}>No notifications</Text>
            ) : (
              <FlatList
                data={notifications}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.notificationItem}>
                    <View style={styles.notificationContent}>
                      <Text style={styles.notificationOrderId}>Order #{item.orderId}</Text>
                      <Text style={styles.notificationName}>Name: {item.orderedName}</Text>
                      <Text style={styles.notificationItemName}>Item: {item.itemName}</Text>
                      <Text style={styles.notificationQuantity}>Quantity: {item.quantity}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.dismissButton}
                      onPress={() => dismissNotification(item.id)}
                    >
                      <Text style={styles.dismissButtonText}>×</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity 
            style={styles.sortButton}
            onPress={() => setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc')}
          >
            <Text style={styles.sortButtonText}>
              {sortDirection === 'desc' ? '↓ Newest' : '↑ Oldest'}
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={styles.filterToggle}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color={showFilters ? "#2196F3" : "#666"} />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          {/* ... existing payment filter if any, add here ... */}

          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Role</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              <FilterButton title="All" isActive={roleFilter === 'ALL'} onPress={() => setRoleFilter('ALL')} />
              <FilterButton title="Staff" isActive={roleFilter === 'Staff'} onPress={() => setRoleFilter('Staff')} />
              <FilterButton title="Patient" isActive={roleFilter === 'Patient'} onPress={() => setRoleFilter('Patient')} />
              <FilterButton title="Out Patient" isActive={roleFilter === 'Out Patient'} onPress={() => setRoleFilter('Out Patient')} />
            </ScrollView>
          </View>
        </View>
      )}

      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.tab, statusFilter === 'RECEIVED' && styles.activeTab]}
            onPress={() => setStatusFilter('RECEIVED')}
          >
            <View style={styles.tabContent}>
            <Text style={[styles.tabText, statusFilter === 'RECEIVED' && styles.activeTabText]}>
              Waiting Orders
            </Text>
              {newOrdersCount > 0 && statusFilter !== 'RECEIVED' && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>+{newOrdersCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, statusFilter === 'CONFIRMED' && styles.activeTab]}
            onPress={() => setStatusFilter('CONFIRMED')}
          >
            <Text style={[styles.tabText, statusFilter === 'CONFIRMED' && styles.activeTabText]}>
              Confirmed Orders
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, statusFilter === 'PREPARED' && styles.activeTab]}
            onPress={() => setStatusFilter('PREPARED')}
          >
            <Text style={[styles.tabText, statusFilter === 'PREPARED' && styles.activeTabText]}>
              Prepared
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, statusFilter === 'OUT_FOR_DELIVERY' && styles.activeTab]}
            onPress={() => setStatusFilter('OUT_FOR_DELIVERY')}
          >
            <Text style={[styles.tabText, statusFilter === 'OUT_FOR_DELIVERY' && styles.activeTabText]}>
              Sent for Delivery
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView
        style={styles.orderList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2196F3']}
            tintColor="#2196F3"
          />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No orders match your filters.</Text>
        </View>
      ) : (
          filteredOrders.map((order) => (
            <Link
            key={order.orderId}
            href={{ pathname: "/kitchen_updates/[kitchenid]", params: { kitchenid: order.orderId } }}
            asChild
          >
            <TouchableOpacity style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderId}>#{order.orderId}</Text>
                  <View style={styles.statusBadge}>
                    <Package size={16} color={!order.orderStatus ? "#FF9800" : "#4CAF50"} />
                    <Text style={[
                      styles.statusText,
                      (!order.orderStatus || order.orderStatus === 'RECEIVED') && styles.waitingStatusText
                    ]}>
                      {!order.orderStatus ? "Waiting for confirmation" : 
                       order.orderStatus === 'RECEIVED' ? "Confirmed" :
                       order.orderStatus === 'PREPARED' ? "Prepared" :
                       order.orderStatus === 'OUT_FOR_DELIVERY' ? "Sent for Delivery" :
                       order.orderStatus}
                    </Text>
                  </View>
                </View>
                <Text style={styles.price}>₹{order.price}</Text>
              </View>
          
              <View style={styles.itemsContainer}>
                <Text style={styles.itemsText} numberOfLines={2}>
                  {order.itemName}
                </Text>
              </View>

              <View style={styles.orderFooter}>
                <View style={styles.footerInfo}>
                  <ShoppingCart size={16} color="#666" />
                  <Text style={styles.footerText}>{order.quantity} items</Text>
                </View>
                <Text style={[styles.roleTag, {
                  backgroundColor: order.orderedRole === "Staff" ? "#E3F2FD" : "#FFF3E0"
                }]}>
                  {order.orderedRole}
                </Text>
              </View>
            </TouchableOpacity>
          </Link>
          ))
        )}
        </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#166534',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: { 
    fontSize: 16, 
    color: '#fff',
    marginLeft: 40,
  },
  searchContainer: { 
    flexDirection: 'row', 
    padding: 16, 
    gap: 12, 
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee' 
  },
  searchInputContainer: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f5f5f5', 
    borderRadius: 8, 
    paddingHorizontal: 12,
    gap: 8
  },
  searchIcon: { 
    marginRight: 8 
  },
  searchInput: { 
    flex: 1, 
    height: 40, 
    fontSize: 16, 
    color: '#333' 
  },
  sortButton: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2196F3',
    marginLeft: 8
  },
  sortButtonText: {
    color: '#2196F3',
    fontSize: 12,
    fontWeight: '600',
  },
  filterToggle: { 
    width: 40, 
    height: 40, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#f5f5f5', 
    borderRadius: 8 
  },
  filtersContainer: { backgroundColor: '#fff', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  filterSection: { paddingHorizontal: 16, marginTop: 12 },
  filterTitle: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8 },
  filterScroll: { flexDirection: 'row' },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f5f5f5', marginRight: 8 },
  activeFilterButton: { backgroundColor: '#2E7D32' },
  filterButtonText: { fontSize: 14, color: '#666' },
  activeFilterButtonText: { color: '#fff' },
  orderList: { padding: 16 },
  orderCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  orderInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orderId: { fontSize: 16, fontWeight: '600', color: '#333' },
  statusBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#E8F5E9', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 6, 
    gap: 4 
  },
  waitingStatusBadge: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  statusText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '500',
  },
  waitingStatusText: {
    color: '#FF9800',
    fontWeight: '500',
  },
  price: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  itemsContainer: { marginBottom: 12 },
  itemsText: { fontSize: 15, color: '#666', lineHeight: 22 },
  orderFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 14, color: '#666' },
  roleTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontSize: 12, fontWeight: '500', color: '#333' },
  tabContainer: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  activeTab: {
    backgroundColor: '#2E7D32',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
  orderStatusContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  orderStatusText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: '#FF9800',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
  notificationBell: {
    marginLeft: 'auto',
    marginRight: 10,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF4757',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationsPanel: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    width: '85%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  notificationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  notificationsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  closeButton: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E74C3C',
    padding: 5,
  },
  noNotificationsText: {
    fontSize: 16,
    color: '#95A5A6',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3498DB',
  },
  notificationContent: {
    flex: 1,
    marginRight: 10,
  },
  notificationOrderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  notificationName: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 2,
  },
  notificationItemName: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 2,
  },
  notificationQuantity: {
    fontSize: 14,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  dismissButton: {
    padding: 8,
    backgroundColor: '#E74C3C',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
