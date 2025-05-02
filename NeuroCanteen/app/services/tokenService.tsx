import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';

const TOKEN_KEY = 'jwtToken';

export const storeToken = async (token: string) => {
  await AsyncStorage.setItem(TOKEN_KEY, token);
};

export const getToken = async () => {
  return await AsyncStorage.getItem(TOKEN_KEY);
};

export const removeToken = async () => {
  await AsyncStorage.removeItem(TOKEN_KEY);
};

export const getUsernameFromToken = async (): Promise<string | null> => {
  try {
    const token = await getToken();
    if (!token) return null;

    const decoded: any = jwtDecode(token); // ✅ THIS LINE
    return decoded.username || decoded.name || decoded.sub || null;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};
