import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Dimensions,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Minus, Plus, ChevronRight, ArrowLeft, ShoppingCart, History } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../api/axiosInstance';

type MenuItem = {
  id: number;
  name: string;
  description: string;
  staffPrice: number;
  patientPrice: number;
  dietitianPrice: number;
  picture: string | null;
  category: string;
  available: boolean;
  role: string;
  image: string;
};

type CartItems = { [key: string]: number };

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
const CARD_WIDTH = Platform.OS === 'web' ? 300 : (width - (CARD_MARGIN * 4)) / 2;

export default function StaffOrder() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cartItems, setCartItems] = useState<CartItems>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [categories, setCategories] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadCart();
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await axiosInstance.get('/menu-items');
      if (Array.isArray(response.data)) {
        setMenuItems(response.data);
        const uniqueCategories = [...new Set(response.data.map((item: MenuItem) => item.category))];
        console.log('Loaded categories:', uniqueCategories);
        setCategories(['All', ...uniqueCategories]);
      } else {
        console.error('API response is not an array:', response.data);
        setMenuItems([]);
        setCategories([]);
      }
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      setMenuItems([]);
      setCategories([]);
      setLoading(false);
      setRefreshing(false);
      Alert.alert('Error', 'Failed to fetch menu items');
    }
  };

  const loadCart = async () => {
    try {
      const savedCart = await AsyncStorage.getItem('staff_cart');
      if (savedCart) {
        // Clean the saved cart data to remove control characters
        let cleanedCart = savedCart;
        if (typeof cleanedCart === 'string') {
          cleanedCart = cleanedCart.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
        }
        
        try {
          setCartItems(JSON.parse(cleanedCart));
        } catch (parseError) {
          console.error('Error parsing saved cart:', parseError);
          console.error('Cleaned cart data:', cleanedCart);
          // If parsing fails, clear the corrupted cart
          await AsyncStorage.removeItem('staff_cart');
          setCartItems({});
        }
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      // If loading fails, clear the cart
      setCartItems({});
    }
  };

  useEffect(() => {
    const saveCart = async () => {
      try {
        await AsyncStorage.setItem('staff_cart', JSON.stringify(cartItems));
      } catch (error) {
        console.error('Error saving cart:', error);
      }
    };
    saveCart();
  }, [cartItems]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMenuItems();
  };

  const handleAddToCart = (item: MenuItem) => {
    setCartItems((prevCart) => ({
      ...prevCart,
      [item.id]: (prevCart[item.id] || 0) + 1,
    }));
  };

  const handleRemoveFromCart = (item: MenuItem) => {
    setCartItems((prevCart) => {
      const newCart = { ...prevCart };
      if (newCart[item.id] > 1) {
        newCart[item.id] -= 1;
      } else {
        delete newCart[item.id];
      }
      return newCart;
    });
  };

  const handleCheckout = () => {
    if (Object.keys(cartItems).length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }
    
    router.push({
      pathname: '/(staff)/checkout',
      params: { 
        cartItems: JSON.stringify(cartItems),
        menuItems: JSON.stringify(menuItems)
      }
    });
      setCartItems({});
      AsyncStorage.removeItem('staff_cart');
  };

  const handleOrderHistory = () => {
    router.push({
      pathname: '/(staff)/order-history',
      params: {
        orderedUserId: 'admin',
        orderedRole: 'Staff',
      },
    });
  };

  const calculateTotal = () => {
    return Object.keys(cartItems).reduce((total, itemId) => {
      const item = menuItems.find(item => item.id === parseInt(itemId));
      if (!item) return total;
      return total + (item.staffPrice * cartItems[itemId]);
    }, 0);
  };

  const totalItems = Object.values(cartItems).reduce((sum, quantity) => sum + quantity, 0);

  const filteredMenuItems = selectedCategory === 'All' 
  ? menuItems 
  : menuItems.filter(item => item.category === selectedCategory);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#4A8F47" />
        <Text style={styles.loadingText}>Loading menu...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Menu</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.categoryWrapper}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.categoryContainer}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.categoryButtonActive
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategory === category && styles.categoryButtonTextActive
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView
          style={styles.menuArea}
          contentContainerStyle={styles.menuGrid}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filteredMenuItems.map((item) => (
            <View key={item.id} style={styles.menuItem}>
              <Image 
                source={{ uri: item.image }} 
                style={styles.itemImage}
              />
              <View style={styles.menuItemDetails}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemDescription} numberOfLines={2}>
                  {item.description}
                </Text>
                <View style={styles.priceActionContainer}>
                  <Text style={styles.itemPrice}>₹{item.staffPrice}</Text>
                  {cartItems[item.id] ? (
                    <View style={styles.quantityControls}>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => handleRemoveFromCart(item)}
                      >
                        <Minus size={14} color="#4A8F47" />
                      </TouchableOpacity>
                      <Text style={styles.quantityText}>{cartItems[item.id]}</Text>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => handleAddToCart(item)}
                      >
                        <Plus size={14} color="#4A8F47" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => handleAddToCart(item)}
                      disabled={!item.available}
                    >
                      <Text style={styles.addButtonText}>
                        {item.available ? 'ADD' : 'UNAVAILABLE'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {Object.keys(cartItems).length > 0 && (
          <TouchableOpacity style={styles.cartBar} onPress={handleCheckout}>
            <View style={styles.cartInfo}>
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{totalItems}</Text>
              </View>
              <Text style={styles.cartText}>View Cart</Text>
            </View>
            <View style={styles.cartTotal}>
              <Text style={styles.cartTotalText}>₹{calculateTotal()}</Text>
              <ChevronRight size={20} color="white" />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#2E7D32',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
  },
  backButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  content: {
    flex: 1,
  },
  categoryWrapper: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    height: 50,
  },
  categoryContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: '100%',
  },
  categoryButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 4,
    minWidth: 60,
    alignItems: 'center',
  },
  categoryButtonActive: {
    backgroundColor: '#4A8F47',
  },
  categoryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  categoryButtonTextActive: {
    color: 'white',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4A8F47',
  },
  menuArea: {
    flex: 1,
  },
  menuGrid: {
    padding: CARD_MARGIN,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    width: CARD_WIDTH,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: CARD_MARGIN * 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  menuItemDetails: {
    padding: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
  priceActionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4A8F47',
  },
  addButton: {
    backgroundColor: '#4A8F47',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    padding: 2,
  },
  quantityButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  quantityText: {
    marginHorizontal: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  cartBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#4A8F47',
    padding: 15,
    paddingBottom: Platform.OS === 'ios' ? 30 : 15,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cartInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartBadge: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cartBadgeText: {
    color: '#4A8F47',
    fontSize: 12,
    fontWeight: '600',
  },
  cartText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cartTotal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartTotalText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 5,
  },
});