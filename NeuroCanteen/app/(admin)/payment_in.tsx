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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

type Order = {
  orderId: string;
  orderedUserId: string;
  orderedRole: string;
  price: number;
  paymentType: string;
  paymentRecived: boolean;
  createdAt: string;
  orderedName?: string;
};

type Summary = {
  orderedUserId: string;
  orderedRole: string;
  totalPrice: number;
  paymentType: string;
  allPaid: boolean;
  orderIds: string[];
  lastUpdated: string;
  orderedName?: string;
};

interface CreditPayment {
  _id: string;
  userId: string;
  role: string;
  amount: number;
  orders: string;
  paymentType: string;
  paid: boolean;
  createdAt: string;
}

interface TransformedPayment {
  orderedUserId: string;
  orderedRole: string;
  totalPrice: number;
  paymentType: string;
  allPaid: boolean;
  orderIds: string[];
  createdAt: string;
}

const PaymentIn = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [completedPayments, setCompletedPayments] = useState<TransformedPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingPayment, setProcessingPayment] = useState<{ [userId: string]: boolean }>({});
  const [roleFilter, setRoleFilter] = useState<'Staff' | 'Patient'>('Staff');
  const [searchTerm, setSearchTerm] = useState('');
  const [tab, setTab] = useState<'Pending' | 'Completed'>('Pending');
  const router = useRouter();

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
          paymentStatus: null
        },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await AsyncStorage.getItem('token')}`
        }
      });

      if (response.status === 200) {
        const originalData = response.data;
        if (!Array.isArray(originalData)) {
          console.error("Unexpected response format:", originalData);
          return;
        }

        const filteredData = roleFilter === 'Patient' 
          ? originalData.filter(order => 
              (order.orderedRole === 'Patient' && 
              order.paymentType === 'CREDIT' &&
              order.orderedUserId
            ))
          : originalData.filter(order => 
              order.orderedRole === 'Staff' &&
              order.paymentType === 'CREDIT' &&
              order.orderedUserId
            );

        console.log('Filtered orders:', filteredData);
        setOrders(filteredData);
        summarizeOrders(filteredData);

        // Fetch credit payments
        const creditResponse = await axiosInstance.get("/api/credit-payments");
        if (creditResponse.status === 200) {
          const transformed = creditResponse.data.map((payment: { 
            userId: string | number;
            role: string;
            amount: number;
            paymentType: string;
            paid: boolean;
            orders: string;
          }) => ({
            orderedUserId: String(payment.userId),
            orderedRole: payment.role,
            totalPrice: payment.amount,
            paymentType: payment.paymentType,
            allPaid: payment.paid,
            orderIds: payment.orders.split(',').map((id: string) => parseInt(id))
          }));
          setSummaries((prev) => [...prev, ...transformed]);
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        Alert.alert(
          'Authentication Error',
          'Your session has expired. Please log in again.',
          [
            {
              text: 'OK',
              onPress: () => {
                AsyncStorage.removeItem('token');
                router.replace('/login');
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to fetch orders. Please try again.');
      }
      throw error;
    }
  };

  const fetchCompletedPayments = async () => {
    try {
      const response = await axiosInstance.get<CreditPayment[]>('/api/credit-payments', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await AsyncStorage.getItem('token')}`
        }
      });
      
      if (response.status === 200) {
          const transformed = response.data
            .filter(payment => {
              if (roleFilter === 'Patient') {
                return payment.role.toUpperCase() === 'PATIENT' || payment.role.toUpperCase() === 'Patient';
              }
              return payment.role.toUpperCase() === roleFilter.toUpperCase();
            })
            .map((payment) => ({
              orderedUserId: String(payment.userId),
              orderedRole: payment.role.charAt(0).toUpperCase() + payment.role.slice(1).toLowerCase(),
              totalPrice: payment.amount,
              paymentType: payment.paymentType,
              allPaid: payment.paid,
              orderIds: payment.orders.split(',').map((id) => id.trim()), // <-- keep as string
              createdAt: payment.createdAt
            }));
        setCompletedPayments(transformed);
      }
    } catch (error) {
      console.error('Error fetching completed payments:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        Alert.alert(
          'Authentication Error',
          'Your session has expired. Please log in again.',
          [
            {
              text: 'OK',
              onPress: () => {
                AsyncStorage.removeItem('token');
                router.replace('/login');
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to fetch completed payments. Please try again.');
      }
      setCompletedPayments([]);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const summarizeOrders = (orders: Order[]) => {
    const grouped: { [key: string]: Summary } = {};

    orders.forEach((order) => {
      const userId = order.orderedUserId;
      if (!userId) return;

      if (!grouped[userId]) {
        grouped[userId] = {
          orderedUserId: userId,
          orderedRole: order.orderedRole,
          orderedName: order.orderedName || userId,
          totalPrice: 0,
          paymentType: order.paymentType,
          allPaid: true,
          orderIds: [],
          lastUpdated: order.createdAt
        };
      }

      grouped[userId].totalPrice += order.price;
      grouped[userId].orderIds.push(String(order.orderId));

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
      if (!summary) {
        Alert.alert('Error', 'Could not find order summary');
        return;
      }

      const totalAmount = unpaidOrders.reduce((sum, order) => sum + order.price, 0);
    
      const markPaidResponse = await axiosInstance.put('/orders/markPaid', unpaidOrderIds, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await AsyncStorage.getItem('token')}`
        }
      });
    
      if (markPaidResponse.status === 200) {
        await axiosInstance.post('/api/credit-payments', {
          userId: parseInt(userId.replace(/[^0-9]/g, '')),
          role: summary.orderedRole,
          amount: totalAmount,
          orders: unpaidOrderIds.join(","),
          paymentType: "CREDIT",
          paid: true 
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await AsyncStorage.getItem('token')}`
          }
        });
  
        await Promise.all([fetchOrders(), fetchCompletedPayments()]);
        Alert.alert('Success', 'Payment marked as paid successfully');
      } else {
        Alert.alert('Error', 'Failed to mark orders as paid');
      }
    } catch (error) {
      let errorMessage = 'Failed to process payment';
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          Alert.alert(
            'Authentication Error',
            'Your session has expired. Please log in again.',
            [
              {
                text: 'OK',
                onPress: () => {
                  AsyncStorage.removeItem('token');
                  router.replace('/login');
                }
              }
            ]
          );
          return;
        }
        errorMessage = error.response?.data?.message || error.message;
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setProcessingPayment((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const filteredSummaries = summaries.filter(
    (summary) =>
      summary.orderedUserId.toLowerCase().includes(searchTerm.toLowerCase()) &&
      summary.orderedRole.toLowerCase() === roleFilter.toLowerCase()
  );

  const filteredCompletedPayments = completedPayments.filter((payment) => {
    if (!payment || !payment.orderedUserId) return false;
    return payment.orderedUserId.toLowerCase().includes(searchTerm.toLowerCase()) &&
           payment.orderedRole.toLowerCase() === roleFilter.toLowerCase();
  });

  const pendingSummaries = filteredSummaries.filter((summary) => !summary.allPaid);

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
          <DataTable.Title>Date</DataTable.Title>
        </DataTable.Header>

        {filteredCompletedPayments.map((payment) => {
          if (!payment || !payment.orderedUserId) return null;
          const uniqueKey = `${payment.orderedUserId}-${payment.createdAt}`;
          return (
            <DataTable.Row key={uniqueKey}>
              <DataTable.Cell>{payment.orderedUserId}</DataTable.Cell>
              <DataTable.Cell>{payment.orderedRole}</DataTable.Cell>
              <DataTable.Cell numeric>
                ₹{(payment.totalPrice || 0).toFixed(2)}
              </DataTable.Cell>
              <DataTable.Cell numeric>
                {payment.orderIds ? payment.orderIds.length : 0}
              </DataTable.Cell>
              <DataTable.Cell>
                <Text style={styles.paidText}>✅ Paid</Text>
              </DataTable.Cell>
              <DataTable.Cell>
                {new Date(payment.createdAt).toLocaleDateString()}
              </DataTable.Cell>
            </DataTable.Row>
          );
        })}
      </DataTable>
    );
  };

  const renderOrderSummary = (summary: Summary) => {
    return (
      <DataTable.Row key={summary.orderedUserId}>
        <DataTable.Cell>{summary.orderedName || summary.orderedUserId}</DataTable.Cell>
        <DataTable.Cell>{summary.orderedRole}</DataTable.Cell>
        <DataTable.Cell numeric>₹{summary.totalPrice.toFixed(2)}</DataTable.Cell>
        <DataTable.Cell numeric>{summary.orderIds.length}</DataTable.Cell>
        <DataTable.Cell>{summary.paymentType}</DataTable.Cell>
        <DataTable.Cell>
          {summary.allPaid ? (
            <Text style={styles.paidText}>✅ Paid</Text>
          ) : (
            <TouchableOpacity
              style={styles.markPaidButton}
              onPress={() => markAsPaid(summary.orderedUserId)}
              disabled={processingPayment[summary.orderedUserId]}
            >
              {processingPayment[summary.orderedUserId] ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.markPaidButtonText}>Mark as Paid</Text>
              )}
            </TouchableOpacity>
          )}
        </DataTable.Cell>
      </DataTable.Row>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E7D32']} />
      }
    >
      <View style={styles.filterContainer}>
        <View style={[styles.filterItem, { marginTop: 16 }]}>
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

            {pendingSummaries.map((summary) => renderOrderSummary(summary))}
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
  },
  markPaidButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center'
  },
  markPaidButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center'
  }
});

export default PaymentIn;