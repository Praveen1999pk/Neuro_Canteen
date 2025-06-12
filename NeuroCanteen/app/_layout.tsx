import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <StatusBar style="auto" />
      
      {/* Index page */}
      <Stack.Screen name="index" />
      
      <Stack.Screen
        name="(delivery)" 
        options={{
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="(dietitians)"
        options={{
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="(kitchen)"
        options={{
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}