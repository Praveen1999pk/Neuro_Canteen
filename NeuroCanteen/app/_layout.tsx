import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Index page */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        
       
        <Stack.Screen
          name="(delivery)" 
          options={{
            gestureEnabled: false, // Disable swipe gestures (left-to-right)
            headerShown: false, // Optionally hide the header
          }}
        />
          <Stack.Screen
            name="(dietitians)" // This pattern matches any screen under the "(dietitians)" folder
            options={{
            gestureEnabled: false, // Disable swipe gestures (left-to-right)
            headerShown: false, // Optionally hide the header
          }}
        />

          <Stack.Screen
            name="(kitchen)" // This pattern matches any screen under the "(dietitians)" folder
            options={{
            gestureEnabled: false, // Disable swipe gestures (left-to-right)
            headerShown: false, // Optionally hide the header
          }}
        />
      </Stack>
    </>
  );
}
