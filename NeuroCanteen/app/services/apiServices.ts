import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config'; 



const apiService = axios.create({
  baseURL: API_URL,
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
  (error) => Promise.reject(error)
);

// Response interceptor
apiService.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
      if (error.response.status === 401) {
        AsyncStorage.removeItem('jwtToken');
      }
    } else if (error.request) {
      console.error('Network Error:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Auth Service
export const authService = {
  loginAdmin: async (username: string, password: string) => {
    try {
      const response = await apiService.post('/authenticate/admin', { username, password });
      if (response.data.jwt) {
        await AsyncStorage.setItem('jwtToken', response.data.jwt);
        return { success: true };
      }
      return { success: false, message: 'Invalid credentials' };
    } catch {
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
    } catch {
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
    } catch {
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
    } catch {
      return { success: false, message: 'Failed to connect to the server' };
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('jwtToken');
  }
};

export default apiService;
export { apiService };
