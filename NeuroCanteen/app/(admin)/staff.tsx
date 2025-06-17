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
  ScrollView
} from 'react-native';
import { Plus, CreditCard as Edit2, Trash2, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import axiosInstance from '../api/axiosInstance';
// import { axiosInstance } from '../../services/axiosInstance';

type Staff = {
  id: number;
  name: string;
  employeeId: string;
  department: string;
  role: string;
  mobileNumber: string;
  password: string;
  paymentDetails: string;
};

export default function StaffManagement() {
  const router = useRouter();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    department: '',
    role: '',
    mobileNumber: '',
    password: '',
    paymentDetails: '',
  });

  useEffect(() => {
    fetchStaffList();
  }, []);

  const fetchStaffList = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get('/staff');
      setStaffList(response.data);
    } catch (error) {
      console.error('Error fetching staff:', error);
      Alert.alert('Error', 'Failed to load staff data');
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
      employeeId: '',
      department: '',
      role: '',
      mobileNumber: '',
      password: '',
      paymentDetails: '',
    });
    setCurrentStaff(null);
    setIsEditMode(false);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (staff: Staff) => {
    setIsEditMode(true);
    setCurrentStaff(staff);
    setFormData({
      name: staff.name,
      employeeId: staff.employeeId,
      department: staff.department || '',
      role: staff.role || '',
      mobileNumber: staff.mobileNumber || '',
      password: staff.password || '',
      paymentDetails: staff.paymentDetails || '',
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.employeeId) {
      Alert.alert('Error', 'Name and Employee ID are required');
      return;
    }

    setIsLoading(true);
    try {
      if (isEditMode && currentStaff) {
        await axiosInstance.put(`/staff/${currentStaff.id}`, formData);
        Alert.alert('Success', 'Staff updated successfully');
      } else {
        await axiosInstance.post('/staff', formData);
        Alert.alert('Success', 'Staff added successfully');
      }
      fetchStaffList();
      setModalVisible(false);
      resetForm();
    } catch (error) {
      console.error('Error saving staff:', error);
      Alert.alert('Error', 'Failed to save staff information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this staff member?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await axiosInstance.delete(`/staff/${id}`);
              fetchStaffList();
              Alert.alert('Success', 'Staff deleted successfully');
            } catch (error) {
              console.error('Error deleting staff:', error);
              Alert.alert('Error', 'Failed to delete staff');
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

  const renderItem = ({ item }: { item: Staff }) => (
    <View style={styles.staffCard}>
      <View style={styles.staffInfo}>
        <Text style={styles.staffName}>{item.name}</Text>
        <Text style={styles.staffDetail}>ID: {item.employeeId}</Text>
        <Text style={styles.staffDetail}>Role: {item.role || 'N/A'}</Text>
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
        <Text style={styles.headerTitle}>Staff Management</Text>
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
          data={staffList}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No staff records found</Text>
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
            <Text style={styles.modalTitle}>{isEditMode ? 'Edit Staff' : 'Add New Staff'}</Text>
            
            <ScrollView style={styles.modalScrollView}>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={formData.name}
              onChangeText={(text) => handleInputChange('name', text)}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Employee ID"
              value={formData.employeeId}
              onChangeText={(text) => handleInputChange('employeeId', text)}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Department"
              value={formData.department}
              onChangeText={(text) => handleInputChange('department', text)}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Role"
              value={formData.role}
              onChangeText={(text) => handleInputChange('role', text)}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Mobile Number"
              value={formData.mobileNumber}
              onChangeText={(text) => handleInputChange('mobileNumber', text)}
              keyboardType="phone-pad"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={formData.password}
              onChangeText={(text) => handleInputChange('password', text)}
              secureTextEntry
            />
            
            <TextInput
              style={styles.input}
              placeholder="Payment Details"
              value={formData.paymentDetails}
              onChangeText={(text) => handleInputChange('paymentDetails', text)}
            />
            </ScrollView>
            
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
  staffCard: {
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
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  staffDetail: {
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
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalScrollView: {
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2E7D32',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
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