import { Tabs } from 'expo-router';
import { Package, UserCog } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TabLayout() {
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
            title: 'Delivery',
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Package size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="Profile"
          options={{
            title: 'Profile',
            headerShown: true,
            tabBarIcon: ({ color, size }) => (
              <UserCog size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20, // Small white space at the top
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