import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_URL } from '../../config';

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


export const loginKitchen = async (username: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/authenticate/kitchenuser`, {
      username,
      password,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = response.data;
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

export const loginpatient = async (uhid: string) => {
  try {
    if (!uhid || uhid.trim() === "") {
      return { success: false, message: 'UHID is required' };
    }

    const response = await axios.post(`${API_URL}/authenticate/patient`, {
      uhid,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = response.data;
    if (response.status === 200 && data.jwt) {
      await AsyncStorage.setItem('jwtToken', data.jwt);
      return { success: true };
    } else {
      return { success: false, message: data.message || 'Invalid UHID' };
    }
  } catch (error: any) {
    return { 
      success: false, 
      message: error.response?.data?.message || 'Server error' 
    };
  }
};