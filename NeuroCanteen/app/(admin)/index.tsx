import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  ChartBar as BarChart2,
  Users,
  User,
  UtensilsCrossed,
  Truck,
  ChefHat,
  Menu,
  BanknoteArrowDown,
  ArrowLeft,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import axiosInstance from '../api/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalStaff: 0,
    totalPatients: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Check if token exists before making requests
      const token = await AsyncStorage.getItem('jwtToken');
      if (!token) {
        console.error('No authentication token found');
        setStats({
          totalOrders: 0,
          totalStaff: 0,
          totalPatients: 0,
        });
        return;
      }

      const [ordersRes, staffRes, patientsRes] = await Promise.all([
        axiosInstance.get('/orders'),
        axiosInstance.get('/staff'),
        axiosInstance.get('/patient/all'),
      ]);

      setStats({
        totalOrders: ordersRes.data.length || 0,
        totalStaff: staffRes.data.length || 0,
        totalPatients: patientsRes.data.length || 0,
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      
      // Handle specific error types
      if (error.response?.status === 401) {
        console.error('Authentication failed. Please login again.');
        // You can add navigation to login here
      } else if (error.response?.status === 403) {
        console.error('Access denied. Insufficient permissions.');
      } else if (error.code === 'NETWORK_ERROR') {
        console.error('Network error. Please check your connection.');
      } else {
        console.error('Unknown error occurred:', error.message);
      }
      
      // Set default stats on error
      setStats({
        totalOrders: 0,
        totalStaff: 0,
        totalPatients: 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  const navigateTo = (route: string) => {
    router.push(`/(admin)/${route}`);
  };

  const handleBack = () => {
    router.back();
  };

  const managementItems = [
    { title: 'Staff', icon: <Users size={32} color="#2E7D32" />, route: 'staff' },
    { title: 'Patients', icon: <User size={32} color="#2E7D32" />, route: 'patient' },
    { title: 'Dietitian', icon: <UtensilsCrossed size={32} color="#2E7D32" />, route: 'dietitian' },
    { title: 'Kitchen', icon: <ChefHat size={32} color="#2E7D32" />, route: 'kitchen' },
    { title: 'Delivery', icon: <Truck size={32} color="#2E7D32" />, route: 'delivery' },
    { title: 'Menu', icon: <Menu size={32} color="#2E7D32" />, route: 'menu' },
    { title: 'Credit Payment', icon: <BanknoteArrowDown size={32} color="#2E7D32" />, route: 'payment_in' },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={20} color="#fff" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <BarChart2 size={24} color="#2E7D32" />
          <Text style={styles.statNumber}>
            {loading ? '...' : stats.totalOrders}
          </Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>
        <View style={styles.statCard}>
          <Users size={24} color="#2E7D32" />
          <Text style={styles.statNumber}>
            {loading ? '...' : stats.totalStaff}
          </Text>
          <Text style={styles.statLabel}>Total Staff</Text>
        </View>
        <View style={styles.statCard}>
          <User size={24} color="#2E7D32" />
          <Text style={styles.statNumber}>
            {loading ? '...' : stats.totalPatients}
          </Text>
          <Text style={styles.statLabel}>Patients</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Management</Text>

      <View style={styles.managementGrid}>
        {managementItems.map((item, index, arr) => {
          const isLastOdd = arr.length % 2 !== 0 && index === arr.length - 1;

          const card = (
            <TouchableOpacity
              key={item.route}
              style={styles.managementCard}
              onPress={() => navigateTo(item.route)}
            >
              {item.icon}
              <Text style={styles.managementTitle}>{item.title}</Text>
            </TouchableOpacity>
          );

          return isLastOdd ? (
            <View
              key={item.route}
              style={{ width: '100%', alignItems: 'center' }}
            >
              {card}
            </View>
          ) : (
            card
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#2E7D32',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    width: '30%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
    marginTop: 24,
    marginBottom: 16,
    color: '#333',
  },
  managementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    justifyContent: 'space-between',
  },
  managementCard: {
    backgroundColor: 'white',
    width: '48%',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  managementTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
});
