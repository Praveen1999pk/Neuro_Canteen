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
import DateTimePicker from '@react-native-community/datetimepicker';

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
  type: 'OPD' | 'In-Patient';
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
    type: 'OPD' as 'OPD' | 'In-Patient',
  });
  const [showAdmissionPicker, setShowAdmissionPicker] = useState(false);
  const [showDischargePicker, setShowDischargePicker] = useState(false);
  const [showAdmissionTimePicker, setShowAdmissionTimePicker] = useState(false);
  const [showDischargeTimePicker, setShowDischargeTimePicker] = useState(false);
  const [filterType, setFilterType] = useState<'All' | 'OPD' | 'In-Patient'>('All');

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
      type: 'OPD',
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
      type: patient.type,
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    // Validation for required fields
    if (!formData.name) {
      Alert.alert('Error', 'Patient Name is required');
      return;
    }
    if (!formData.uhid) {
      Alert.alert('Error', 'OPD UHID is required');
      return;
    }
    if (!formData.gender) {
      Alert.alert('Error', 'Gender is required');
      return;
    }
    if (!formData.patientMobileNo) {
      Alert.alert('Error', 'Contact Number is required');
      return;
    }
    if (formData.type === 'In-Patient') {
      if (!formData.primaryConsultant) {
        Alert.alert('Error', 'Primary Consultant is required');
        return;
      }
      if (!formData.diagnosisDescription) {
        Alert.alert('Error', 'Diagnosis Description is required');
        return;
      }
      if (!formData.patientStatus) {
        Alert.alert('Error', 'Patient Status is required');
        return;
      }
      if (!formData.admissionDateTime) {
        Alert.alert('Error', 'Admission Date is required');
        return;
      }
      if (!formData.roomNo) {
        Alert.alert('Error', 'Room No is required');
        return;
      }
      if (!formData.bedNo) {
        Alert.alert('Error', 'Bed No is required');
        return;
      }
      if (!formData.floor) {
        Alert.alert('Error', 'Floor is required');
        return;
      }
      if (!formData.ward) {
        Alert.alert('Error', 'Ward is required');
        return;
      }
    }

    // Prepare payload based on type
    let patientData: any = {
      name: formData.name,
      uhid: formData.uhid,
      gender: formData.gender,
      patientMobileNo: formData.patientMobileNo,
      attendantContact: formData.attendantContact,
      type: formData.type,
    };
    if (formData.type === 'In-Patient') {
      patientData = {
        ...patientData,
        ipId: formData.ipId,
        age: parseInt(formData.age) || 0,
        primaryConsultant: formData.primaryConsultant,
        diagnosisDescription: formData.diagnosisDescription,
        admissionDateTime: formData.admissionDateTime || null,
        dischargeDateTime: formData.dischargeDateTime || null,
        patientStatus: formData.patientStatus,
        roomNo: formData.roomNo,
        bedNo: formData.bedNo,
        floor: formData.floor,
        ward: formData.ward,
      };
    }

    console.log('Submitting patientData:', patientData);

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
    } catch (error: any) {
      // Enhanced error handling for duplicate UHID
      if (error.response) {
        console.log('Full error response:', error.response);
        if (error.response.status === 409) {
          Alert.alert('Duplicate UHID', 'A patient with this UHID already exists.');
          return;
        }
        const errorMessage = error.response.data?.message || 
                           error.response.data?.error || 
                           error.response.data;
        if (typeof errorMessage === 'string' && errorMessage.toLowerCase().includes('uhid')) {
          Alert.alert('Duplicate UHID', errorMessage);
          return;
        }
        // Show full error message if available
        Alert.alert('Error', JSON.stringify(error.response.data));
        return;
      } else {
        console.log('Unknown error:', error);
        Alert.alert('Error', error.message || 'Unknown error occurred');
      }
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
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Patient Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Plus size={24} color="#2E7D32" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'All' && styles.selectedFilterButton]}
          onPress={() => setFilterType('All')}
        >
          <Text style={[styles.filterButtonText, filterType === 'All' && styles.selectedFilterButtonText]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'OPD' && styles.selectedFilterButton]}
          onPress={() => setFilterType('OPD')}
        >
          <Text style={[styles.filterButtonText, filterType === 'OPD' && styles.selectedFilterButtonText]}>OPD</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterType === 'In-Patient' && styles.selectedFilterButton]}
          onPress={() => setFilterType('In-Patient')}
        >
          <Text style={[styles.filterButtonText, filterType === 'In-Patient' && styles.selectedFilterButtonText]}>In-Patient</Text>
        </TouchableOpacity>
      </View>
      {/* Filtered List */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#2E7D32" style={styles.loader} />
      ) : (
        <FlatList
          data={
            filterType === 'All'
              ? patients
              : patients.filter((p) => p.type === filterType)
          }
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          resetForm();
        }}
      >
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalContent}>
            <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }} style={styles.modalBackButton}>
              <ArrowLeft size={24} color="#2E7D32" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {isEditMode ? 'Edit Patient' : 'Add Patient'}
            </Text>

            {/* Patient Type Selection */}
            <View style={styles.typeSelection}>
              <Text style={styles.label}>Patient Type</Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formData.type === 'OPD' && styles.selectedTypeButton,
                  ]}
                  onPress={() => handleInputChange('type', 'OPD')}
                >
                  <Text style={[
                    styles.typeButtonText,
                    formData.type === 'OPD' && styles.selectedTypeButtonText,
                  ]}>OPD</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formData.type === 'In-Patient' && styles.selectedTypeButton,
                  ]}
                  onPress={() => handleInputChange('type', 'In-Patient')}
                >
                  <Text style={[
                    styles.typeButtonText,
                    formData.type === 'In-Patient' && styles.selectedTypeButtonText,
                  ]}>In-Patient</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Common Fields */}
            <Text style={styles.label}>Patient Name <Text style={{color: 'red'}}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="Patient Name"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
            />
            <Text style={styles.label}>UHID</Text>
            <TextInput
              style={styles.input}
              placeholder="UHID"
              value={formData.uhid}
              onChangeText={(value) => handleInputChange('uhid', value)}
            />
            <Text style={styles.label}>Gender <Text style={{color: 'red'}}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="Gender"
              value={formData.gender}
              onChangeText={(value) => handleInputChange('gender', value)}
            />
            <Text style={styles.label}>Contact Number <Text style={{color: 'red'}}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="Contact Number"
              value={formData.patientMobileNo}
              onChangeText={(value) => handleInputChange('patientMobileNo', value)}
              keyboardType="phone-pad"
            />
            <Text style={styles.label}>Alternative Contact</Text>
            <TextInput
              style={styles.input}
              placeholder="Alternative Contact"
              value={formData.attendantContact}
              onChangeText={(value) => handleInputChange('attendantContact', value)}
              keyboardType="phone-pad"
            />

            {/* In-Patient Specific Fields */}
            {formData.type === 'In-Patient' && (
              <>
                <Text style={styles.label}>In-Patient ID</Text>
                <TextInput
                  style={styles.input}
                  placeholder="In-Patient ID"
                  value={formData.ipId}
                  onChangeText={(value) => handleInputChange('ipId', value)}
                />
                <Text style={styles.label}>Age <Text style={{color: 'red'}}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="Age"
                  value={formData.age}
                  onChangeText={(value) => handleInputChange('age', value)}
                  keyboardType="numeric"
                />
                <Text style={styles.label}>Primary Consultant <Text style={{color: 'red'}}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="Primary Consultant"
                  value={formData.primaryConsultant}
                  onChangeText={(value) => handleInputChange('primaryConsultant', value)}
                />
                <Text style={styles.label}>Diagnosis Description <Text style={{color: 'red'}}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="Diagnosis Description"
                  value={formData.diagnosisDescription}
                  onChangeText={(value) => handleInputChange('diagnosisDescription', value)}
                  multiline
                />
                <Text style={styles.label}>Patient Status <Text style={{color: 'red'}}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="Patient Status"
                  value={formData.patientStatus}
                  onChangeText={(value) => handleInputChange('patientStatus', value)}
                />
                <Text style={styles.label}>Admission Date & Time <Text style={{color: 'red'}}>*</Text></Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowAdmissionPicker(true)}
                >
                  <Text>
                    {formData.admissionDateTime
                      ? `Admission: ${formData.admissionDateTime}`
                      : 'Set Admission Date & Time'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowDischargePicker(true)}
                >
                  <Text>
                    {formData.dischargeDateTime
                      ? `Discharge: ${formData.dischargeDateTime}`
                      : 'Set Discharge Date & Time'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.label}>Room No <Text style={{color: 'red'}}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="Room No"
                  value={formData.roomNo}
                  onChangeText={(value) => handleInputChange('roomNo', value)}
                />
                <Text style={styles.label}>Bed No <Text style={{color: 'red'}}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="Bed No"
                  value={formData.bedNo}
                  onChangeText={(value) => handleInputChange('bedNo', value)}
                />
                <Text style={styles.label}>Floor <Text style={{color: 'red'}}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="Floor"
                  value={formData.floor}
                  onChangeText={(value) => handleInputChange('floor', value)}
                />
                <Text style={styles.label}>Ward <Text style={{color: 'red'}}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ward"
                  value={formData.ward}
                  onChangeText={(value) => handleInputChange('ward', value)}
                />
              </>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleSubmit}
              >
                <Text style={styles.buttonText}>
                  {isEditMode ? 'Update' : 'Save'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {showAdmissionPicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          onChange={(event, date) => {
            setShowAdmissionPicker(false);
            if (date) {
              setShowAdmissionTimePicker(true);
              handleInputChange(
                'admissionDateTime',
                date.toISOString().split('T')[0]
              );
            }
          }}
        />
      )}

      {showAdmissionTimePicker && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          onChange={(event, date) => {
            setShowAdmissionTimePicker(false);
            if (date) {
              const currentDate = formData.admissionDateTime;
              const time = date.toTimeString().split(' ')[0];
              handleInputChange(
                'admissionDateTime',
                `${currentDate}T${time}`
              );
            }
          }}
        />
      )}

      {showDischargePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          onChange={(event, date) => {
            setShowDischargePicker(false);
            if (date) {
              setShowDischargeTimePicker(true);
              handleInputChange(
                'dischargeDateTime',
                date.toISOString().split('T')[0]
              );
            }
          }}
        />
      )}

      {showDischargeTimePicker && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          onChange={(event, date) => {
            setShowDischargeTimePicker(false);
            if (date) {
              const currentDate = formData.dischargeDateTime;
              const time = date.toTimeString().split(' ')[0];
              handleInputChange(
                'dischargeDateTime',
                `${currentDate}T${time}`
              );
            }
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    minWidth: 40,
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
    flexDirection: 'row',
  },
  addButtonText: {
    color: '#2E7D32',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 8,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 4,
    marginHorizontal: 8,
  },
  submitButton: {
    backgroundColor: '#2E7D32',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  patientCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  patientDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#2E7D32',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  typeSelection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  typeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#2E7D32',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  selectedTypeButton: {
    backgroundColor: '#2E7D32',
  },
  typeButtonText: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '500',
  },
  selectedTypeButtonText: {
    color: '#fff',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2E7D32',
    marginHorizontal: 6,
    backgroundColor: '#fff',
  },
  selectedFilterButton: {
    backgroundColor: '#2E7D32',
  },
  filterButtonText: {
    color: '#2E7D32',
    fontWeight: 'bold',
    fontSize: 14,
  },
  selectedFilterButtonText: {
    color: '#fff',
  },
  modalBackButton: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
});