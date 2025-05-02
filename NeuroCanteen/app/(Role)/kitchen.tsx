import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter, useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useState,useEffect } from 'react';
import { loginKitchen } from '../api/auth';
import { UtensilsCrossed } from 'lucide-react-native';
import axiosInstance from '../api/axiosInstance';

export default function Handlekitchenlogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const result = await loginKitchen(username, password);
    console.log(result)
    console.log(result.success)
    if (result.success) {
      router.replace('/(kitchen)');
    } else {
      Alert.alert('Login Failed', result.message);
    }
    setLoading(false);
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

          <View style={styles.deliveryHeader}>
          <UtensilsCrossed color="#0F5132" size={32} />
          <Text style={styles.deliveryTitle}>Kitchen Login</Text>
        </View>


          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <View style={styles.rememberContainer}>
            <TouchableOpacity>
              <Text style={styles.forgotPassword}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? 'Logging in...' : 'Login'}
            </Text>
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
    marginBottom: 24,
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
  rememberContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 24,
  },
  forgotPassword: {
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
  deliveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 30,
  },
  deliveryTitle: {
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
    color: '#6B7280', // subtle gray
    fontFamily: 'Poppins-Regular',
  },
  
});

