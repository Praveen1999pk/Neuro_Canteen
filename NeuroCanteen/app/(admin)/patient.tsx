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

type Patient = {
  id: number;
  name: string;
  uhid: string;
  ipId: string;
  age: number;
  gender: string;
  primaryConsultant: string;
  diagnosisDescription: string;
  admissionDateTime: string | null;
  dischargeDateTime: string | null;
  patientStatus: string;
  roomNo: string;
  bedNo: string;
  floor: string;
  ward: string;
  patientMobileNo: string;
  attendantContact: string;
};

export default function PatientManagement() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    uhid: '',
    ipId: '',
    age: '',
    gender: '',
    primaryConsultant: '',
    diagnosisDescription: '',
    admissionDateTime: '',
    dischargeDateTime: '',
    patientStatus: '',
    roomNo: '',
    bedNo: '', 
    floor: '',
    ward: '',
    patientMobileNo: '',
    attendantContact: '',
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get('/patient/all');
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
      Alert.alert('Error', 'Failed to load patient data');
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
      uhid: '',
      ipId: '',
      age: '',
      gender: '',
      primaryConsultant: '',
      diagnosisDescription: '',
      admissionDateTime: '',
      dischargeDateTime: '',
      patientStatus: '',
      roomNo: '',
      bedNo: '',
      floor: '',
      ward: '',
      patientMobileNo: '',
      attendantContact: '',
    });
    setCurrentPatient(null);
    setIsEditMode(false);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (patient: Patient) => {
    setIsEditMode(true);
    setCurrentPatient(patient);
    setFormData({
      name: patient.name,
      uhid: patient.uhid,
      ipId: patient.ipId || '',
      age: patient.age ? patient.age.toString() : '',
      gender: patient.gender || '',
      primaryConsultant: patient.primaryConsultant || '',
      diagnosisDescription: patient.diagnosisDescription || '',
      admissionDateTime: patient.admissionDateTime ? patient.admissionDateTime.slice(0, 16) : '',
      dischargeDateTime: patient.dischargeDateTime ? patient.dischargeDateTime.slice(0, 16) : '',
      patientStatus: patient.patientStatus || '',
      roomNo: patient.roomNo || '',
      bedNo: patient.bedNo || '',
      floor: patient.floor || '',
      ward: patient.ward || '',
      patientMobileNo: patient.patientMobileNo || '',
      attendantContact: patient.attendantContact || '',
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.uhid) {
      Alert.alert('Error', 'Name and UHID are required');
      return;
    }

    const patientData = {
      ...formData,
      age: parseInt(formData.age) || 0,
      admissionDateTime: formData.admissionDateTime ? `${formData.admissionDateTime}:00` : null,
      dischargeDateTime: formData.dischargeDateTime ? `${formData.dischargeDateTime}:00` : null,
    };

    setIsLoading(true);
    try {
      if (isEditMode && currentPatient) {
        await axiosInstance.put(`/patient/update/${currentPatient.id}`, patientData);
        Alert.alert('Success', 'Patient updated successfully');
      } else {
        await axiosInstance.post('/patient/add', patientData);
        Alert.alert('Success', 'Patient added successfully');
      }
      fetchPatients();
      setModalVisible(false);
      resetForm();
    } catch (error) {
      console.error('Error saving patient:', error);
      Alert.alert('Error', 'Failed to save patient information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this patient?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await axiosInstance.delete(`/patient/delete/${id}`);
              fetchPatients();
              Alert.alert('Success', 'Patient deleted successfully');
            } catch (error) {
              console.error('Error deleting patient:', error);
              Alert.alert('Error', 'Failed to delete patient');
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

  const renderItem = ({ item }: { item: Patient }) => (
    <View style={styles.patientCard}>
      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{item.name}</Text>
        <Text style={styles.patientDetail}>UHID: {item.uhid}</Text>
        <Text style={styles.patientDetail}>Contact: {item.patientMobileNo || 'N/A'}</Text>
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
        <Text style={styles.headerTitle}>Patient Management</Text>
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
          data={patients}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No patient records found</Text>
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
            <ScrollView>
              <Text style={styles.modalTitle}>{isEditMode ? 'Edit Patient' : 'Add New Patient'}</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Basic Information</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Patient Name"
                  value={formData.name}
                  onChangeText={(text) => handleInputChange('name', text)}
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="UHID"
                  value={formData.uhid}
                  onChangeText={(text) => handleInputChange('uhid', text)}
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="In-Patient ID"
                  value={formData.ipId}
                  onChangeText={(text) => handleInputChange('ipId', text)}
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="Age"
                  value={formData.age}
                  onChangeText={(text) => handleInputChange('age', text)}
                  keyboardType="numeric"
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="Gender"
                  value={formData.gender}
                  onChangeText={(text) => handleInputChange('gender', text)}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Medical Information</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Primary Consultant"
                  value={formData.primaryConsultant}
                  onChangeText={(text) => handleInputChange('primaryConsultant', text)}
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="Diagnosis Description"
                  value={formData.diagnosisDescription}
                  onChangeText={(text) => handleInputChange('diagnosisDescription', text)}
                  multiline
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="Patient Status"
                  value={formData.patientStatus}
                  onChangeText={(text) => handleInputChange('patientStatus', text)}
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="Admission Date Time (YYYY-MM-DDTHH:MM)"
                  value={formData.admissionDateTime}
                  onChangeText={(text) => handleInputChange('admissionDateTime', text)}
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="Discharge Date Time (YYYY-MM-DDTHH:MM)"
                  value={formData.dischargeDateTime}
                  onChangeText={(text) => handleInputChange('dischargeDateTime', text)}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Location</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Room No"
                  value={formData.roomNo}
                  onChangeText={(text) => handleInputChange('roomNo', text)}
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="Bed No"
                  value={formData.bedNo}
                  onChangeText={(text) => handleInputChange('bedNo', text)}
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="Floor"
                  value={formData.floor}
                  onChangeText={(text) => handleInputChange('floor', text)}
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="Ward"
                  value={formData.ward}
                  onChangeText={(text) => handleInputChange('ward', text)}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Contact Information</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Patient Mobile Number"
                  value={formData.patientMobileNo}
                  onChangeText={(text) => handleInputChange('patientMobileNo', text)}
                  keyboardType="phone-pad"
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="Attendant Contact"
                  value={formData.attendantContact}
                  onChangeText={(text) => handleInputChange('attendantContact', text)}
                  keyboardType="phone-pad"
                />
              </View>
              
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
            </ScrollView>
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
  patientCard: {
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
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  patientDetail: {
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
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
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