import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CircleCheck, ShoppingBag } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function OrderSuccess() {
  const router = useRouter();
  const animatedValue = new Animated.Value(0);
  
  useEffect(() => {
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
  }, []);
// In your order-success screen
useEffect(() => {
  // Clear cart when this screen mounts
  AsyncStorage.removeItem('staff_cart');
  
  // Prevent going back to checkout by replacing the history entry
  router.replace('/(staff)/order-success');

  // Optionally, you can clear the navigation stack or handle navigation guards here if needed.
}, []);
  const iconScale = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1.2, 1],
  });

  const textOpacity = animatedValue.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0, 0, 1],
  });

  const handleViewOrders = () => {
    router.push('/(staff)/order-history');
  };

  const handleBackToMenu = () => {
    router.push('/(staff)/order');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.iconContainer,
            { transform: [{ scale: iconScale }] }
          ]}
        >
          <CircleCheck size={80} color="#4A8F47" />
        </Animated.View>
        
        <Animated.Text style={[styles.title, { opacity: textOpacity }]}>
          Order Successfully Placed!
        </Animated.Text>
        
        <Animated.Text style={[styles.message, { opacity: textOpacity }]}>
          Your order has been confirmed and is being processed. Thank you for choosing us!
        </Animated.Text>
        
        <Animated.View style={[styles.buttonsContainer, { opacity: textOpacity }]}>
          <TouchableOpacity style={styles.button} onPress={handleViewOrders}>
            <ShoppingBag size={20} color="white" />
            <Text style={styles.buttonText}>View My Orders</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={handleBackToMenu}
          >
            <Text style={styles.secondaryButtonText}>Back to Menu</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 15,
    color: '#333',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    maxWidth: 300,
  },
  buttonsContainer: {
    width: '100%',
    maxWidth: 300,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A8F47',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4A8F47',
  },
  secondaryButtonText: {
    color: '#4A8F47',
    fontSize: 16,
    fontWeight: '600',
  },
});