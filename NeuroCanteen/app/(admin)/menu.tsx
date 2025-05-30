import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Modal, 
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
  Image,
  ScrollView
} from 'react-native';
import { Plus, CreditCard as Edit2, Trash2, Camera } from 'lucide-react-native';
import axiosInstance from '../api/axiosInstance';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

const timeSlots = ['morning', 'afternoon', 'evening', 'dinner'];
const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
type TimeSlotType = {
  [day: string]: string[];
};

type MenuItem = {
  id: number;
  name: string;
  category: string;
  picture: string;
  description: string;
  available: boolean;
  staffPrice: string;
  patientPrice: string;
  dietitianPrice: string;
  timeSlot: TimeSlotType;
  combination: string;
  diet_type: string;
};

const AvailabilityMatrix = ({ 
  availability = {}, 
  onToggle 
}: {
  availability: TimeSlotType;
  onToggle: (day: string, time: string, checked: boolean) => void;
}) => {
  const dayAbbreviations = {
    sunday: 'Sun',
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat'
  };

  const formatTimeSlot = (slot: string) => {
    const slotMap: Record<string, string> = {
      morning: 'Morning',
      afternoon: 'Afternoon',
      evening: 'Evening',
      dinner: 'Dinner'
    };
    return slotMap[slot] || slot;
  };

  return (
    <View style={styles.matrixOuterContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.matrixScrollContent}
      >
        <View style={styles.matrixContainer}>
          {/* Header Row */}
          <View style={styles.matrixHeader}>
            <View style={[styles.matrixHeaderCell, styles.dayHeaderCell]}>
              <Text style={styles.matrixHeaderText}>Day/Time</Text>
            </View>
            {timeSlots.map((slot) => (
              <View key={slot} style={styles.matrixHeaderCell}>
                <Text style={styles.matrixHeaderText}>{formatTimeSlot(slot)}</Text>
              </View>
            ))}
          </View>
          
          {/* Data Rows */}
          {days.map((day) => (
            <View key={day} style={styles.matrixRow}>
              <View style={[styles.matrixDayCell, styles.dayCell]}>
                <Text style={styles.matrixDayText}>{dayAbbreviations[day as keyof typeof dayAbbreviations]}</Text>
              </View>
              {timeSlots.map((time) => {
                const isChecked = availability[day]?.includes(time) || false;
                return (
                  <TouchableOpacity 
                    key={time}
                    style={styles.matrixCell}
                    onPress={() => onToggle(day, time, !isChecked)}
                  >
                    <Text>{isChecked ? '✅' : '⬜'}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentItem, setCurrentItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    picture: '',
    description: '',
    available: true,
    staffPrice: '',
    patientPrice: '',
    dietitianPrice: '',
    timeSlot: {} as TimeSlotType,
    combination: '',
    diet_type: ''
  });

  useEffect(() => {
    fetchMenuItems();
  }, []);

const fetchMenuItems = async () => {
  setIsLoading(true);
  try {
    const response = await axiosInstance.get('/menu-items');
    
    const data = response.data.map((item: any) => {

      let timeSlot: { [key: string]: string[] } = {};
      if (typeof item.timeSlot === 'string') {
        try {
          timeSlot = JSON.parse(item.timeSlot);
        } catch (e) {
          console.warn('Failed to parse timeSlot string', e);
        }
      } else if (item.timeSlot) {
        timeSlot = item.timeSlot;
      }

      const normalizedTimeSlot: TimeSlotType = {};
      Object.keys(timeSlot).forEach(day => {
        const lowercaseDay = day.toLowerCase();
        normalizedTimeSlot[lowercaseDay] = timeSlot[day].map((slot: string) => 
          slot.toLowerCase()
        );
      });

      return {
        ...item,
        timeSlot: normalizedTimeSlot
      };
    });
    setMenuItems(data);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    Alert.alert('Error', 'Failed to load menu data');
  } finally {
    setIsLoading(false);
  }
};

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleTimeSlotToggle = (day: string, time: string, checked: boolean) => {
    const current = formData.timeSlot[day] || [];
    const updated = checked
      ? [...new Set([...current, time])]
      : current.filter(t => t !== time);
    
    setFormData({
      ...formData,
      timeSlot: {
        ...formData.timeSlot,
        [day]: updated
      }
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      picture: '',
      description: '',
      available: true,
      staffPrice: '',
      patientPrice: '',
      dietitianPrice: '',
      timeSlot: {},
      combination: '',
      diet_type: ''
    });
    setCurrentItem(null);
    setIsEditMode(false);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

const openEditModal = (item: MenuItem) => {
  setIsEditMode(true);
  setCurrentItem(item);
  
  const initialTimeSlot = item.timeSlot || {};
  const normalizedTimeSlot: TimeSlotType = {};
  
  Object.keys(initialTimeSlot).forEach(day => {
    const lowercaseDay = day.toLowerCase();
    normalizedTimeSlot[lowercaseDay] = initialTimeSlot[day].map((slot: string) => 
      slot.toLowerCase()
    );
  });

  setFormData({
    name: item.name,
    category: item.category || '',
    picture: item.picture || '',
    description: item.description || '',
    available: item.available,
    staffPrice: item.staffPrice ? item.staffPrice.toString() : '', 
    patientPrice: item.patientPrice ? item.patientPrice.toString() : '', 
    dietitianPrice: item.dietitianPrice ? item.dietitianPrice.toString() : '', 
    timeSlot: normalizedTimeSlot,
    combination: item.combination || '',
    diet_type: item.diet_type || ''
  });
  setModalVisible(true);
};

const handleSubmit = async () => {
  if (!formData.name || !formData.category) {
    Alert.alert('Error', 'Name and Category are required');
    return;
  }



  setIsLoading(true);
  try {
    // Ensure timeSlot data is properly formatted
    const normalizedTimeSlot: TimeSlotType = {};
    Object.keys(formData.timeSlot).forEach(day => {
      const lowercaseDay = day.toLowerCase();
      normalizedTimeSlot[lowercaseDay] = formData.timeSlot[day].map((slot: string) => 
        slot.toLowerCase()
      );
    });

    const payload = {
      ...formData,
      timeSlot: normalizedTimeSlot
    };

    

    if (isEditMode && currentItem) {
      const response = await axiosInstance.put(`/menu-items/${currentItem.id}`, payload);
      Alert.alert('Success', 'Menu item updated successfully');
    } else {
      const response = await axiosInstance.post('/menu-items', payload);
      Alert.alert('Success', 'Menu item added successfully');
    }
    fetchMenuItems();
    setModalVisible(false);
    resetForm();
  } catch (error) {
    console.error('Error saving menu item:', error);
    Alert.alert('Error', `Failed to save menu item: ${(error as any).message || 'Unknown error'}`);
  } finally {
    setIsLoading(false);
  }
};
  const handleDelete = (id: number) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this menu item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await axiosInstance.delete(`/menu-items/${id}`);
              fetchMenuItems();
              Alert.alert('Success', 'Menu item deleted successfully');
            } catch (error) {
              console.error('Error deleting menu item:', error);
              Alert.alert('Error', 'Failed to delete menu item');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: MenuItem }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemImageContainer}>
        {item.picture ? (
          <Image source={{ uri: item.picture }} style={styles.itemImage} resizeMode="cover" />
        ) : (
          <View style={styles.noImageContainer}>
            <Camera size={32} color="#CCCCCC" />
          </View>
        )}
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDetail}>Category: {item.category}</Text>
        <Text style={styles.itemDetail}>Combination: {item.combination || 'N/A'}</Text>
        <Text style={styles.itemDetail}>Diet Type: {item.diet_type || 'N/A'}</Text>
        <View style={styles.availabilityContainer}>
          <Text style={styles.itemDetail}>Available:</Text>
          <View style={[styles.availabilityIndicator, { backgroundColor: item.available ? '#4CAF50' : '#F44336' }]} />
        </View>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]} 
          onPress={() => openEditModal(item)}
        >
          <Edit2 size={16} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]} 
          onPress={() => handleDelete(item.id)}
        >
          <Trash2 size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const pickImage = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission Denied', 'Permission to access media library is required!');
    return;
  }

  let result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 1,
  });

  if (!result.canceled && result.assets && result.assets.length > 0) {
    // If your backend expects base64 encoded image
    const base64Image = await FileSystem.readAsStringAsync(result.assets[0].uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    setFormData({
      ...formData,
      picture: `data:image/jpeg;base64,${base64Image}`,
    });
  }
};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menu Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      ) : (
        <FlatList
          data={menuItems}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No menu items found</Text>
            </View>
          }
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalInnerContainer}>
            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalContentContainer}
            >
              <Text style={styles.modalTitle}>
                {isEditMode ? 'Edit Menu Item' : 'Add New Menu Item'}
              </Text>
              
              <TextInput
                style={styles.input}
                placeholder="Item Name"
                value={formData.name}
                onChangeText={(text) => handleInputChange('name', text)}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Category"
                value={formData.category}
                onChangeText={(text) => handleInputChange('category', text)}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Combination"
                value={formData.combination}
                onChangeText={(text) => handleInputChange('combination', text)}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Diet Type"
                value={formData.diet_type}
                onChangeText={(text) => handleInputChange('diet_type', text)}
              />
              
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Description"
                multiline
                numberOfLines={3}
                value={formData.description}
                onChangeText={(text) => handleInputChange('description', text)}
              />
              
              <View style={styles.imagePickerContainer}>
                <Text style={styles.imagePickerLabel}>Item Image</Text>
                <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                  <Camera size={24} color="#2E7D32" />
                  <Text style={styles.imagePickerText}>Choose Image</Text>
                </TouchableOpacity>
                
                {formData.picture ? (
                  <View style={styles.previewImageContainer}>
                    <Image source={{ uri: formData.picture }} style={styles.previewImage} />
                  </View>
                ) : null}
              </View>
              
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Available</Text>
                <Switch
                  value={formData.available}
                  onValueChange={(value) => handleInputChange('available', value)}
                  trackColor={{ false: '#CCCCCC', true: '#4CAF50' }}
                  thumbColor="#FFFFFF"
                />
              </View>
              
              <Text style={styles.sectionLabel}>Pricing</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Staff Price"
                value={formData.staffPrice}
                onChangeText={(text) => handleInputChange('staffPrice', text)}
                keyboardType="numeric"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Patient Price"
                value={formData.patientPrice}
                onChangeText={(text) => handleInputChange('patientPrice', text)}
                keyboardType="numeric"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Dietitian Price"
                value={formData.dietitianPrice}
                onChangeText={(text) => handleInputChange('dietitianPrice', text)}
                keyboardType="numeric"
              />

              <Text style={styles.sectionLabel}>Availability Time Slot</Text>
              <AvailabilityMatrix
                availability={formData.timeSlot}
                onToggle={handleTimeSlotToggle}
              />
            </ScrollView>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSubmit}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ... (keep your existing styles the same)
const styles = StyleSheet.create({
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2E7D32',
    textAlign: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2E7D32',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 30,
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  itemImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    marginRight: 16,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  itemDetail: {
    fontSize: 14,
    color: '#666',
    marginVertical: 2,
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
   modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: '100%',
  },
  modalInnerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    width: '90%',
    maxHeight: '90%',
    maxWidth: 400, // Optional: set a maximum width for larger screens
  },
  modalScrollView: {
    width: '100%',
  },
  modalContentContainer: {
    padding: 20,
    paddingBottom: 10, // Reduced bottom padding since buttons are fixed
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#fff',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
    minWidth: 120,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#9E9E9E',
  },
  saveButton: {
    backgroundColor: '#2E7D32',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  imagePickerContainer: {
    marginBottom: 16,
  },
  imagePickerLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },
  imagePickerText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#2E7D32',
  },
  previewImageContainer: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 8,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
 // Matrix styles
matrixOuterContainer: {
  marginBottom: 20,
  width: '100%',
},
matrixScrollContent: {
  paddingRight: 20,
},
matrixContainer: {
  borderWidth: 1,
  borderColor: '#E0E0E0',
  borderRadius: 8,
  overflow: 'hidden',

},
matrixHeader: {
  flexDirection: 'row',
  backgroundColor: '#2E7D32',
},
matrixHeaderCell: {
  width: 70, // Wider cells
  padding: 0,
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 45,
},
dayHeaderCell: {
  width: 70, // Wider day header
  backgroundColor: '#1B5E20',
},
matrixHeaderText: {
  color: '#fff',
  fontWeight: 'bold',
  fontSize: 14,
},
matrixRow: {
  flexDirection: 'row',
  borderBottomWidth: 1,
  borderBottomColor: '#E0E0E0',
  minHeight: 45,
},
matrixDayCell: {
  padding: 10,
  backgroundColor: '#F5F5F5',
  justifyContent: 'center',
},
dayCell: {
  width: 70, // Matches header width
},
matrixDayText: {
  fontSize: 14,
  fontWeight: 'bold',
},
matrixCell: {
  width: 70,
  padding: 10,
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 45,
},
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#2E7D32',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2E7D32',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
});