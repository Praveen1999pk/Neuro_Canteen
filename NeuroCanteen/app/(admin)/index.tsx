import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ChartBar as BarChart2, Users, User, UtensilsCrossed, Truck, ChefHat, Menu } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import axiosInstance from '../api/axiosInstance';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalStaff: 0,
    totalPatients: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [ordersRes, staffRes, patientsRes] = await Promise.all([
        axiosInstance.get('/orders'),
         axiosInstance.get('/staff'),
        axiosInstance.get('/patient/all')
      ]);

      setStats({
        totalOrders: ordersRes.data.length || 0,
        totalStaff: staffRes.data.length || 0,
        totalPatients: patientsRes.data.length || 0
      });
    } catch (error) {
      console.log("hello world");
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateTo = (route: string) => {
    router.push(`/(admin)/${route}`);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Neuro Canteen Admin</Text>
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
        <TouchableOpacity 
          style={styles.managementCard} 
          onPress={() => navigateTo('staff')}
        >
          <Users size={32} color="#2E7D32" />
          <Text style={styles.managementTitle}>Staff</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.managementCard}
          onPress={() => navigateTo('patient')}
        >
          <User size={32} color="#2E7D32" />
          <Text style={styles.managementTitle}>Patients</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.managementCard}
          onPress={() => navigateTo('dietitian')}
        >
          <UtensilsCrossed size={32} color="#2E7D32" />
          <Text style={styles.managementTitle}>Dietitian</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.managementCard}
          onPress={() => navigateTo('kitchen')}
        >
          <ChefHat size={32} color="#2E7D32" />
          <Text style={styles.managementTitle}>Kitchen</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.managementCard}
          onPress={() => navigateTo('delivery')}
        >
          <Truck size={32} color="#2E7D32" />
          <Text style={styles.managementTitle}>Delivery</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.managementCard}
          onPress={() => navigateTo('menu')}
        >
          <Menu size={32} color="#2E7D32" />
          <Text style={styles.managementTitle}>Menu</Text>
        </TouchableOpacity>
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
    padding: 20,
    backgroundColor: '#2E7D32',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
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