import { Tabs } from 'expo-router'; 
import { ShoppingCart, Clock, Utensils, User } from 'lucide-react-native';
import { StyleSheet } from 'react-native';

export default function PatientLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#4A8F47',
        tabBarInactiveTintColor: '#666',
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
      }}
    >
      <Tabs.Screen
        name="order"
        options={{
          title: 'Order Food',
          headerShown: false,
          tabBarIcon: ({ size, color }) => (
            <Utensils size={size} color={color} />
          ),
        }}
      />
      {/* <Tabs.Screen
        name="checkout"
        options={{
          title: 'Checkout',
          tabBarIcon: ({ size, color }) => (
            <ShoppingCart size={size} color={color} />
          ),
        }}
      /> */}
      <Tabs.Screen
        name="order-history"
        options={{
          title: 'Order History',
          tabBarIcon: ({ size, color }) => (
            <Clock size={size} color={color} />
          ),
        }}
      />

      {/* 🚫 Hide unwanted screens */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="order-success" options={{ href: null }} />
      <Tabs.Screen name="checkout" options={{ 
        href: null,
        headerShown: false 
      }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  header: {
    backgroundColor: '#4A8F47',
  },
  headerTitle: {
    color: 'white',
    fontWeight: '600',
  },
});