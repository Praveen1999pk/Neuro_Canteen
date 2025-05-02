import { Tabs } from 'expo-router';
import { House,UserRoundCog } from 'lucide-react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

export default function TabLayout() {
  useFrameworkReady();

  return (
    <Tabs
      screenOptions={{
        // This will hide the header
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Floors',
          tabBarIcon: ({ color, size }) => <House size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="order-history"
        options={{
          title: 'Order History',
          tabBarIcon: ({ color, size }) => <House size={size} color={color} />,
        }}
      />

        <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <UserRoundCog size={size} color={color} />,
        }}
      />
       
    </Tabs>
  );
}
