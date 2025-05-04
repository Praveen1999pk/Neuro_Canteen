import axios from 'axios';
import { saveToken, removeToken, isTokenValid } from './tokenService';
import { API_URL } from '../../config';

export const loginStaff = async (username: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/authenticate/staff`, {
      username,
      password,
    });

    const data = response.data;
    if (response.status === 200 && data.jwt) {
      await saveToken(data.jwt);
      return { success: true };
    } else {
      return { success: false, message: 'Invalid credentials' };
    }
  } catch (error: any) {
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to connect to the server' 
    };
  }
};

export const logout = async () => {
  await removeToken();
};

export const checkAuth = async () => {
  return await isTokenValid();
};