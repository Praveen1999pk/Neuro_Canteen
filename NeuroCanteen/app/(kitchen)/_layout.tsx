import { Tabs } from 'expo-router';
import { Package, UserCog } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index" // This refers to the delivery orders screen
        options={{
          title: 'Delivery',
          tabBarIcon: ({ color, size }) => (
            <Package size={size} color={color} />
          ),
          // Disable swipe gesture when on this screen
          tabBarStyle: { display: 'flex' },
        }}
      />
      <Tabs.Screen
        name="Profile" // Profile screen
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <UserCog size={size} color={color} />
          ),
          // Disable swipe gesture for Profile screen if required
          tabBarStyle: { display: 'flex' },
        }}
      />
    </Tabs>
  );
}
