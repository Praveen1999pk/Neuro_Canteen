// app/delivery_orders/_layout.tsx
import { Stack } from 'expo-router';

export default function DeliveryOrdersLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Set to true if you want the top bar
      }}
    />
  );
}
