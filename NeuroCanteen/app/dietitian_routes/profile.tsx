import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, LogOut, Settings } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      router.replace('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.profileIcon}>
          <User size={40} color="#166534" />
        </View>
        <Text style={styles.name}>Dietitian Name</Text>
        <Text style={styles.role}>Dietitian</Text>
      </View>

      <ScrollView style={styles.content}>
        <TouchableOpacity style={styles.menuItem}>
          <Settings size={24} color="#166534" />
          <Text style={styles.menuText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <LogOut size={24} color="#ef4444" />
          <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#166534',
    padding: 20,
    alignItems: 'center',
  },
  profileIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
    color: '#e2e8f0',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  menuText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#1f2937',
  },
  logoutText: {
    color: '#ef4444',
  },
}); 