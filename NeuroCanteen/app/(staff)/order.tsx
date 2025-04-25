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
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Minus, Plus, ChevronRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Menu categories and items
const MENU_ITEMS = {
  solid: [
    {
      id: 1,
      name: 'Masala Dosa',
      description: 'Crispy rice crepe filled with spiced potato mixture',
      staffPrice: 80,
      picture: 'https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg',
      available: true,
      category: 'solid'
    },
    {
      id: 2,
      name: 'Plain Dosa',
      description: 'Traditional crispy rice crepe',
      staffPrice: 60,
      picture: 'https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg',
      available: true,
      category: 'solid'
    },
    {
      id: 3,
      name: 'Idli',
      description: 'Steamed rice cakes served with chutney',
      staffPrice: 40,
      picture: 'https://images.pexels.com/photos/4331491/pexels-photo-4331491.jpeg',
      available: true,
      category: 'solid'
    },
    {
      id: 4,
      name: 'Chapathi',
      description: 'Whole wheat flatbread',
      staffPrice: 30,
      picture: 'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg',
      available: true,
      category: 'solid'
    }
  ],
  semiSolid: [
    {
      id: 5,
      name: 'Pongal',
      description: 'Rice and lentils cooked with pepper and cumin',
      staffPrice: 70,
      picture: 'https://images.pexels.com/photos/11170284/pexels-photo-11170284.jpeg',
      available: true,
      category: 'semiSolid'
    },
    {
      id: 6,
      name: 'Sambar Rice',
      description: 'Rice mixed with lentil-based vegetable stew',
      staffPrice: 65,
      picture: 'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg',
      available: true,
      category: 'semiSolid'
    },
    {
      id: 7,
      name: 'Ghee Rice',
      description: 'Aromatic rice cooked with clarified butter',
      staffPrice: 75,
      picture: 'https://images.pexels.com/photos/7426864/pexels-photo-7426864.jpeg',
      available: true,
      category: 'semiSolid'
    }
  ],
  liquid: [
    {
      id: 8,
      name: 'Mango Smoothie',
      description: 'Fresh mango blended with yogurt',
      staffPrice: 50,
      picture: 'https://images.pexels.com/photos/3625372/pexels-photo-3625372.jpeg',
      available: true,
      category: 'liquid'
    },
    {
      id: 9,
      name: 'Filter Coffee',
      description: 'Traditional South Indian coffee',
      staffPrice: 25,
      picture: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg',
      available: true,
      category: 'liquid'
    },
    {
      id: 10,
      name: 'Orange Juice',
      description: 'Freshly squeezed orange juice',
      staffPrice: 40,
      picture: 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg',
      available: true,
      category: 'liquid'
    },
    {
      id: 11,
      name: 'Apple Juice',
      description: 'Fresh apple juice',
      staffPrice: 40,
      picture: 'https://images.pexels.com/photos/616833/pexels-photo-616833.jpeg',
      available: true,
      category: 'liquid'
    },
    {
      id: 12,
      name: 'Milk',
      description: 'Fresh dairy milk',
      staffPrice: 20,
      picture: 'https://images.pexels.com/photos/2064354/pexels-photo-2064354.jpeg',
      available: true,
      category: 'liquid'
    }
  ]
};

type MenuItem = typeof MENU_ITEMS.solid[0];
type CartItems = { [key: string]: number };
type Category = 'solid' | 'semiSolid' | 'liquid';

export default function StaffOrder() {
  const [cartItems, setCartItems] = useState<CartItems>({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category>('solid');
  const router = useRouter();

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const savedCart = await AsyncStorage.getItem('staff_cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
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
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleAddToCart = (item: MenuItem) => {
    setCartItems((prevCart) => ({
      ...prevCart,
      [item.id]: (prevCart[item.id] || 0) + 1,
    }));
  };

  const handleIncreaseQuantity = (itemId: number) => {
    setCartItems((prevCart) => ({
      ...prevCart,
      [itemId]: (prevCart[itemId] || 0) + 1,
    }));
  };

  const handleDecreaseQuantity = (itemId: number) => {
    setCartItems((prevCart) => {
      const newCart = { ...prevCart };
      if (newCart[itemId] > 1) {
        newCart[itemId] -= 1;
      } else {
        delete newCart[itemId];
      }
      return newCart;
    });
  };

  const handleCheckout = () => {
    if (Object.keys(cartItems).length === 0) {
      alert('Your cart is empty!');
      return;
    }
    
    const allMenuItems = [...MENU_ITEMS.solid, ...MENU_ITEMS.semiSolid, ...MENU_ITEMS.liquid];
    router.push({
      pathname: '/(staff)/checkout',
      params: { 
        cartItems: JSON.stringify(cartItems),
        menuItems: JSON.stringify(allMenuItems)
      }
    });
  };

  const calculateTotal = () => {
    const allMenuItems = [...MENU_ITEMS.solid, ...MENU_ITEMS.semiSolid, ...MENU_ITEMS.liquid];
    return Object.keys(cartItems).reduce((total, itemId) => {
      const item = allMenuItems.find(item => item.id === parseInt(itemId));
      if (!item) return total;
      return total + (item.staffPrice * cartItems[itemId]);
    }, 0);
  };

  const totalItems = Object.values(cartItems).reduce((sum, quantity) => sum + quantity, 0);

  const CategoryButton = ({ category, title }: { category: Category; title: string }) => (
    <TouchableOpacity
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
        {title}
      </Text>
    </TouchableOpacity>
  );

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
      <View style={styles.categoryContainer}>
        <CategoryButton category="solid" title="Solid" />
        <CategoryButton category="semiSolid" title="Semi Solid" />
        <CategoryButton category="liquid" title="Liquid" />
      </View>

      <ScrollView
        style={styles.menuArea}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {MENU_ITEMS[selectedCategory].map((item) => (
          <View key={item.id} style={styles.menuItem}>
            <Image source={{ uri: item.picture }} style={styles.itemImage} />
            <View style={styles.menuItemDetails}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDescription} numberOfLines={2}>
                {item.description}
              </Text>
              <Text style={styles.itemPrice}>₹{item.staffPrice}</Text>

              {cartItems[item.id] ? (
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => handleDecreaseQuantity(item.id)}
                  >
                    <Minus size={16} color="#4A8F47" />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{cartItems[item.id]}</Text>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => handleIncreaseQuantity(item.id)}
                  >
                    <Plus size={16} color="#4A8F47" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => handleAddToCart(item)}
                >
                  <Text style={styles.addButtonText}>ADD</Text>
                </TouchableOpacity>
              )}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  categoryContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  categoryButtonActive: {
    backgroundColor: '#4A8F47',
  },
  categoryButtonText: {
    fontSize: 14,
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
  menuItem: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  menuItemDetails: {
    padding: 15,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A8F47',
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#4A8F47',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4A8F47',
    borderRadius: 6,
  },
  quantityText: {
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  cartBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#4A8F47',
    padding: 15,
    paddingBottom: Platform.OS === 'ios' ? 30 : 15,
    marginTop: 15,
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