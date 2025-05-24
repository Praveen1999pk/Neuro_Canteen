import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { loginpatient } from '../api/auth';
import { useRouter } from 'expo-router';

export default function HandlePatientLogin() {
  const [uhid, setUhid] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    if (!uhid) {
      Alert.alert('Error', 'Please enter UHID');
      return;
    }

    const result = await loginpatient(uhid);
    if (result.success) {
      router.replace('/(tabs)'); // Or wherever you want to redirect after login
    } else {
      Alert.alert('Login Failed', result.message || 'Invalid UHID');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Patient Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter UHID"
        value={uhid}
        onChangeText={setUhid}
        autoCapitalize="none"
      />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
});