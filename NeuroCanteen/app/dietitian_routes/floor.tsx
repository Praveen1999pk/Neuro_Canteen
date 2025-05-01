import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { DoorOpen as Door, ArrowRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import axiosInstance from '../api/axiosInstance';
export default function DietitianHomeScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { floor } = route.params as { floor: number }; 
  // Change: Corrected wards array
  const [wards,setwards] = useState([]);  // Now it's correctly defined as an array.

  const [numColumns, setNumColumns] = useState(2);


  useEffect(() => {
    const fetchWards = async () => {
      try {
        const response = await axiosInstance.get(`/patient/wards/${floor}`);
        const data = response.data;
        setwards(data);
      } catch (error) {
        console.error('Failed to fetch floors:', error);
      }
    };

    fetchWards();
  }, []);

  const updateLayout = () => {
    const { width } = Dimensions.get('window');
    if (width < 500) {
      setNumColumns(2);
    } else if (width < 900) {
      setNumColumns(3);
    } else {
      setNumColumns(4);
    }
  };

  useEffect(() => {
    updateLayout();
    const subscription = Dimensions.addEventListener('change', updateLayout);
    return () => subscription.remove();
  }, []);

  // Change: navigateToWard instead of Floor
  const navigateToWard = (ward: number) => {
    navigation.navigate('rooms', { ward,floor });
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dietitian Dashboard</Text>
        <Text style={styles.headerSubtitle}>Select a ward to view Rooms</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.cardGrid}>
          {wards.map((ward: number) => (
            <TouchableOpacity
              key={ward}
              style={[styles.wardCard, { width: `${100 / numColumns - 3}%` }]}
              onPress={() => navigateToWard(ward)}
            >
              <View style={styles.wardIconContainer}>
                <Door size={32} color="#166534" />
              </View>
              <Text style={styles.wardTitle}>Ward {ward}</Text>
              <ArrowRight size={20} color="#166534" style={styles.arrowIcon} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#166534',
    padding: 20,
    paddingTop: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
  },
  wardCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  wardIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(22, 101, 52, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  wardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 4,
  },
  arrowIcon: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
});
