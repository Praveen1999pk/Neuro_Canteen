import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Use localhost for web development, and the IP address for mobile devices
const baseURL = Platform.OS === 'web' 
  ? 'http://localhost:8142'
  : 'http://192.168.247.145:8142';

const apiService = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Request interceptor
apiService.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('jwtToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiService.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.status, error.response.data);
      if (error.response.status === 401) {
        // Handle unauthorized access
        AsyncStorage.removeItem('jwtToken');
        // You can add navigation logic here if needed
      }
    } else if (error.request) {
      // Request made but no response received
      console.error('Network Error:', error.request);
    } else {
      // Error in request setup
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Authentication service
export const authService = {
  loginAdmin: async (username: string, password: string) => {
    try {
      const response = await apiService.post('/authenticate/admin', { username, password });
      if (response.data.jwt) {
        await AsyncStorage.setItem('jwtToken', response.data.jwt);
        return { success: true };
      }
      return { success: false, message: 'Invalid credentials' };
    } catch (error) {
      return { success: false, message: 'Failed to connect to the server' };
    }
  },

  loginDelivery: async (username: string, password: string) => {
    try {
      const response = await apiService.post('/authenticate/deliveryuser', { username, password });
      if (response.data.jwt) {
        await AsyncStorage.setItem('jwtToken', response.data.jwt);
        return { success: true };
      }
      return { success: false, message: 'Invalid credentials' };
    } catch (error) {
      return { success: false, message: 'Failed to connect to the server' };
    }
  },

  loginStaff: async (username: string, password: string) => {
    try {
      const response = await apiService.post('/authenticate/staff', { username, password });
      if (response.data.jwt) {
        await AsyncStorage.setItem('jwtToken', response.data.jwt);
        return { success: true };
      }
      return { success: false, message: 'Invalid credentials' };
    } catch (error) {
      return { success: false, message: 'Failed to connect to the server' };
    }
  },

  loginDietitian: async (username: string, password: string) => {
    try {
      const response = await apiService.post('/authenticate/dietitian', { username, password });
      if (response.data.jwt) {
        await AsyncStorage.setItem('jwtToken', response.data.jwt);
        return { success: true };
      }
      return { success: false, message: 'Invalid credentials' };
    } catch (error) {
      return { success: false, message: 'Failed to connect to the server' };
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('jwtToken');
  }
};

export default apiService;

export { apiService }