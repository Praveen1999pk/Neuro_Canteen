// app/delivery_orders/index.tsx
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, RefreshControl, Alert } from 'react-native';
import { Link } from 'expo-router';
import { Package, ShoppingCart, Wallet, Search, Filter, ArrowLeft, ListOrdered } from 'lucide-react-native';
import { useState, useMemo, useEffect, useRef } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useRouter } from 'expo-router';
import OrderSelectionModal from '../../components/OrderSelectionModal';
import React from 'react';

type PaymentFilter = 'ALL' | 'PAID' | 'NOT_PAID';
type OrderStatusFilter = 'ALL' | 'WAITING' | 'CONFIRMED' | 'OutForDelivery' | 'Cancelled' | 'Delivered';
type RoleFilter = 'ALL' | 'Staff' | 'Patient';

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
  phoneNo?: string;
  deliveryPriority?: number;
};

export default function DeliveryOrders() {
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('WAITING');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [showPrioritySlots, setShowPrioritySlots] = useState(false);
  const [prioritySlots, setPrioritySlots] = useState<(Order | null)[]>(Array(10).fill(null));
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const previousOrdersRef = useRef<Order[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const lastOrderCountRef = useRef<number>(0);

  const checkForNewOrders = async () => {
    try {
      const response = await axiosInstance.get("/orders/out-for-delivery", { 
        timeout: 5000,
        params: { status: 'WAITING' }
      });
      
      const currentOrderCount = response.data.length;
      if (currentOrderCount > lastOrderCountRef.current) {
        // New orders detected, fetch all orders
        fetchOrders();
        // Update new orders count
        const newCount = currentOrderCount - lastOrderCountRef.current;
        if (newCount > 0 && statusFilter !== 'WAITING') {
          setNewOrdersCount(prev => prev + newCount);
        }
      }
      lastOrderCountRef.current = currentOrderCount;
    } catch (error) {
      console.error("Error checking for new orders:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/orders/out-for-delivery", { timeout: 5000 });
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
        if (newOrders.length > 0 && statusFilter !== 'WAITING') {
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

    if (statusFilter === 'WAITING') {
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
    if (statusFilter === 'WAITING') {
      setNewOrdersCount(0);
    }
  }, [statusFilter]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, []);

  const updateDeliveryStatus = async (orderId: number, deliveryStatus: string) => {
    try {
      await axiosInstance.patch(`/orders/${orderId}/delivery-status`, null, {
        params: { deliveryStatus }
      });
      fetchOrders();
    } catch (error) {
      console.error("Error updating delivery status:", error);
    }
  };

  const updatePaymentReceived = async (orderId: number, paymentReceived: boolean) => {
    try {
      await axiosInstance.patch(`/orders/${orderId}/payment-received`, null, {
        params: { paymentReceived }
      });
      fetchOrders();
    } catch (error) {
      console.error("Error updating payment received:", error);
    }
  };

  const handlePrioritySlotPress = (slotIndex: number) => {
    const availableOrders = orders.filter(order => 
      order.deliveryStatus === 'OutForDelivery' && 
      !prioritySlots.some(slot => slot?.orderId === order.orderId)
    );

    if (availableOrders.length === 0) {
      Alert.alert('No Orders Available', 'No Out for Delivery orders available to assign.');
      return;
    }

    setSelectedSlotIndex(slotIndex);
    setIsModalVisible(true);
  };

  const handleOrderSelect = (order: Order) => {
    if (selectedSlotIndex !== null) {
      const newPrioritySlots = [...prioritySlots];
      newPrioritySlots[selectedSlotIndex] = order;
      setPrioritySlots(newPrioritySlots);
      setIsModalVisible(false);
      setSelectedSlotIndex(null);
    }
  };

  const removeFromPrioritySlot = (slotIndex: number) => {
    const newPrioritySlots = [...prioritySlots];
    newPrioritySlots[slotIndex] = null;
    setPrioritySlots(newPrioritySlots);
  };

  const filteredOrders = useMemo(() => {
    return orders
      .filter(order => {
        const matchesSearch = (order.itemName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
          order.orderId.toString().includes(searchQuery);

        const matchesPayment = paymentFilter === 'ALL' ||
          (paymentFilter === 'PAID' && order.paymentRecived === true) ||
          (paymentFilter === 'NOT_PAID' && !order.paymentRecived);

        const matchesStatus = 
          (statusFilter === 'WAITING' && !order.deliveryStatus) ||
          (statusFilter === 'CONFIRMED' && order.deliveryStatus === 'OrderReceived') ||
          (statusFilter === 'OutForDelivery' && order.deliveryStatus === 'OutForDelivery') ||
          (statusFilter === 'Cancelled' && order.deliveryStatus === 'Cancelled') ||
          (statusFilter === 'Delivered' && order.deliveryStatus === 'Delivered');

        const matchesRole = roleFilter === 'ALL' ||
          (roleFilter === 'Staff' && order.orderedRole === 'Staff') ||
          (roleFilter === 'Patient' && order.orderedRole.toLowerCase() === 'patient');
          
        return matchesSearch && matchesPayment && matchesStatus && matchesRole;
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
  }, [orders, searchQuery, paymentFilter, statusFilter, roleFilter, sortDirection]);

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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.fullScrollView} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Delivery Dashboard</Text>
          </View>
          <Text style={styles.headerSubtitle}>{filteredOrders.length} Active Orders</Text>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search orders..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <View style={styles.filterButtonsContainer}>
            <TouchableOpacity 
              style={styles.sortButton}
              onPress={() => setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc')}
            >
              <Text style={styles.sortButtonText}>
                {sortDirection === 'desc' ? '↓ Newest' : '↑ Oldest'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.filterToggle}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Filter size={20} color={showFilters ? "#2196F3" : "#666"} />
            </TouchableOpacity>
          </View>
        </View>

        {showFilters && (
          <View style={styles.filtersContainer}>
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Payment Status</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                <FilterButton title="All" isActive={paymentFilter === 'ALL'} onPress={() => setPaymentFilter('ALL')} />
                <FilterButton title="Paid" isActive={paymentFilter === 'PAID'} onPress={() => setPaymentFilter('PAID')} />
                <FilterButton title="Not Paid" isActive={paymentFilter === 'NOT_PAID'} onPress={() => setPaymentFilter('NOT_PAID')} />
              </ScrollView>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Role</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                <FilterButton title="All" isActive={roleFilter === 'ALL'} onPress={() => setRoleFilter('ALL')} />
                <FilterButton title="Staff" isActive={roleFilter === 'Staff'} onPress={() => setRoleFilter('Staff')} />
                <FilterButton title="Patient" isActive={roleFilter === 'Patient'} onPress={() => setRoleFilter('Patient')} />
              </ScrollView>
            </View>
          </View>
        )}

        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.tab, statusFilter === 'WAITING' && styles.activeTab]}
              onPress={() => {
                setStatusFilter('WAITING');
                setShowPrioritySlots(false);
                setNewOrdersCount(0);
              }}
            >
              <View style={styles.tabContent}>
                <Text style={[styles.tabText, statusFilter === 'WAITING' && styles.activeTabText]}>
                  Waiting Orders
                </Text>
                {newOrdersCount > 0 && statusFilter !== 'WAITING' && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>+{newOrdersCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, statusFilter === 'CONFIRMED' && styles.activeTab]}
              onPress={() => {
                setStatusFilter('CONFIRMED');
                setShowPrioritySlots(false);
              }}
            >
              <Text style={[styles.tabText, statusFilter === 'CONFIRMED' && styles.activeTabText]}>
                Confirmed Delivery
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, statusFilter === 'OutForDelivery' && styles.activeTab]}
              onPress={() => setStatusFilter('OutForDelivery')}
            >
              <Text style={[styles.tabText, statusFilter === 'OutForDelivery' && styles.activeTabText]}>
                Out for Delivery
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, statusFilter === 'Delivered' && styles.activeTab]}
              onPress={() => {
                setStatusFilter('Delivered');
                setShowPrioritySlots(false);
              }}
            >
              <Text style={[styles.tabText, statusFilter === 'Delivered' && styles.activeTabText]}>
                Delivered
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, statusFilter === 'Cancelled' && styles.activeTab]}
              onPress={() => {
                setStatusFilter('Cancelled');
                setShowPrioritySlots(false);
              }}
            >
              <Text style={[styles.tabText, statusFilter === 'Cancelled' && styles.activeTabText]}>
                Cancelled
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {statusFilter === 'OutForDelivery' && (
          <View style={styles.prioritySection}>
            <TouchableOpacity 
              style={styles.priorityToggle}
              onPress={() => setShowPrioritySlots(!showPrioritySlots)}
            >
              <ListOrdered size={20} color="#1B5E20" />
              <Text style={styles.priorityToggleText}>
                {showPrioritySlots ? 'Hide Priority Slots' : 'Show Priority Slots'}
              </Text>
            </TouchableOpacity>

            {showPrioritySlots && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.prioritySlotsContainer}>
                {prioritySlots.map((order, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.prioritySlot}
                    onPress={() => order ? removeFromPrioritySlot(index) : handlePrioritySlotPress(index)}
                  >
                    {order ? (
                      <View style={styles.prioritySlotContent}>
                        <Text style={styles.prioritySlotNumber}>#{order.orderId}</Text>
                        <Text style={styles.prioritySlotAddress} numberOfLines={2}>
                          {order.address}
                        </Text>
                        <TouchableOpacity 
                          style={styles.removeButton}
                          onPress={() => removeFromPrioritySlot(index)}
                        >
                          <Text style={styles.removeButtonText}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.emptySlot}>
                        <Text style={styles.emptySlotText}>Slot {index + 1}</Text>
                        <Text style={styles.emptySlotSubtext}>Tap to add order</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text>Loading orders...</Text>
          </View>
        ) : filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No orders found</Text>
          </View>
        ) : (
          <View style={styles.orderList}>
            {filteredOrders.map((order) => (
              <Link
                key={order.orderId}
                href={{ pathname: "/delivery_orders/[orderId]", params: { orderId: order.orderId } }}
                asChild
              >
                <TouchableOpacity style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <View style={styles.orderInfo}>
                      <Text style={styles.orderId}>#{order.orderId}</Text>
                      <View style={[
                        styles.statusBadge,
                        (!order.deliveryStatus || order.deliveryStatus === 'OrderReceived') && styles.waitingStatusBadge,
                        order.deliveryStatus === 'OutForDelivery' && styles.outForDeliveryBadge,
                        order.deliveryStatus === 'Delivered' && styles.deliveredBadge,
                        order.deliveryStatus === 'Cancelled' && styles.cancelledBadge
                      ]}>
                        <Package size={16} color={
                          !order.deliveryStatus || order.deliveryStatus === 'OrderReceived' ? "#FF9800" :
                          order.deliveryStatus === 'OutForDelivery' ? "#2196F3" :
                          order.deliveryStatus === 'Delivered' ? "#4CAF50" :
                          order.deliveryStatus === 'Cancelled' ? "#F44336" : "#4CAF50"
                        } />
                        <Text style={[
                          styles.statusText,
                          (!order.deliveryStatus || order.deliveryStatus === 'OrderReceived') && styles.waitingStatusText,
                          order.deliveryStatus === 'OutForDelivery' && styles.outForDeliveryText,
                          order.deliveryStatus === 'Delivered' && styles.deliveredText,
                          order.deliveryStatus === 'Cancelled' && styles.cancelledText
                        ]}>
                          {!order.deliveryStatus ? "Waiting for confirmation" : 
                           order.deliveryStatus === 'OrderReceived' ? "Confirmed" :
                           order.deliveryStatus === 'OutForDelivery' ? "Out for Delivery" :
                           order.deliveryStatus === 'Delivered' ? "Delivered" :
                           order.deliveryStatus === 'Cancelled' ? "Cancelled" :
                           order.deliveryStatus}
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
                    <View style={styles.footerInfo}>
                      <Wallet size={16} color="#666" />
                      <Text style={styles.footerText}>
                        {order.paymentRecived ? "Paid" : "Pending"}
                      </Text>
                    </View>
                    <Text style={[styles.roleTag, {
                      backgroundColor: order.orderedRole === "Staff" ? "#E3F2FD" : "#FFF3E0"
                    }]}>
                      {order.orderedRole}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Link>
            ))}
          </View>
        )}
      </ScrollView>

      <OrderSelectionModal
        isVisible={isModalVisible}
        orders={orders.filter(order => 
          order.deliveryStatus === 'OutForDelivery' && 
          !prioritySlots.some(slot => slot?.orderId === order.orderId)
        )}
        onSelect={handleOrderSelect}
        onClose={() => setIsModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  fullScrollView: { flex: 1 },
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
  searchContainer: { flexDirection: 'row', padding: 16, gap: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  searchInputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 8, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 40, fontSize: 16, color: '#333' },
  filterButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortButton: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  sortButtonText: {
    color: '#2196F3',
    fontSize: 12,
    fontWeight: '600',
  },
  filterToggle: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 8 },
  filtersContainer: {
    backgroundColor: '#fff',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterSection: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f5f5f5', marginRight: 8 },
  activeFilterButton: { backgroundColor: '#2E7D32' },
  filterButtonText: { fontSize: 14, color: '#666' },
  activeFilterButtonText: { color: '#fff' },
  orderList: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  waitingStatusBadge: {
    backgroundColor: '#FFF3E0',
  },
  outForDeliveryBadge: {
    backgroundColor: '#E3F2FD',
  },
  deliveredBadge: {
    backgroundColor: '#E8F5E9',
  },
  cancelledBadge: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  waitingStatusText: {
    color: '#FF9800',
  },
  outForDeliveryText: {
    color: '#1976D2',
  },
  deliveredText: {
    color: '#2E7D32',
  },
  cancelledText: {
    color: '#D32F2F',
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
  itemsContainer: {
    marginBottom: 12,
  },
  itemsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
  },
  roleTag: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
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
  prioritySection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  priorityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 12,
  },
  priorityToggleText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#1B5E20',
    fontWeight: '500',
  },
  prioritySlotsContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  prioritySlot: {
    width: 150,
    height: 120,
    marginRight: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  prioritySlotContent: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f8f9fa',
  },
  prioritySlotNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B5E20',
    marginBottom: 4,
  },
  prioritySlotAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  removeButton: {
    backgroundColor: '#ffebee',
    padding: 6,
    borderRadius: 4,
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#d32f2f',
    fontSize: 12,
    fontWeight: '500',
  },
  emptySlot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  emptySlotText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  emptySlotSubtext: {
    fontSize: 12,
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
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
});
