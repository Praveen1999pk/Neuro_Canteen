import axiosInstance from '../api/axiosInstance';

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  staffPrice: number;
  category: string;
  picture: string;
  available: boolean;
}

export interface CartItem {
  [key: number]: number;
}

export const fetchMenuItems = async (): Promise<MenuItem[]> => {
  try {
    const response = await axiosInstance.get('/menu-items');
    return response.data;
  } catch (error) {
    console.error('Error fetching menu items:', error);
    throw error;
  }
};

export const getUniqueCategories = (menuItems: MenuItem[]): string[] => {
  return [...new Set(menuItems.map(item => item.category))];
};

export const calculateItemTotal = (item: MenuItem, quantity: number): number => {
  return item.staffPrice * quantity;
};

export const calculateOrderTotal = (cartItems: CartItem, menuItems: MenuItem[]): number => {
  let total = 0;
  for (const itemId in cartItems) {
    const item = menuItems.find(menuItem => menuItem.id === parseInt(itemId));
    if (item) {
      total += calculateItemTotal(item, cartItems[itemId]);
    }
  }
  return total;
};