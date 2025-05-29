import { Tabs } from 'expo-router';
import { House,UserRoundCog } from 'lucide-react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { StyleSheet } from 'react-native';

export default function TabLayout() {
  useFrameworkReady();

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