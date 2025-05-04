// index.tsx
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { Users, User, Bed, Stethoscope, Bike, UtensilsCrossed } from 'lucide-react-native';
import axios from 'axios';
import { getToken } from '../services/tokenService'; // Adjust the path if needed
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../config';

const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('jwtToken');
    console.log('Token:', token); // Debugging line to check the token value
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
// axiosInstance.interceptors.response.use(
//   (response) => {
//     return response;
//   },
//   (error) => {
//     if (error.response) {
//       console.error('API Error:', error.response.status, error.response.data);
//     } else if (error.request) {
//       console.error('Network Error:', error.request);
//     } else {
//       console.error('Error:', error.message);
//     }
//     return Promise.reject(error);
//   }
// );

export default axiosInstance;