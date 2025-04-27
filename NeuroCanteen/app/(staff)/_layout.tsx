import { Tabs } from 'expo-router';
import { ShoppingCart, Clock, Utensils } from 'lucide-react-native';
import { StyleSheet } from 'react-native';

export default function StaffLayout() {
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
      {/* Order Food Screen */}
      <Tabs.Screen
        name="order"  // Points to /app/(staff)/order.tsx
        options={{
          title: 'Order Food',
          tabBarIcon: ({ size, color }) => (
            <Utensils size={size} color={color} />
          ),
        }}
      />
      
      {/* Checkout Screen */}
      <Tabs.Screen
        name="checkout"  // Points to /app/(staff)/checkout.tsx
        options={{
          title: 'Checkout',
          tabBarIcon: ({ size, color }) => (
            <ShoppingCart size={size} color={color} />
          ),
        }}
      />
      
      {/* Order History Screen */}
      <Tabs.Screen
        name="order-history"  // Points to /app/(staff)/order-history.tsx
        options={{
          title: 'Order History',
          tabBarIcon: ({ size, color }) => (
            <Clock size={size} color={color} />
          ),
        }}
      />
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
