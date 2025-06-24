// NeuroCanteen/app/services/notifications.ts
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Initialize notifications with options
export const setupNotifications = async (options?: {
  requestPermissions?: boolean;
  androidChannel?: boolean;
}) => {
  try {
    // Default options
    const { 
      requestPermissions = false, 
      androidChannel = true 
    } = options || {};

    // Android channel setup
    if (Platform.OS === 'android' && androidChannel) {
      await Notifications.setNotificationChannelAsync('delivery', {
        name: 'Delivery Notifications',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
        lightColor: '#FF231F7C',
      });
    }

    // Request permissions if needed
    if (requestPermissions) {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          // allowAnnouncements: true,
        },
      });
      return status === 'granted';
    }

    return true;
  } catch (error) {
    console.error('Notification setup error:', error);
    return false;
  }
};

// Simple notification function
export const showNotification = async (
  title: string, 
  body: string, 
  data?: Record<string, any>
) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        data,
      },
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.error('Notification error:', error);
  }
};

// Delivery-specific notification
export const triggerDeliveryNotification = async (order: {
  orderId: number;
  itemName: string;
  address?: string;
}) => {
  await showNotification(
    '🚚 New Delivery Assignment',
    `Order #${order.orderId}: ${order.itemName}`,
    { 
      orderId: order.orderId,
      type: 'delivery',
      screen: 'delivery_orders',
      params: JSON.stringify({ orderId: order.orderId })
    }
  );
};

// Permission management
export const checkPermissions = async () => {
  return await Notifications.getPermissionsAsync();
};

export const requestNotificationPermissions = async () => {
  return await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
      // allowAnnouncements: true,
    },
  });
};

// Notification management
export const cancelAllNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

export const getPendingNotifications = async () => {
  return await Notifications.getAllScheduledNotificationsAsync();
};