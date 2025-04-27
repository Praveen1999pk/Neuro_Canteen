import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.247.145:8142';

export const loginAdmin = async (username: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/authenticate/admin`, {
      username,
      password,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = response.data;
    console.log(data)
    if (response.status === 200 && data.jwt) {
      await AsyncStorage.setItem('jwtToken', data.jwt);
      return { success: true };
    } else {
      return { success: false, message: 'Invalid credentials' };
    }

  } catch (error: any) {
    return { success: false, message: 'Failed to connect to the server' };
  }
};

export const loginDelivery = async (username: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/authenticate/deliveryuser`, {
      username,
      password,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = response.data;
    console.log(data)
    if (response.status === 200 && data.jwt) {
      await AsyncStorage.setItem('jwtToken', data.jwt);
      return { success: true };
    } else {
      return { success: false, message: 'Invalid credentials' };
    }

  } catch (error: any) {
    return { success: false, message: 'Failed to connect to the server' };
  }
};



export const loginStaff = async (username: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/authenticate/staff`, {
      username,
      password,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = response.data;
    console.log(data)
    if (response.status === 200 && data.jwt) {
      await AsyncStorage.setItem('jwtToken', data.jwt);
      return { success: true };
    } else {
      return { success: false, message: 'Invalid credentials' };
    }

  } catch (error: any) {
    return { success: false, message: 'Failed to connect to the server' };
  }
};
export const loginDietitian = async (username: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/authenticate/dietitian`, {

      username,
      password,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = response.data;
    console.log(data)
    if (response.status === 200 && data.jwt) {
      await AsyncStorage.setItem('jwtToken', data.jwt);
      return { success: true };
    } else {
      return { success: false, message: 'Invalid credentials' };
    }

  } catch (error: any) {
    return { success: false, message: 'Failed to connect to the server' };
  }

};

