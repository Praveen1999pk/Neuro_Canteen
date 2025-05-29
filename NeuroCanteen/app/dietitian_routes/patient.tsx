import React, { useState,useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image 
} from 'react-native';
import { useRouter } from 'expo-router';
import { User, CircleAlert as AlertCircle, X, Utensils, Calendar, Clock, Navigation, Phone } from 'lucide-react-native';
import axiosInstance from '../api/axiosInstance';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';



interface Patient {
    id: number;
    uhid: string;
    ipId: string;
    name: string;
    age: number;
    gender: string;
    primaryConsultant: string;
    diagnosisDescription: string;
    admissionDateTime: string;
    dischargeDateTime: string;
    patientStatus: string;
    roomNo: string;
    bedNo: string;
    floor: string;
    ward: string;
    patientMobileNo: string;
    attendantContact: string;
    combo: string | null;
    allergies: string | null;
    dislikes: string | null;
  }
  

export default function PatientScreen() {
  const navigation = useNavigation<any>();

  const router = useRouter();
  const [patient,setpatient] = useState<Patient>();
  const [patientuhid,setuhid] = useState();

  const route = useRoute();
  const { room,ward,floor,bed } = route.params as { room: number ,floor:number,ward:number,bed:number};

    useEffect(() => {
        const fetchpatient = async () => {
        try {
            const response = await axiosInstance.get(`/patient/patients/${floor}/${ward}/${room}/${bed}`);
            const data = response.data;
            setpatient(data[0]);
            const uhid = data[0]?.uhid;
            if (uhid) {
              await AsyncStorage.setItem('patientUHID', uhid);
              setuhid(uhid)
              console.log('UHID saved:', uhid);
            }else{
              console.log("Fetching UHID is Error");
            }

        } catch (error) {
            console.error('Failed to fetch rooms:', error);
        }
        };

        fetchpatient();
    }, [ward]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCreateDiet = () => {
    // router.push('/create-diet');
        navigation.navigate('create-diet');
  };

  const handleDietHistory = () => {
    // router.push('/create-diet');
        navigation.navigate('diet-history', {patientuhid});
  };

  
  if (patient) {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Patient Header */}
        <View style={styles.header}>
          <View style={styles.patientAvatarContainer}>
            <User size={40} color="#fff" strokeWidth={1.5} />
          </View>
          <View style={styles.patientNameContainer}>
            <Text style={styles.patientName}>{patient.name}</Text>
            <View style={styles.patientInfoRow}>
              <Text style={styles.patientInfo}>{patient.age} years</Text>
              <View style={styles.dot} />
              <Text style={styles.patientInfo}>{patient.gender === 'M' ? 'Male' : 'Female'}</Text>
            </View>
          </View>
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: patient.patientStatus === 'Admitted' ? '#16a34a' : '#f59e0b' }
            ]}>
              <Text style={styles.statusText}>{patient.patientStatus}</Text>
            </View>
          </View>
        </View>

        {/* Patient ID Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Patient Information</Text>
          <View style={styles.idInfoContainer}>
            <View style={styles.idItem}>
              <Text style={styles.idLabel}>UHID</Text>
              <Text style={styles.idValue}>{patient.uhid}</Text>
            </View>
            <View style={styles.idDivider} />
            <View style={styles.idItem}>
              <Text style={styles.idLabel}>IP ID</Text>
              <Text style={styles.idValue}>{patient.ipId}</Text>
            </View>
          </View>
        </View>

        {/* Medical Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Medical Information</Text>
          
          <View style={styles.infoRow}>
            <User size={20} color="#166534" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Primary Consultant</Text>
              <Text style={styles.infoValue}>{patient.primaryConsultant || 'None assigned'}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <AlertCircle size={20} color="#166534" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Diagnosis</Text>
              <Text style={styles.infoValue}>{patient.diagnosisDescription || 'None'}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <Calendar size={20} color="#166534" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Admission Date & Time</Text>
              <Text style={styles.infoValue}>{formatDate(patient.admissionDateTime)}</Text>
            </View>
          </View>
          
          {patient.patientStatus === 'Discharged' && (
            <View style={styles.infoRow}>
              <Clock size={20} color="#166534" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Discharge Date & Time</Text>
                <Text style={styles.infoValue}>{formatDate(patient.dischargeDateTime)}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Location Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Location</Text>
          
          <View style={styles.locationGrid}>
            <View style={styles.locationItem}>
              <Text style={styles.locationLabel}>Floor</Text>
              <Text style={styles.locationValue}>{patient.floor}</Text>
            </View>
            
            <View style={styles.locationItem}>
              <Text style={styles.locationLabel}>Ward</Text>
              <Text style={styles.locationValue}>{patient.ward}</Text>
            </View>
            
            <View style={styles.locationItem}>
              <Text style={styles.locationLabel}>Room</Text>
              <Text style={styles.locationValue}>{patient.roomNo}</Text>
            </View>
            
            <View style={styles.locationItem}>
              <Text style={styles.locationLabel}>Bed</Text>
              <Text style={styles.locationValue}>{patient.bedNo}</Text>
            </View>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Information</Text>
          
          <View style={styles.infoRow}>
            <Phone size={20} color="#166534" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Patient Mobile</Text>
              <Text style={styles.infoValue}>{patient.patientMobileNo}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <Phone size={20} color="#166534" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Attendant Contact</Text>
              <Text style={styles.infoValue}>{patient.attendantContact}</Text>
            </View>
          </View>
        </View>

        {/* Dietary Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dietary Information</Text>
          
          <View style={styles.infoRow}>
            <AlertCircle size={20} color="#dc2626" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Allergies</Text>
              <Text style={styles.infoValue}>{patient.allergies || 'No known allergies'}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <X size={20} color="#f59e0b" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Dislikes</Text>
              <Text style={styles.infoValue}>{patient.dislikes || 'None specified'}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <Utensils size={20} color="#166534" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Diet Combination</Text>
              <Text style={styles.infoValue}>{patient.combo || 'Not specified'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
      
    <View style={styles.actionContainer}>
  {/* Create Diet Button */}
  <TouchableOpacity 
    style={styles.actionButton}
    onPress={handleCreateDiet}
  >
    <Text style={styles.actionButtonText}>Create Diet Plan</Text>
  </TouchableOpacity>
  
  {/* Diet History Button */}
  <TouchableOpacity 
    style={[styles.actionButton, { backgroundColor: '#166534' }]} // Optional: Different color for second button
    onPress={handleDietHistory}  // Navigate to diet history screen
  >
    <Text style={styles.actionButtonText}>Diet History</Text>
  </TouchableOpacity>
</View>
    </View>
  )}
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#166534',
    alignItems: 'center',
  },
  patientAvatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  patientNameContainer: {
    flex: 1,
  },
  patientName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  patientInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  patientInfo: {
    fontSize: 14,
    color: '#e2e8f0',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 6,
  },
  statusContainer: {
    marginLeft: 'auto',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8,
  },
  idInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  idItem: {
    flex: 1,
    alignItems: 'center',
  },
  idLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  idValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  idDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
  },
  locationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  locationItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  locationLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 18,
    color: '#0f172a',
    fontWeight: '500',
  },
  spacer: {
    height: 170,
  },
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  actionButton: {
    backgroundColor: '#166534', // Same color for both buttons
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8, // Add margin for spacing between buttons
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});