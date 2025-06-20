// NeuroCanteen\app\services\notifications.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
});

// services/notifications.ts
export const setupOrderStatusListener = (callback: (order: any) => void) => {
  const subscription = Notifications.addNotificationReceivedListener(notification => {
    if (notification.request.content.data.type === 'delivery') {
      callback(notification.request.content.data);
    }
  });

  return () => subscription.remove();
};

export const sendDeliveryNotification = async (order: {
  id: number;
  status: string;
  items: string;
  address?: string;
}) => {
  if (order.status === 'OUT_FOR_DELIVERY') {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚚 New Delivery Assignment',
        body: `Order #${order.id}: ${order.items}`,
        data: {
          orderId: order.id,
          type: 'delivery',
          status: order.status,
          address: order.address
        },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH
      },
      trigger: null // Send immediately
    });
  }
};
// Initialize notification permissions and settings
export const setupNotifications = async () => {
  // Request permissions
  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  if (status !== 'granted') {
    console.warn('Notification permissions not granted');
    return false;
  }

  // Get the push token (useful if you want to send targeted push notifications later)
  try {
    const token = await Notifications.getExpoPushTokenAsync();
    console.log('Push token:', token);
    return true;
  } catch (error) {
    console.error('Error getting push token:', error);
    return false;
  }
};

// Enhanced delivery notification
export const triggerDeliveryNotification = async (order: {
  orderId: number;
  itemName: string;
  address: string;
  orderedName?: string | null;
  phoneNo?: string | null;
}) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚚 New Delivery Assignment',
        body: `Order #${order.orderId} is ready for delivery`,
        sound: 'default',
        data: { orderId: order.orderId, type: 'delivery' },
        priority: Notifications.AndroidNotificationPriority.HIGH,
        vibrate: [0, 250, 250, 250],
        // iOS specific
        badge: 1,
      },
      trigger: null, // Send immediately
    });

    // For Android channels (required for Android 8+)
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('delivery', {
        name: 'Delivery Notifications',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
      });
    }
  } catch (error) {
    console.error('Error triggering notification:', error);
  }
};