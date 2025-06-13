// app/delivery_orders/index.tsx
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { Link } from 'expo-router';
import { Package, ShoppingCart, Wallet, Search, Filter, ArrowLeft } from 'lucide-react-native';
import { useState, useMemo, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useRouter } from 'expo-router';

type PaymentFilter = 'ALL' | 'PAID' | 'NOT_PAID';
type OrderStatusFilter = 'ALL' | 'OrderReceived' | 'OutForDelivery' | 'Cancelled' | 'Delivered';

export default function DeliveryOrders() {
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('OrderReceived');
  const [showFilters, setShowFilters] = useState(false);
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
  };
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/orders/out-for-delivery", { timeout: 5000 });
      const sortedOrders = response.data.sort(
        (a: Order, b: Order) => new Date(b.orderDateTime).getTime() - new Date(a.orderDateTime).getTime()
      );
      setOrders(sortedOrders);
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        console.error("Request timed out");
      } else {
        console.error("Failed to fetch orders", error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = (order.itemName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        order.orderId.toString().includes(searchQuery);

      const matchesPayment = paymentFilter === 'ALL' ||
        (paymentFilter === 'PAID' && order.paymentRecived === true) ||
        (paymentFilter === 'NOT_PAID' && !order.paymentRecived);

      const matchesStatus = statusFilter === 'ALL' ||
        (statusFilter === 'OutForDelivery' && order.deliveryStatus === "OutForDelivery") ||
        (statusFilter === 'Cancelled' && order.deliveryStatus === "Cancelled") ||
        (statusFilter === 'OrderReceived' && (order.deliveryStatus === "OrderReceived" || order.deliveryStatus === null)) ||
        (statusFilter === 'Delivered' && order.deliveryStatus === "Delivered");
        
      return matchesSearch && matchesPayment && matchesStatus;
    });
  }, [orders, searchQuery, paymentFilter, statusFilter]);

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
        <TouchableOpacity 
          style={styles.filterToggle}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color={showFilters ? "#2196F3" : "#666"} />
        </TouchableOpacity>
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
        </View>
      )}

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          <FilterButton 
            title="Order Received" 
            isActive={statusFilter === 'OrderReceived'} 
            onPress={() => setStatusFilter('OrderReceived')} 
          />
          <FilterButton 
            title="Out for Delivery" 
            isActive={statusFilter === 'OutForDelivery'} 
            onPress={() => setStatusFilter('OutForDelivery')} 
          />
          <FilterButton 
            title="Delivered" 
            isActive={statusFilter === 'Delivered'} 
            onPress={() => setStatusFilter('Delivered')} 
          />
          <FilterButton 
            title="Cancelled" 
            isActive={statusFilter === 'Cancelled'} 
            onPress={() => setStatusFilter('Cancelled')} 
          />
        </ScrollView>
      </View>

      {loading ? (
        <View style={{ padding: 20 }}>
          <Text style={{ textAlign: 'center', fontSize: 16 }}>Loading orders...</Text>
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={{ padding: 20 }}>
          <Text style={{ textAlign: 'center', color: '#888' }}>No orders match your filters.</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.orderList}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchOrders} />}
        >
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
                    <View style={styles.statusBadge}>
                      <Package size={16} color="#4CAF50" />
                      <Text style={[
                        styles.statusText,
                        !order.deliveryStatus && styles.waitingStatusText,
                        order.deliveryStatus === "OrderReceived" && styles.orderReceivedStatusText,
                        order.deliveryStatus === "Cancelled" && styles.cancelledStatusText
                      ]}>
                        {order.deliveryStatus || "Waiting for confirmation"}
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
        </ScrollView>
      )}
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
  searchContainer: { flexDirection: 'row', padding: 16, gap: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  searchInputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 8, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 40, fontSize: 16, color: '#333' },
  filterToggle: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 8 },
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
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
  statusText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#4CAF50',
  },
  waitingStatusText: {
    color: '#FF9800', // Orange color for waiting status
  },
  orderReceivedStatusText: {
    color: '#2196F3', // Blue color for OrderReceived status
  },
  cancelledStatusText: {
    color: '#FF6B6B', // Light red color for Cancelled status
  },
  price: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  itemsContainer: { marginBottom: 12 },
  itemsText: { fontSize: 15, color: '#666', lineHeight: 22 },
  orderFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 14, color: '#666' },
  roleTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontSize: 12, fontWeight: '500', color: '#333' },
  tabsContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabsScroll: {
    paddingHorizontal: 16,
  },
});
