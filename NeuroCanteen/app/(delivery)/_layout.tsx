import { Tabs } from 'expo-router';
import { Package, UserCog } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Delivery',
          tabBarIcon: ({ color, size }) => (
            <Package size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="update"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <UserCog size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
