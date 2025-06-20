import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { setupNotifications } from '@/services/notifications';
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we initialize
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [notificationReady, setNotificationReady] = useState(false);
  const frameworkReady = useFrameworkReady();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize notifications (but don't request permissions yet)
        await setupNotifications({ requestPermissions: false });
        setNotificationReady(true);
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        // Hide splash screen when everything is ready
        await SplashScreen.hideAsync();
      }
    };

    if (frameworkReady) {
      initializeApp();
    }
  }, [frameworkReady]);

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ 
        headerShown: false,
        animation: 'fade',
        gestureEnabled: true // Enable gestures by default
      }}>
        {/* Index page */}
        <Stack.Screen name="index" />
        
        {/* Role-specific screens */}
        <Stack.Screen
          name="(delivery)"
          // Only disable gestures for delivery if needed
          options={{ gestureEnabled: false }} 
        />
        <Stack.Screen
          name="(dietitians)"
          options={{ gestureEnabled: true }}
        />
        <Stack.Screen
          name="(kitchen)"
          options={{ gestureEnabled: true }}
        />

        {/* Add error boundary screen if needed */}
        <Stack.Screen name="(error)" options={{ gestureEnabled: true }} />
      </Stack>
    </>
  );
}