import * as Notifications from 'expo-notifications';

export const triggerDeliveryNotification = async (orderId: number) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚚 Delivery Assigned',
        body: `Order #${orderId} is out for delivery!`,
        sound: 'default',
        data: { orderId }, // Add custom data
        priority: Notifications.AndroidNotificationPriority.HIGH,
        vibrate: [0, 250, 250, 250], // Vibration pattern
      },
      trigger: null, // Send immediately
    });
    
    // Set badge count (iOS)
    await Notifications.setBadgeCountAsync(await Notifications.getBadgeCountAsync() + 1);
  } catch (error) {
    console.error('Error triggering notification:', error);
  }
};