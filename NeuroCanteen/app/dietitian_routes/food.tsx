import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  FlatList,
  TextInput,
  Dimensions,
  Platform
} from 'react-native';
import { useRouter} from 'expo-router';
import { ShoppingCart, Search, Plus, Check, Clock, Calendar } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import axiosInstance from '../api/axiosInstance';
import DateTimePicker from '@react-native-community/datetimepicker';


const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

interface FoodItem {
  id: number;
  name: string;
  category: string;
  picture: string | null;
  description: string;
  staffPrice: number;
  patientPrice: number;
  dietitianPrice: number;
  combination: string | null;
  available: boolean;
  diet_type : string;
}

interface DietFilter {
  dietTypes: string[] | null;
  consistencies: Record<string, boolean>;
  dislikes: string[];
}

interface CartItem {
  item: FoodItem;
  quantity: number;
  scheduledTime?: Date;
}

export default function FoodScreen() {
  const router = useRouter();
  const navigation = useNavigation<any>()
  const route = useRoute();
  const {diet} = route.params as {diet:DietFilter};
  const [foodData, setFoodData] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  useEffect(() => {
    const fetchRooms = async () => {
    try {
        const response = await axiosInstance.get(`/menu-items`);
        const data = response.data;
        const filteredItems = filterFoodItems(data, diet);
        setFoodData(filteredItems)
    } catch (error) {
        console.error('Failed to fetch rooms:', error);
    }
    };

    fetchRooms();
}, []);


function filterFoodItems(data: FoodItem[], filters: DietFilter): FoodItem[] {
  // Get all selected consistencies (categories) from the diet plan
  const selectedCategories = Object.keys(filters.consistencies).filter(
    (cat) => filters.consistencies[cat]
  );

  const dietTypes = filters.dietTypes?.map(d => d.toLowerCase()) || [];
  const dislikedTerms = filters.dislikes.map(term => term.toLowerCase());

  console.log('Filtering with:', {
    selectedCategories,
    dietTypes,
    dislikedTerms,
    totalItems: data.length
  });

  return data.filter(item => {
    // Only show food items whose category is in the selected consistencies
    if (!selectedCategories.includes(item.category)) {
      console.log(`Filtered out ${item.name} - category ${item.category} not in selected categories`);
      return false;
    }

    // If diet types are specified, only show foods that have diet types matching the requirements
    if (dietTypes.length > 0) {
      const itemDiets = (item.diet_type || "").toLowerCase().split(',').map(d => d.trim());
      const hasMatchingDiet = dietTypes.some(dietType => 
        itemDiets.some(diet => {
          // Check for exact match or partial match
          return diet === dietType || 
                 diet.includes(dietType) || 
                 dietType.includes(diet) ||
                 // Handle common variations
                 (dietType === 'ckd' && (diet.includes('kidney') || diet.includes('renal'))) ||
                 (dietType === 'diabetic' && (diet.includes('diabetes') || diet.includes('sugar'))) ||
                 (dietType === 'low-salt' && (diet.includes('salt') || diet.includes('sodium')));
        })
      );
      
      if (!hasMatchingDiet) {
        console.log(`Filtered out ${item.name} - diet types [${itemDiets}] don't match required [${dietTypes}]`);
        return false;
      }
      
      console.log(`Included ${item.name} - diet types [${itemDiets}] match required [${dietTypes}]`);
    }

    // Filter out disliked items
    const nameLower = item.name.toLowerCase();
    const hasDislike = dislikedTerms.some(dislike => nameLower.includes(dislike));
    if (hasDislike) {
      console.log(`Filtered out ${item.name} - contains disliked term`);
      return false;
    }

    return true;
  });
}

  useEffect(() => {
    const uniqueCategories = Array.from(new Set(foodData.map(item => item.category)));
    setCategories(uniqueCategories);
  }, [foodData]);
  
  const filteredFoodItems = foodData.filter(item => 
    item.available && // Only show available items
    (selectedCategory === 'All' || item.category === selectedCategory) &&
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const addToCart = (item: FoodItem) => {
    const existingItemIndex = cart.findIndex(cartItem => cartItem.item.id === item.id);
    
    if (existingItemIndex !== -1) {
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      setSelectedItemId(item.id);
      setShowTimePicker(true);
    }
  };
  
  const removeFromCart = (itemId: number) => {
    const existingItemIndex = cart.findIndex(cartItem => cartItem.item.id === itemId);
    
    if (existingItemIndex !== -1) {
      const updatedCart = [...cart];
      if (updatedCart[existingItemIndex].quantity > 1) {
        updatedCart[existingItemIndex].quantity -= 1;
      } else {
        updatedCart.splice(existingItemIndex, 1);
      }
      setCart(updatedCart);
    }
  };
  
  const calculateTotal = () => {
    return cart.reduce((total, cartItem) => {
      return total + (cartItem.item.dietitianPrice * cartItem.quantity);
    }, 0);
  };
  
  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    const orderSummary = {
      items: cart,
      total: calculateTotal(),
      timestamp: new Date().toISOString(),
    };
    
    console.log('Order submitted:');
    // alert('Order successfully placed!');

    const navigateOrederSuccess = (order_detailes:object) => {
      navigation.navigate('checkout',{order_detailes});
    };
    navigateOrederSuccess(orderSummary);
  };
  
  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    
    if (selectedDate && selectedItemId) {
      const item = foodData.find(food => food.id === selectedItemId);
      if (item) {
        const existingItemIndex = cart.findIndex(cartItem => cartItem.item.id === item.id);
        if (existingItemIndex !== -1) {
          const updatedCart = [...cart];
          updatedCart[existingItemIndex].scheduledTime = selectedDate;
          setCart(updatedCart);
        } else {
          setCart([...cart, { item, quantity: 1, scheduledTime: selectedDate }]);
        }
      }
    }
    setSelectedItemId(null);
  };

  const showTimePickerForItem = (itemId: number) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(true);
    }
    setSelectedItemId(itemId);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate && selectedItemId) {
      const item = foodData.find(food => food.id === selectedItemId);
      if (item) {
        const existingItemIndex = cart.findIndex(cartItem => cartItem.item.id === item.id);
        if (existingItemIndex !== -1) {
          const updatedCart = [...cart];
          const currentTime = updatedCart[existingItemIndex].scheduledTime || new Date();
          const newDateTime = new Date(selectedDate);
          newDateTime.setHours(currentTime.getHours(), currentTime.getMinutes());
          updatedCart[existingItemIndex].scheduledTime = newDateTime;
          setCart(updatedCart);
        }
      }
    }
  };

  const showDatePickerForItem = (itemId: number) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(true);
    }
    setSelectedItemId(itemId);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const renderFoodItem = ({ item }: { item: FoodItem }) => {
    const isInCart = cart.some(cartItem => cartItem.item.id === item.id);
    const cartItem = cart.find(cartItem => cartItem.item.id === item.id);
    
    return (
      <View style={styles.foodCard}>
        {item.picture ? (
          <Image 
            source={{ uri: item.picture }} 
            style={styles.foodImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>{item.name[0]}</Text>
          </View>
        )}
        
        <View style={styles.foodContent}>
          <Text style={styles.foodName}>{item.name}</Text>
          
          {item.description ? (
            <Text style={styles.foodDescription} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          
          <View style={styles.priceRow}>
            <Text style={styles.foodPrice}>₹{item.dietitianPrice.toFixed(2)}</Text>
            
            {isInCart ? (
              <View style={styles.quantityControl}>
                <TouchableOpacity 
                  style={styles.quantityButton}
                  onPress={() => removeFromCart(item.id)}
                >
                  <Text style={styles.quantityButtonText}>-</Text>
                </TouchableOpacity>
                
                <Text style={styles.quantity}>{cartItem?.quantity || 0}</Text>
                
                <TouchableOpacity 
                  style={styles.quantityButton}
                  onPress={() => addToCart(item)}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => addToCart(item)}
              >
                <Plus size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          {isInCart && (
            <View style={styles.scheduleContainer}>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => showDatePickerForItem(item.id)}
              >
                <Calendar size={16} color="#166534" />
                <Text style={styles.dateText}>
                  {cartItem?.scheduledTime ? formatDate(cartItem.scheduledTime) : 'Set Date'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.timeButton}
                onPress={() => showTimePickerForItem(item.id)}
              >
                <Clock size={16} color="#166534" />
                <Text style={styles.timeText}>
                  {cartItem?.scheduledTime ? formatTime(cartItem.scheduledTime) : 'Set Time'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search food items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <TouchableOpacity 
          style={styles.cartButton}
          onPress={() => setShowCart(!showCart)}
        >
          <ShoppingCart size={24} color="#166534" />
          {cart.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {cart.reduce((total, item) => total + item.quantity, 0)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Filter Indicators */}
      {((diet.dietTypes && diet.dietTypes.length > 0) || (diet.dislikes && diet.dislikes.length > 0)) && (
        <View style={styles.filterIndicatorContainer}>
          <Text style={styles.filterIndicatorTitle}>Active Filters:</Text>
          <View style={styles.filterTagsContainer}>
            {diet.dietTypes?.map((dietType, index) => (
              <View key={`diet-${index}`} style={styles.filterTag}>
                <Text style={styles.filterTagText}>Diet: {dietType}</Text>
              </View>
            ))}
            {diet.dislikes?.map((dislike, index) => (
              <View key={`dislike-${index}`} style={styles.dislikeFilterTag}>
                <Text style={styles.filterTagText}>Exclude: {dislike}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.filterSummary}>
            Showing {filteredFoodItems.length} of {foodData.length} foods
          </Text>
        </View>
      )}
      
      <View style={styles.categoryContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryTabs}
        >
          <TouchableOpacity 
            style={[
              styles.categoryTab, 
              selectedCategory === 'All' && styles.selectedCategoryTab
            ]}
            onPress={() => setSelectedCategory('All')}
          >
            <Text style={[
              styles.categoryTabText,
              selectedCategory === 'All' && styles.selectedCategoryTabText
            ]}>
              All
            </Text>
          </TouchableOpacity>
          
          {categories.map((category, index) => (
            <TouchableOpacity 
              key={index}
              style={[
                styles.categoryTab, 
                selectedCategory === category && styles.selectedCategoryTab
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryTabText,
                selectedCategory === category && styles.selectedCategoryTabText
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <FlatList
        data={filteredFoodItems}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderFoodItem}
        numColumns={2}
        contentContainerStyle={styles.foodGrid}
        columnWrapperStyle={styles.foodRow}
        ListEmptyComponent={
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateTitle}>No foods found</Text>
            <Text style={styles.emptyStateDescription}>
              No foods match your current filters. Try adjusting your diet types or categories.
            </Text>
          </View>
        }
      />
      
      {showDatePicker && (
        <DateTimePicker
          testID="datePicker"
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}
      
      {showTimePicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={selectedTime}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}
      
      {showCart && (
        <View style={styles.cartContainer}>
          <View style={styles.cartHeader}>
            <Text style={styles.cartTitle}>Your Order</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowCart(false)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          
          {cart.length === 0 ? (
            <View style={styles.emptyCart}>
              <Text style={styles.emptyCartText}>Your cart is empty</Text>
              <TouchableOpacity 
                style={styles.addItemsButton}
                onPress={() => setShowCart(false)}
              >
                <Text style={styles.addItemsButtonText}>Add Items</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <ScrollView style={styles.cartItemsContainer}>
                {cart.map((cartItem, index) => (
                  <View key={index} style={styles.cartItem}>
                    {cartItem.item.picture ? (
                      <Image 
                        source={{ uri: cartItem.item.picture }}
                        style={styles.cartItemImage}
                      />
                    ) : (
                      <View style={styles.cartItemPlaceholder}>
                        <Text style={styles.cartItemPlaceholderText}>
                          {cartItem.item.name[0]}
                        </Text>
                      </View>
                    )}
                    
                    <View style={styles.cartItemInfo}>
                      <Text style={styles.cartItemName}>{cartItem.item.name}</Text>
                      <Text style={styles.cartItemPrice}>
                        ₹{(cartItem.item.dietitianPrice * cartItem.quantity).toFixed(2)}
                      </Text>
                    </View>
                    
                    <View style={styles.cartItemQuantity}>
                      <TouchableOpacity 
                        style={styles.quantityButton}
                        onPress={() => removeFromCart(cartItem.item.id)}
                      >
                        <Text style={styles.quantityButtonText}>-</Text>
                      </TouchableOpacity>
                      
                      <Text style={styles.quantity}>{cartItem.quantity}</Text>
                      
                      <TouchableOpacity 
                        style={styles.quantityButton}
                        onPress={() => addToCart(cartItem.item)}
                      >
                        <Text style={styles.quantityButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
              
              <View style={styles.cartFooter}>
                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalAmount}>₹{calculateTotal().toFixed(2)}</Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.checkoutButton}
                  onPress={handleCheckout}
                >
                  <Text style={styles.checkoutButtonText}>Confirm Diet</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#0f172a',
  },
  cartButton: {
    marginLeft: 16,
    position: 'relative',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoryContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  categoryTabs: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 4,
  },
  selectedCategoryTab: {
    backgroundColor: '#166534',
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  selectedCategoryTabText: {
    color: '#fff',
  },
  foodGrid: {
    padding: 16,
  },
  foodRow: {
    justifyContent: 'space-between',
  },
  foodCard: {
    width: cardWidth,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  foodImage: {
    width: '100%',
    height: 140,
  },
  placeholderImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  foodContent: {
    padding: 12,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  foodDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16a34a',
  },
  addButton: {
    backgroundColor: '#166534',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginHorizontal: 8,
    minWidth: 20,
    textAlign: 'center',
  },
  cartContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  cartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#64748b',
    lineHeight: 24,
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyCartText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 16,
  },
  addItemsButton: {
    backgroundColor: '#166534',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addItemsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  cartItemsContainer: {
    flex: 1,
    padding: 16,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  cartItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  cartItemPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartItemPlaceholderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  cartItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0f172a',
    marginBottom: 4,
  },
  cartItemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16a34a',
  },
  cartItemQuantity: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  cartFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    color: '#64748b',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  checkoutButton: {
    backgroundColor: '#166534',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scheduleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  dateText: {
    color: '#166534',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flex: 1,
  },
  timeText: {
    color: '#166534',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  filterIndicatorContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterIndicatorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  filterTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterTag: {
    padding: 4,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  filterTagText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#166534',
  },
  dislikeFilterTag: {
    padding: 4,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  filterSummary: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 16,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#64748b',
  },
});