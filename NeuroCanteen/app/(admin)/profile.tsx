import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { getUsernameFromToken, removeToken } from '../services/tokenService';
import { logout } from '../services/authService';
import { User, LogOut } from 'lucide-react-native';

export default function ProfileScreen() {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsername = async () => {
      const name = await getUsernameFromToken();
      setUsername(name);
      setLoading(false);
    };

    fetchUsername();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            await logout();
            router.replace('(Role)/admin'); // change path as needed
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <User size={40} color="#FF6B00" />
        </View>
        <Text style={styles.username}>
          {loading ? 'Loading...' : `Welcome, ${username || 'Staff User'}`}
        </Text>
        <Text style={styles.role}>Staff Account</Text>
      </View>

      <View style={styles.optionsContainer}>
        <TouchableOpacity style={styles.optionItem} onPress={handleLogout}>
          <LogOut size={24} color="#FF3B30" />
          <Text style={[styles.optionText, styles.logoutText]}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.appInfoContainer}>
        <Text style={styles.appVersion}>NeuroCanteen v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  profileHeader: {
    backgroundColor: 'white',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF0E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  username: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
    color: '#666',
  },
  optionsContainer: {
    backgroundColor: 'white',
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  optionText: {
    fontSize: 16,
    marginLeft: 16,
  },
  logoutText: {
    color: '#FF3B30',
  },
  appInfoContainer: {
    position: 'absolute',
    bottom: 24,
    width: '100%',
    alignItems: 'center',
  },
  appVersion: {
    fontSize: 14,
    color: '#999',
  },
});
