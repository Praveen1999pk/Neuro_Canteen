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
  Alert
} from 'react-native';
import { Plus, CreditCard as Edit2, Trash2, ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import axiosInstance from '../api/axiosInstance';

type DeliveryUser = {
  id: number;
  name: string;
  username: string;
  password: string;
  contact: string;
};

export default function DeliveryManagement() {
  const router = useRouter();
  const [deliveryUsers, setDeliveryUsers] = useState<DeliveryUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<DeliveryUser | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    contact: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchDeliveryUsers();
  }, []);

  const fetchDeliveryUsers = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get('/delivery-user');
      setDeliveryUsers(response.data);
    } catch (error) {
      console.error('Error fetching delivery users:', error);
      Alert.alert('Error', 'Failed to load delivery user data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      username: '',
      password: '',
      contact: '',
    });
    setCurrentUser(null);
    setIsEditMode(false);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (user: DeliveryUser) => {
    setIsEditMode(true);
    setCurrentUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      password: user.password || '',
      contact: user.contact || '',
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.username) {
      Alert.alert('Error', 'Name and Username are required');
      return;
    }

    // Check for duplicate username
    const isDuplicate = deliveryUsers.some(
      user => user.username === formData.username && 
      (!isEditMode || (isEditMode && user.id !== currentUser?.id))
    );

    if (isDuplicate) {
      Alert.alert('Error', 'Username already exists. Please use a different username.');
      return;
    }

    if (!formData.contact) {
      Alert.alert('Error', 'Contact is required');
      return;
    }
    if (!/^\d{10}$/.test(formData.contact)) {
      Alert.alert('Error', 'Contact must be exactly 10 digits');
      return;
    }

    setIsLoading(true);
    try {
      if (isEditMode && currentUser) {
        await axiosInstance.put(`/delivery-user/${currentUser.id}`, formData);
        Alert.alert('Success', 'Delivery user updated successfully');
      } else {
        await axiosInstance.post('/delivery-user', formData);
        Alert.alert('Success', 'Delivery user added successfully');
      }
      fetchDeliveryUsers();
      setModalVisible(false);
      resetForm();
    } catch (error) {
      console.error('Error saving delivery user:', error);
      Alert.alert('Error', 'Failed to save delivery user information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this delivery user?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await axiosInstance.delete(`/delivery-user/${id}`);
              fetchDeliveryUsers();
              Alert.alert('Success', 'Delivery user deleted successfully');
            } catch (error) {
              console.error('Error deleting delivery user:', error);
              Alert.alert('Error', 'Failed to delete delivery user');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleBack = () => {
    router.back();
  };

  const renderItem = ({ item }: { item: DeliveryUser }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userDetail}>Username: {item.username}</Text>
        <Text style={styles.userDetail}>Contact: {item.contact || 'N/A'}</Text>
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Plus size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      ) : (
        <FlatList
          data={deliveryUsers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No delivery user records found</Text>
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{isEditMode ? 'Edit Delivery User' : 'Add New Delivery User'}</Text>
            
            <Text style={styles.label}>Name <Text style={{color: 'red'}}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={formData.name}
              onChangeText={(text) => handleInputChange('name', text)}
            />
            
            <Text style={styles.label}>Username <Text style={{color: 'red'}}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={formData.username}
              onChangeText={(text) => handleInputChange('username', text)}
            />
            
            <Text style={styles.label}>Password <Text style={{color: 'red'}}>*</Text></Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={formData.password}
                onChangeText={(text) => handleInputChange('password', text)}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={{ position: 'absolute', right: 16, top: 22 }}
                onPress={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <EyeOff size={20} color="#2E7D32" /> : <Eye size={20} color="#2E7D32" />}
              </TouchableOpacity>
            </View>
            
            <Text style={styles.label}>Contact <Text style={{color: 'red'}}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="Contact"
              value={formData.contact}
              onChangeText={(text) => handleInputChange('contact', text)}
              keyboardType="phone-pad"
            />
            
            <View style={styles.modalButtons}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
  addButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  userDetail: {
    fontSize: 14,
    color: '#666',
    marginVertical: 2,
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
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#2E7D32',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 4,
    flex: 1,
    marginHorizontal: 4,
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
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
});