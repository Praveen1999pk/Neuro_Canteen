import axios from 'axios';
import { getToken } from '../services/tokenService';

const API_URL = 'http://172.20.10.7:8142';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

// const res = await axiosInstance.get('/delivery-data');
// return res.data;