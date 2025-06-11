import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert
} from 'react-native';
import { DataTable } from 'react-native-paper';
import axios from 'axios';
import axiosInstance from '../api/axiosInstance';

type Order = {
  orderId: string;
  orderedUserId: string;
  orderedRole: string;
  price: number;
  paymentType: string;
  paymentRecived: boolean;
  createdAt: string;
};

type Summary = {
  orderedUserId: string;
  orderedRole: string;
  totalPrice: number;
  paymentType: string;
  allPaid: boolean;
  orderIds: string[];
  lastUpdated: string;
};

type CreditPayment = {
  _id: string;
  userId: string;
  role: string;
  amount: number;
  orders: string;
  paymentType: string;
  paid: boolean;
  createdAt: string;
};

const PaymentIn = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [completedPayments, setCompletedPayments] = useState<CreditPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingPayment, setProcessingPayment] = useState<{ [userId: string]: boolean }>({});
  const [roleFilter, setRoleFilter] = useState<'Staff' | 'Patient'>('Staff');
  const [searchTerm, setSearchTerm] = useState('');
  const [tab, setTab] = useState<'Pending' | 'Completed'>('Pending');

  useEffect(() => {
    fetchData();
  }, [roleFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchOrders(), fetchCompletedPayments()]);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to fetch payment data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axiosInstance.get<Order[]>('/orders/filter/Credit', {
        params: {
          orderedRole: roleFilter,
          paymentType: 'CREDIT',
          paymentStatus: 'PENDING'
        }
      });

      if (Array.isArray(response.data)) {
        setOrders(response.data);
        summarizeOrders(response.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  };

  const fetchCompletedPayments = async () => {
    try {
      const response = await axiosInstance.get<CreditPayment[]>('/api/credit-payments', {
        params: {
          role: roleFilter.toUpperCase(),
          paid: true
        }
      });

      if (Array.isArray(response.data)) {
        // Validate and clean the data before setting state
        const validPayments = response.data.filter(payment => 
          payment && 
          typeof payment === 'object' && 
          payment.userId && 
          typeof payment.userId === 'string'
        );
        setCompletedPayments(validPayments);
      } else {
        console.warn('Invalid response format from credit-payments API');
        setCompletedPayments([]);
      }
    } catch (error) {
      console.error('Error fetching completed payments:', error);
      setCompletedPayments([]);
      throw error;
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const summarizeOrders = (orders: Order[]) => {
    const grouped: { [userId: string]: Summary } = {};

    orders.forEach((order) => {
      const userId = order.orderedUserId;

      if (!grouped[userId]) {
        grouped[userId] = {
          orderedUserId: userId,
          orderedRole: order.orderedRole,
          totalPrice: 0,
          paymentType: order.paymentType,
          allPaid: true,
          orderIds: [],
          lastUpdated: order.createdAt
        };
      }

      grouped[userId].totalPrice += order.price;
      grouped[userId].orderIds.push(order.orderId);

      if (!order.paymentRecived) {
        grouped[userId].allPaid = false;
      }

      if (order.createdAt > grouped[userId].lastUpdated) {
        grouped[userId].lastUpdated = order.createdAt;
      }
    });

    const summaryArray = Object.values(grouped);
    summaryArray.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
    setSummaries(summaryArray);
  };

  const markAsPaid = async (userId: string) => {
    setProcessingPayment((prev) => ({ ...prev, [userId]: true }));

    try {
      const unpaidOrders = orders.filter(
        (o) => o.orderedUserId === userId && !o.paymentRecived
      );
      const unpaidOrderIds = unpaidOrders.map((o) => o.orderId);
    
      if (unpaidOrderIds.length === 0) {
        Alert.alert('Info', 'No unpaid orders to mark as paid.');
        return;
      }
    
      const summary = summaries.find((s) => s.orderedUserId === userId);
      const totalAmount = unpaidOrders.reduce((sum, order) => sum + order.price, 0);
    
      // Mark orders as paid
      const markPaidResponse = await axiosInstance.put('/orders/markPaid', unpaidOrderIds);
    
      if (markPaidResponse.status === 200) {
        // Create credit payment record
        await axiosInstance.post('/api/credit-payments', {
          userId: userId,
          role: summary?.orderedRole.toUpperCase() || roleFilter.toUpperCase(),
          amount: totalAmount,
          orders: unpaidOrderIds.join(","),
          paymentType: "CREDIT",
          paid: true 
        });
    
        // Refresh data
        await fetchData();
        Alert.alert('Success', 'Payment marked as paid successfully');
      } else {
        Alert.alert('Error', 'Failed to mark orders as paid');
      }
    } catch (error) {
      let errorMessage = 'Failed to process payment';
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || error.message;
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setProcessingPayment((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const filteredSummaries = summaries.filter((summary) =>
    summary.orderedUserId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCompletedPayments = completedPayments.filter((payment) => {
    if (!payment || !payment.userId || typeof payment.userId !== 'string') {
      return false;
    }
    return payment.userId.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const pendingSummaries = filteredSummaries.filter((summary) => !summary.allPaid);

  // Add error boundary for rendering
  const renderCompletedPayments = () => {
    if (!Array.isArray(completedPayments)) {
      return <Text style={styles.noOrdersText}>Error loading completed payments</Text>;
    }

    if (filteredCompletedPayments.length === 0) {
      return <Text style={styles.noOrdersText}>No completed payments found.</Text>;
    }

    return (
      <DataTable>
        <DataTable.Header>
          <DataTable.Title>User ID</DataTable.Title>
          <DataTable.Title>Role</DataTable.Title>
          <DataTable.Title numeric>Amount</DataTable.Title>
          <DataTable.Title numeric>Orders</DataTable.Title>
          <DataTable.Title>Status</DataTable.Title>
        </DataTable.Header>

        {filteredCompletedPayments.map((payment) => {
          if (!payment || !payment.userId) return null;
          return (
            <DataTable.Row key={payment._id}>
              <DataTable.Cell>{payment.userId}</DataTable.Cell>
              <DataTable.Cell>{payment.role || 'N/A'}</DataTable.Cell>
              <DataTable.Cell numeric>
                ₹{(payment.amount || 0).toFixed(2)}
              </DataTable.Cell>
              <DataTable.Cell numeric>
                {payment.orders ? payment.orders.split(',').length : 0}
              </DataTable.Cell>
              <DataTable.Cell>
                <Text style={styles.paidText}>✅ Paid</Text>
              </DataTable.Cell>
            </DataTable.Row>
          );
        })}
      </DataTable>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E7D32']} />
      }
    >
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Credit Payments</Text>
      </View>

      <View style={styles.filterContainer}>
        <View style={styles.filterItem}>
          <Text style={styles.filterLabel}>Category:</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.roleButton, roleFilter === 'Staff' && styles.roleButtonActive]}
              onPress={() => setRoleFilter('Staff')}
            >
              <Text style={[styles.roleButtonText, roleFilter === 'Staff' && styles.roleButtonActiveText]}>
                Staff
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleButton, roleFilter === 'Patient' && styles.roleButtonActive]}
              onPress={() => setRoleFilter('Patient')}
            >
              <Text style={[styles.roleButtonText, roleFilter === 'Patient' && styles.roleButtonActiveText]}>
                Patient
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.filterItem}>
          <Text style={styles.filterLabel}>Search by User ID:</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Enter User ID"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, tab === 'Pending' && styles.activeTab]}
          onPress={() => setTab('Pending')}
        >
          <Text style={[styles.tabText, tab === 'Pending' && styles.activeTabText]}>
            Pending Payments
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, tab === 'Completed' && styles.activeTab]}
          onPress={() => setTab('Completed')}
        >
          <Text style={[styles.tabText, tab === 'Completed' && styles.activeTabText]}>
            Completed Payments
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2E7D32" style={styles.loader} />
      ) : tab === 'Pending' ? (
        pendingSummaries.length === 0 ? (
          <Text style={styles.noOrdersText}>No pending payments found.</Text>
        ) : (
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>User ID</DataTable.Title>
              <DataTable.Title>Role</DataTable.Title>
              <DataTable.Title numeric>Amount</DataTable.Title>
              <DataTable.Title numeric>Orders</DataTable.Title>
              <DataTable.Title>Status</DataTable.Title>
              <DataTable.Title>Action</DataTable.Title>
            </DataTable.Header>

            {pendingSummaries.map((summary) => (
              <DataTable.Row key={`${summary.orderedUserId}-${summary.lastUpdated}`}>
                <DataTable.Cell>{summary.orderedUserId}</DataTable.Cell>
                <DataTable.Cell>{summary.orderedRole}</DataTable.Cell>
                <DataTable.Cell numeric>
                  ₹{summary.totalPrice.toFixed(2)}
                </DataTable.Cell>
                <DataTable.Cell numeric>{summary.orderIds.length}</DataTable.Cell>
                <DataTable.Cell>
                  <Text style={styles.unpaidText}>❌ Pending</Text>
                </DataTable.Cell>
                <DataTable.Cell>
                  <TouchableOpacity
                    style={styles.payButton}
                    onPress={() => markAsPaid(summary.orderedUserId)}
                    disabled={processingPayment[summary.orderedUserId]}
                  >
                    {processingPayment[summary.orderedUserId] ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.payButtonText}>Mark Paid</Text>
                    )}
                  </TouchableOpacity>
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        )
      ) : (
        renderCompletedPayments()
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  headerContainer: {
    padding: 16,
    backgroundColor: '#2E7D32',
    marginBottom: 16
  },
  headerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 16
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  filterLabel: {
    marginRight: 8,
    fontSize: 16,
    minWidth: 100,
    fontWeight: '500'
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8
  },
  roleButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#2E7D32',
    backgroundColor: '#fff'
  },
  roleButtonActive: {
    backgroundColor: '#2E7D32'
  },
  roleButtonText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: 'bold'
  },
  roleButtonActiveText: {
    color: 'white'
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    paddingHorizontal: 8,
    fontSize: 16
  },
  noOrdersText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#757575',
    padding: 16
  },
  payButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    minWidth: 80,
    justifyContent: 'center',
    alignItems: 'center'
  },
  payButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold'
  },
  paidText: {
    color: '#2E7D32',
    fontWeight: 'bold'
  },
  unpaidText: {
    color: '#D32F2F',
    fontWeight: 'bold'
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    paddingHorizontal: 16
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#2E7D32',
    marginHorizontal: 5,
    borderRadius: 4,
    backgroundColor: 'white'
  },
  activeTab: {
    backgroundColor: '#2E7D32'
  },
  tabText: {
    color: '#2E7D32',
    fontWeight: 'bold'
  },
  activeTabText: {
    color: 'white'
  },
  loader: {
    marginVertical: 20
  }
});

export default PaymentIn;