// index.tsx
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { Users, User, Bed, Stethoscope, Bike, UtensilsCrossed } from 'lucide-react-native';
import axios from 'axios';
import { getToken } from '../services/tokenService'; // Adjust the path if needed

// --- Axios Setup ---
const API_URL = 'http://192.168.247.145:8142'; // Your actual API URL

const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Axios Request Interceptor
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
export default axiosInstance;
