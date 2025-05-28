import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  Animated,
  Platform
} from 'react-native';
import { User, LogIn, LayoutGrid } from 'lucide-react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function HomeScreen() {
  const [patientId, setPatientId] = useState('');
  const buttonAnimation = new Animated.Value(1);
  
  const handleLogin = () => {
    if (patientId.trim()) {
      Alert.alert('Patient Logged In', `ID: ${patientId}`);
      console.log('Navigate to: /patient-details', { id: patientId });
    } else {
      Alert.alert('Error', 'Please enter a valid Patient ID');
    }
  };

  const handlePressIn = () => {
    Animated.spring(buttonAnimation, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonAnimation, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.headerContainer}>
        <View style={styles.iconBackground}>
          <User color="white" size={40} />
        </View>
        <Text style={styles.headerTitle}>NeuroCanteen</Text>
        <Text style={styles.headerSubtitle}>Food Management System</Text>
      </View>

      <View style={styles.cardContainer}>
        <Text style={styles.welcomeText}>Welcome, Dietitian</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Navigation</Text>
          <Animated.View 
            style={[styles.animatedButton, {transform: [{scale: buttonAnimation}]}]}
          >
            <TouchableOpacity
              style={styles.navigationButton}
              onPress={() => router.push('/dietitian_routes')}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            >
              <LayoutGrid color="white" size={22} />
              <Text style={styles.navigationButtonText}>Floor Overview</Text>
            </TouchableOpacity>
          </Animated.View> 
        </View>


        <Text style={styles.footerText}>© 2025 NeuroCanteen</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerContainer: {
    backgroundColor: '#1B5E20',
    paddingTop: Platform.OS === 'web' ? 40 : 60,
    paddingBottom: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  iconBackground: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  cardContainer: {
    marginHorizontal: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1B5E20',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#212121',
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  animatedButton: {
    width: '100%',
  },
  loginButton: {
    backgroundColor: '#1B5E20',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  navigationButton: {
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  navigationButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    padding: 20,
  },
  footerText: {
    color: '#757575',
    fontSize: 14,
  }
});