import axiosInstance from '../api/axiosInstance';
import { MenuItem, CartItem } from './menuService';
import { getUsernameFromToken } from './tokenService';

export interface OrderDetails {
  orderedRole: string;
  orderedName: string;
  orderedUserId: string;
  itemName: string;
  quantity: number;
  category: string;
  price: number;
  orderStatus: string | null;
  paymentType: string;
  paymentStatus: string | null;
  orderDateTime: string;
  address: string;
}

export const createOrder = async (
  cartItems: CartItem,
  menuItems: MenuItem[],
  totalPrice: number,
  address: string,
  paymentType: string = 'COD'
): Promise<any> => {
  try {
    const username = await getUsernameFromToken();
    
    if (!username) {
      throw new Error('User not authenticated');
    }

    const orderDetails: OrderDetails = {
      orderedRole: 'Staff',
      orderedName: username,
      orderedUserId: username,
      itemName: Object.keys(cartItems).map(itemId => {
        const item = menuItems.find(menuItem => menuItem.id === parseInt(itemId));
        return item ? item.name : '';
      }).join(', '),
      quantity: Object.values(cartItems).reduce((acc, qty) => acc + qty, 0),
      category: 'South', // This should be dynamic based on items
      price: totalPrice,
      orderStatus: null,
      paymentType: paymentType,
      paymentStatus: null,
      orderDateTime: new Date().toISOString(),
      address: address
    };

    const response = await axiosInstance.post('/orders', orderDetails);
    return response.data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

export const createPaymentOrder = async (price: number): Promise<any> => {
  try {
    const response = await axiosInstance.post('/payment/createOrder', { price });
    return response.data;
  } catch (error) {
    console.error('Error creating payment order:', error);
    throw error;
  }
};

export const verifyPayment = async (
  paymentData: {
    orderId: string;
    paymentId: string;
    paymentStatus: string;
    paymentMethod: string;
    amount: number;
    createdAt: string;
  }
): Promise<any> => {
  try {
    const response = await axiosInstance.post('/payment/verifyPayment', paymentData);
    return response.data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
};