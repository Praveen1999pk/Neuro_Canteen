import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

const TOKEN_KEY = 'jwtToken';

export const storeToken = async (token: string) => {
  await AsyncStorage.setItem(TOKEN_KEY, token);
};

export const getToken = async () => {
  return await AsyncStorage.getItem(TOKEN_KEY);
};

export const removeToken = async () => {
  try {
    // Clear all stored data
    await AsyncStorage.multiRemove([
      'jwtToken',
      'patientUHID',
      'patientPHONE',
      'userRole',
      'navigationState',
      'expo-router-history',
      'expo-router-state'
    ]);
  } catch (error) {
    console.error('Error removing tokens:', error);
    throw error;
  }
};

export const getUsernameFromToken = async (): Promise<string | null> => {
  try {
    const token = await getToken();
    if (!token) return null;

    const decoded: any = jwtDecode(token);
    return decoded.username || decoded.name || decoded.sub || null;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};
