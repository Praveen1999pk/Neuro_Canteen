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
import { Plus, CreditCard as Edit2, Trash2, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import axiosInstance from '../api/axiosInstance';

type KitchenUser = {
  id: number;
  userId: string;
  password: string;
};

export default function KitchenManagement() {
  const router = useRouter();
  const [kitchenUsers, setKitchenUsers] = useState<KitchenUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<KitchenUser | null>(null);
  const [formData, setFormData] = useState({
    userId: '',
    password: '',
  });

  useEffect(() => {
    fetchKitchenUsers();
  }, []);

  const fetchKitchenUsers = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get('/kitchen-users');
      setKitchenUsers(response.data);
    } catch (error) {
      console.error('Error fetching kitchen users:', error);
      Alert.alert('Error', 'Failed to load kitchen user data');
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
      userId: '',
      password: '',
    });
    setCurrentUser(null);
    setIsEditMode(false);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (user: KitchenUser) => {
    setIsEditMode(true);
    setCurrentUser(user);
    setFormData({
      userId: user.userId,
      password: user.password || '',
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!formData.userId) {
      Alert.alert('Error', 'User ID is required');
      return;
    }

    // Check for duplicate user ID
    const isDuplicate = kitchenUsers.some(
      user => user.userId === formData.userId && 
      (!isEditMode || (isEditMode && user.id !== currentUser?.id))
    );

    if (isDuplicate) {
      Alert.alert('Error', 'User ID already exists. Please use a different ID.');
      return;
    }

    setIsLoading(true);
    try {
      if (isEditMode && currentUser) {
        await axiosInstance.put(`/kitchen-users/${currentUser.id}`, formData);
        Alert.alert('Success', 'Kitchen user updated successfully');
      } else {
        await axiosInstance.post('/kitchen-users', formData);
        Alert.alert('Success', 'Kitchen user added successfully');
      }
      fetchKitchenUsers();
      setModalVisible(false);
      resetForm();
    } catch (error) {
      console.error('Error saving kitchen user:', error);
      Alert.alert('Error', 'Failed to save kitchen user information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this kitchen user?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await axiosInstance.delete(`/kitchen-users/${id}`);
              fetchKitchenUsers();
              Alert.alert('Success', 'Kitchen user deleted successfully');
            } catch (error) {
              console.error('Error deleting kitchen user:', error);
              Alert.alert('Error', 'Failed to delete kitchen user');
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

  const renderItem = ({ item }: { item: KitchenUser }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userDetail}>User ID: {item.userId}</Text>
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
        <Text style={styles.headerTitle}>Kitchen Management</Text>
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
          data={kitchenUsers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No kitchen user records found</Text>
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
            <Text style={styles.modalTitle}>{isEditMode ? 'Edit Kitchen User' : 'Add Kitchen User'}</Text>
            
            <TextInput
              style={styles.input}
              placeholder="User ID"
              value={formData.userId}
              onChangeText={(text) => handleInputChange('userId', text)}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={formData.password}
              onChangeText={(text) => handleInputChange('password', text)}
              secureTextEntry
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
});