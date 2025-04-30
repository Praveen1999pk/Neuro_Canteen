import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut, CircleHelp as HelpCircle, User, Star } from 'lucide-react-native';
import { ProfileOption } from '@/components/ProfileOption';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const [user, setUser] = useState({
    name: 'Patient',
    email: 'patient@crimson.com',
    role: 'Patient',
  });

  const router = useRouter();

  const handleLogout = () => {
    console.log('User logged out');
    router.replace('/(Role)/patient');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.profileHeader}>
            <Text style={styles.greetingText}>Welcome Back 👋</Text>
          </View>
          <View style={styles.userInfoContainer}>
            <View style={styles.userIconContainer}>
              <User size={48} color="#10B981" strokeWidth={1.5} />
            </View>
            <Text style={styles.userName}>{user.name}</Text>

            <View style={styles.roleContainer}>
              <Star size={16} color="#047857" />
              <Text style={styles.roleText}>{user.role}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.optionsContainer}>
            <ProfileOption
              icon={<HelpCircle color="#10B981" size={22} />}
              title="Help & Support"
              subtitle="Get help with using the app"
              onPress={() => console.log('Help pressed')}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LogOut color="#DC2626" size={20} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#10B981',
  },
  userInfoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  roleText: {
    color: '#047857',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 10,
  },
  optionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 40,
    padding: 16,
    borderRadius: 15,
  },
  logoutText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
