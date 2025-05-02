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
  ScrollView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Plus, CreditCard as Edit2, Trash2 } from 'lucide-react-native';
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
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<null | 'admission' | 'discharge'>(null);

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
      console.log('Fetched patients:', response.data);  // Debugging line
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

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (!selectedDate) {
      setShowDatePicker(null);
      return;
    }

    const formatted = selectedDate.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:MM"
    if (showDatePicker === 'admission') {
      handleInputChange('admissionDateTime', formatted);
    } else if (showDatePicker === 'discharge') {
      handleInputChange('dischargeDateTime', formatted);
    }
    setShowDatePicker(null);
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
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={patients}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={
          !isLoading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No patients available.</Text>
            </View>
          )
        }
      />

      {/* Modal for Adding/Editing Patient */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {isEditMode ? 'Edit Patient' : 'Add New Patient'}
              </Text>

              {/* Other inputs... */}

              {/* Date Pickers */}
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDatePicker('admission')}
              >
                <Text>
                  {formData.admissionDateTime
                    ? formData.admissionDateTime.replace('T', ' ')
                    : 'Select Admission Date & Time'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDatePicker('discharge')}
              >
                <Text>
                  {formData.dischargeDateTime
                    ? formData.dischargeDateTime.replace('T', ' ')
                    : 'Select Discharge Date & Time'}
                </Text>
              </TouchableOpacity>

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

      {/* DateTime Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="datetime"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={handleDateChange}
        />
      )}
    </View>
  );
}

// Styles...

const styles = StyleSheet.create({
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