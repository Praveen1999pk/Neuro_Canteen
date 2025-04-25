import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

export const saveToken = async (token: string) => {
  try {
    await AsyncStorage.setItem('jwtToken', token);
    return true;
  } catch (error) {
    console.error('Error saving token:', error);
    return false;
  }
};

export const getToken = async () => {
  try {
    return await AsyncStorage.getItem('jwtToken');
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem('jwtToken');
    return true;
  } catch (error) {
    console.error('Error removing token:', error);
    return false;
  }
};

export const isTokenValid = async () => {
  try {
    const token = await getToken();
    if (!token) return false;
    
    const decoded: any = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    
    // Check if token has expiration and is not expired
    return decoded.exp && decoded.exp > currentTime;
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
};

export const getTokenData = async () => {
  try {
    const token = await getToken();
    if (!token) return null;
    
    return jwtDecode(token);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

export const getUsernameFromToken = async () => {
  try {
    const tokenData: any = await getTokenData();
    return tokenData?.sub || null;
  } catch (error) {
    console.error('Error getting username from token:', error);
    return null;
  }
};