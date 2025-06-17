import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Basic notification configuration
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  });
}

// Simple notification function
export const showNotification = async (title: string, body: string) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
      },
      trigger: null,
    });
  } catch (error) {
    console.log('Notification error:', error);
  }
};

// Basic permission request
export const requestPermissions = async () => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      await Notifications.requestPermissionsAsync();
    }
  } catch (error) {
    console.log('Permission error:', error);
  }
};

export async function schedulePushNotification(title: string, body: string) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
      },
      trigger: null, // null means show immediately
    });
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
}

export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling notifications:', error);
  }
}

export async function getScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
} 