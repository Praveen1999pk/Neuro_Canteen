// import React, { useEffect, useState } from 'react';
// import { View, Text, StyleSheet, Animated, TouchableOpacity, ActivityIndicator } from 'react-native';
// import { useRouter } from 'expo-router';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { CircleCheck, ShoppingBag } from 'lucide-react-native';
// import { useRoute } from '@react-navigation/native';
// import axiosInstance from '../api/axiosInstance';
// import AsyncStorage from '@react-native-async-storage/async-storage';


// interface Item {
//   id: number;
//   name: string;
//   category: string;
//   picture: string | null;
//   description: string;
//   staffPrice: number;
//   patientPrice: number;
//   dietitianPrice: number;
//   combination: any;
//   available: boolean;
// }

// interface OrderItem {
//   item: Item;
//   quantity: number;
// }

// interface OrderSummary {
//   items: OrderItem[];
//   total: number;
//   timestamp: string;
// }

// export default function OrderSuccess() {
//   const router = useRouter();
//   const animatedValue = new Animated.Value(0);
//   const route = useRoute();
//   const { orderSummary } = route.params as { orderSummary: OrderSummary };

//   const [isLoading, setIsLoading] = useState(true);
//   const [isSuccess, setIsSuccess] = useState(false);
//   const [orderedUserId, setOrderedUserId] = useState<string | null>(); // Add this at the top
//   const orderedRole = 'Patient';
    
//   useEffect(() => {
//     const getIdAndPlaceOrder = async () => {
//       try {
//         const id = await AsyncStorage.getItem('patientUHID');

//         if (!id) {
//           console.warn('No UHID found in storage');
//           setIsLoading(false);
//           return;
//         }

//         console.log('Got UHID from storage:', id);
//         setOrderedUserId(id);

//         const order = {
//           orderedRole,
//           orderedUserId: id,
//           itemName: orderSummary.items.map(i => i.item.name).join(', '),
//           quantity: orderSummary.items.reduce((sum, i) => sum + i.quantity, 0),
//           category: orderSummary.items[0]?.item.category || 'General',
//           price: orderSummary.total,
//           orderStatus: null,
//           paymentType: 'COD',
//           paymentStatus: null,
//           orderDateTime: orderSummary.timestamp,
//           address: '',
//         };
//         console.log(orderSummary)

//         setTimeout(async () => {
//           const response = await axiosInstance.post('/orders', order);
//           console.log('Order submitted:', response.status);
//           if (response.status === 200 || response.status === 201) {
//             setIsSuccess(true);
//           }
//           setIsLoading(false);
//         }, 2000);
//       } catch (error) {
//         console.error('Error submitting order:', error);
//         setIsLoading(false);
//       }
//     };

//     getIdAndPlaceOrder();
//   }, []);

//   useEffect(() => {
//     if (isSuccess) {
//       Animated.sequence([
//         Animated.timing(animatedValue, {
//           toValue: 1,
//           duration: 600,
//           useNativeDriver: true,
//         })
//       ]).start();
//     }
//   }, [isSuccess]);

//   const iconScale = animatedValue.interpolate({
//     inputRange: [0, 0.5, 1],
//     outputRange: [0, 1.2, 1],
//   });

//   const textOpacity = animatedValue.interpolate({
//     inputRange: [0, 0.7, 1],
//     outputRange: [0, 0, 1],
//   });

//   const handleViewOrders = () => {
//     router.push('/(dietitians)/order-history');
//   };

//   const handleBackToMenu = () => {
//     router.push('/(dietitians)');
//   };

//   return (
//     <SafeAreaView style={styles.container} edges={['bottom']}>
//       <View style={styles.content}>
//         {isLoading ? (
//           <>
//             <ActivityIndicator size="large" color="#4A8F47" />
//             <Text style={{ marginTop: 20, fontSize: 16, color: '#777' }}>Processing your order...</Text>
//           </>
//         ) : isSuccess ? (
//           <>
//             <Animated.View
//               style={[
//                 styles.iconContainer,
//                 { transform: [{ scale: iconScale }] }
//               ]}
//             >
//               <CircleCheck size={80} color="#4A8F47" />
//             </Animated.View>

//             <Animated.Text style={[styles.title, { opacity: textOpacity }]}>
//               Order Successfully Placed!
//             </Animated.Text>

//             <Animated.Text style={[styles.message, { opacity: textOpacity }]}>
//               Your order has been confirmed and is being processed. Thank you for choosing us!
//             </Animated.Text>

//             <Animated.View style={[styles.buttonsContainer, { opacity: textOpacity }]}>
//               <TouchableOpacity style={styles.button} onPress={handleViewOrders}>
//                 <ShoppingBag size={20} color="white" />
//                 <Text style={styles.buttonText}>View My Orders</Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 style={[styles.button, styles.secondaryButton]}
//                 onPress={handleBackToMenu}
//               >
//                 <Text style={styles.secondaryButtonText}>Back to Home</Text>
//               </TouchableOpacity>
//             </Animated.View>
//           </>
//         ) : (
//           <Text style={{ fontSize: 18, color: 'red' }}>
//             Failed to place order. Please try again later.
//           </Text>
//         )}
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   content: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   iconContainer: {
//     marginBottom: 30,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: '700',
//     marginBottom: 15,
//     color: '#333',
//   },
//   message: {
//     fontSize: 16,
//     color: '#666',
//     textAlign: 'center',
//     marginBottom: 40,
//     maxWidth: 300,
//   },
//   buttonsContainer: {
//     width: '100%',
//     maxWidth: 300,
//   },
//   button: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#4A8F47',
//     padding: 15,
//     borderRadius: 8,
//     marginBottom: 15,
//   },
//   buttonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: '600',
//     marginLeft: 8,
//   },
//   secondaryButton: {
//     backgroundColor: 'transparent',
//     borderWidth: 1,
//     borderColor: '#4A8F47',
//   },
//   secondaryButtonText: {
//     color: '#4A8F47',
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });


import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CircleCheck, ShoppingBag } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function OrderSuccess() {
  const router = useRouter();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
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
    router.push('/(dietitians)/order-history');
  };

  const handleBackToMenu = () => {
    router.push('/(dietitians)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          style={[styles.iconContainer, { transform: [{ scale: iconScale }] }]}
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
            <Text style={styles.secondaryButtonText}>Back to Home</Text>
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
