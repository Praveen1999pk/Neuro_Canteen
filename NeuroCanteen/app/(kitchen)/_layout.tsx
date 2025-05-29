import { Tabs } from 'expo-router';
import { Package, UserCog } from 'lucide-react-native';
import { StyleSheet } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs       screenOptions={{
        headerShown: true,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#4A8F47',
        tabBarInactiveTintColor: '#666',
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
      }}>
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
