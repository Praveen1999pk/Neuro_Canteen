import { Tabs } from 'expo-router';
import { House, UserRoundCog, History } from 'lucide-react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { BackHandler } from 'react-native';

export default function TabLayout() {
  useFrameworkReady();

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Prevent going back to previous screens
      return true;
    });

    return () => backHandler.remove();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Tabs
        screenOptions={{
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
            title: 'Home',
            headerShown: true,
            headerTitle: 'Dietitian Dashboard',
            tabBarIcon: ({ color, size }) => <House size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="order-history"
          options={{
            title: 'Order History',
            headerShown: false,
            tabBarIcon: ({ color, size }) => <History size={size} color={color} />,
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            headerShown: true,
            headerTitle: 'Profile',
            tabBarIcon: ({ color, size }) => <UserRoundCog size={size} color={color} />,
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  tabBar: {
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA',
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  header: {
    backgroundColor: '#1B5E20',
  },
  headerTitle: {
    color: 'white',
    fontWeight: '600',
  },
});