import React from 'react';
import { Tabs } from 'expo-router';
import {
  Chrome as Home,
  Users,
  User,
  Truck,
  ChefHat,
  UtensilsCrossed,
} from 'lucide-react-native';
import { View, StyleSheet } from 'react-native';
import { useHrefAttrs } from 'expo-router/build/link/useLinkHooks';

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#757575',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          height: 60,
          paddingBottom: 10,
          paddingTop: 10,
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: '#2E7D32',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="staff"
        options={{
          title: 'Staff',
          tabBarIcon: ({ color }) => <Users size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="patient"
        options={{
          title: 'Patients',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="dietitian"
        options={{
          title: 'Dietitian',
          tabBarIcon: ({ color }) => (
            <View style={styles.icon}>
              <UtensilsCrossed size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="kitchen"
        options={{
          title: 'Kitchen',
          tabBarIcon: ({ color }) => <ChefHat size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="delivery"
        options={{
          title: 'Delivery',
          tabBarIcon: ({ color }) => <Truck size={24} color={color} />,
        }}
      />
    </Tabs>
   
  );
}

const styles = StyleSheet.create({
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
