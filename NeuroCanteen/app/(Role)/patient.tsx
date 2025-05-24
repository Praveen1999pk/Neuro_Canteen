import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Truck } from 'lucide-react-native';
import { useState } from 'react';
import { loginpatient } from '../api/auth';

export default function HandlepatientLogin() {
  const [uhid, setUhid] = useState('');
  const [loading, setLoading] = useState(false);

  const handleManualLogin = async () => {
    if (!uhid.trim()) {
      Alert.alert('Error', 'Please enter your UHID');
      return;
    }

    setLoading(true);
    try {
      const result = await loginpatient(uhid);
      
      if (result.success) {
        router.replace('/(patient)');
      } else {
        Alert.alert('Login Failed', result.message || 'Invalid UHID. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.replace('/');
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBack}
        >
          <ArrowLeft color="#0F5132" size={24} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Neuro Foundation</Text>
          <Text style={styles.subtitle}>Committed to Neuro Sciences</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.PatientHeader}>
            <Text style={styles.PatientTitle}>Patient Login</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>UHID</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your UHID"
              value={uhid}
              onChangeText={setUhid}
              autoCapitalize="none"
              keyboardType="default"
              autoFocus={true}
            />
          </View>

          <View style={styles.helpContainer}>
            <TouchableOpacity>
              <Text style={styles.helpText}>Need help finding your UHID?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleManualLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Supported by Crimson Owl Tech</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#0F5132',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#374151',
  },
  form: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
  },
  helpContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  helpText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#0F5132',
  },
  loginButton: {
    backgroundColor: '#0F5132',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  loginButtonDisabled: {
    backgroundColor: '#0F5132AA',
  },
  loginButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  PatientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 30,
  },
  PatientTitle: {
    fontSize: 22,
    fontFamily: 'Poppins-SemiBold',
    color: '#0F5132',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
  },
});