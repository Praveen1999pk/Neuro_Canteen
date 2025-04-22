import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, Text } from 'react-native';

export default function LogoutScreen() {
  useEffect(() => {
    // Clear any storage/token here if needed
    setTimeout(() => {
      router.replace('/login'); // Replace with your login screen route
    }, 1000);
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>👋 Logging you out...</Text>
    </View>
  );
}
