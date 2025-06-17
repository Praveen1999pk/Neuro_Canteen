import { Stack, useRouter } from 'expo-router';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { usePathname } from 'expo-router';
import { Home, User } from 'lucide-react-native';

function FooterNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <View style={styles.footer}>
      <TouchableOpacity 
        style={styles.footerItem} 
        onPress={() => router.push('/dietitian_routes')}
      >
        <Home size={24} color={isActive('/dietitian_routes') ? '#166534' : '#64748b'} />
        <Text style={[styles.footerText, isActive('/dietitian_routes') && styles.footerTextActive]}>
          Home
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.footerItem} 
        onPress={() => router.push('/dietitian_routes/profile')}
      >
        <User size={24} color={isActive('/dietitian_routes/profile') ? '#166534' : '#64748b'} />
        <Text style={[styles.footerText, isActive('/dietitian_routes/profile') && styles.footerTextActive]}>
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function DietitianLayout() {
  useFrameworkReady();

  return (
    <View style={styles.container}>
      <Stack>
        <Stack.Screen 
          name="index" 
          options={{ 
            title: "Dietitian Dashboard",
            headerShown: true,
            headerStyle: {
              backgroundColor: '#ffffff',
            },
            headerTintColor: '#000000',
            headerTitleStyle: {
              fontSize: 20,
              fontWeight: '600',
            },
            headerTitleAlign: 'center',
          }} 
        />
        <Stack.Screen 
          name="patient" 
          options={{ 
            title: "Patient Details",
            headerShown: true,
            headerStyle: {
              backgroundColor: '#ffffff',
            },
            headerTintColor: '#000000',
            headerTitleStyle: {
              fontSize: 20,
              fontWeight: '600',
            },
            headerTitleAlign: 'center',
          }} 
        />
        <Stack.Screen 
          name="checkout" 
          options={{ 
            title: "Checkout",
            headerShown: true,
            headerStyle: {
              backgroundColor: '#ffffff',
            },
            headerTintColor: '#000000',
            headerTitleStyle: {
              fontSize: 20,
              fontWeight: '600',
            },
            headerTitleAlign: 'center',
          }} 
        />
        <Stack.Screen 
          name="profile" 
          options={{ 
            title: "Profile",
            headerShown: true,
            headerStyle: {
              backgroundColor: '#ffffff',
            },
            headerTintColor: '#000000',
            headerTitleStyle: {
              fontSize: 20,
              fontWeight: '600',
            },
            headerTitleAlign: 'center',
          }} 
        />
      </Stack>
      <FooterNavigation />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingVertical: 8,
    paddingBottom: 20,
  },
  footerItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  footerTextActive: {
    color: '#166534',
    fontWeight: '600',
  },
});
