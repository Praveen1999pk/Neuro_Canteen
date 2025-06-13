import { Stack } from 'expo-router';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { StyleSheet } from 'react-native';
export default function DietitianLayout() {
  useFrameworkReady();

  return (
    <Stack>
<Stack.Screen 
  name="index" 
  options={{ 
    title: "Dietitian Dashboard",
    headerShown: true,
    headerStyle: {
      backgroundColor: '#ffffff', // ✅ White background
    },
    headerTintColor: '#000000', // ✅ Black text & icons (back arrow, etc.)
    headerTitleStyle: {
      fontSize: 20, // ✅ Smaller font size
      fontWeight: '600',
    },
    headerTitleAlign: 'center',
  }} 
/>

      <Stack.Screen 
        name="floor" 
        options={{ 
          title: "Wards",
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
          headerBackTitle: "Dashboard",
        }} 
      />
      <Stack.Screen 
        name="rooms" 
        options={{ 
          title: "Rooms",
          headerShown: true,
          headerBackTitle: "Wards",
        }} 
      />
      <Stack.Screen 
        name="beds" 
        options={{ 
          title: "Beds",
          headerShown: true,
          headerBackTitle: "Rooms",
        }} 
      />
      <Stack.Screen 
        name="patient" 
        options={{ 
          title: "Patient Profile",
          headerShown: true,
          headerBackTitle: "Beds",
        }} 
      />
      <Stack.Screen 
        name="create-diet" 
        options={{ 
          title: "Select Diet Plans",
          headerShown: true,
          headerBackTitle: "Patient",
        }} 
      />
       <Stack.Screen 
        name="food" 
        options={{ 
          title: "Food Menu",
          headerShown: true,
          headerBackTitle: "Diet Plans",
        }} 
      />
       <Stack.Screen 
        name="order-success" 
        options={{ 
          title: "Order Status",
          headerShown: true,
          headerBackTitle: "Re-Order",
        }} 
      />
      <Stack.Screen 
        name="diet-history" 
        options={{ 
          title: "Diet History",
          headerShown: true,
          headerBackTitle: "Patient Profile",
        }} 
      />
      <Stack.Screen 
        name="checkout" 
        options={{ 
          title: "Checkout",
          headerShown: true,
          headerBackTitle: "Food Menu",
        }} 
      />
  
    </Stack>
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
    backgroundColor: '#1B5E20',
  },
  headerTitle: {
    color: 'white',
    fontWeight: '600',
  },
});
