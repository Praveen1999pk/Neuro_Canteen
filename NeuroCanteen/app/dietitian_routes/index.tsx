import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Building, ArrowRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import axiosInstance from '../api/axiosInstance';

export default function DietitianHomeScreen() {
  const navigation = useNavigation<any>(); 
  const router = useRouter();
  const [floors, setFloors] = useState<number[]>([]);
  const [numColumns, setNumColumns] = useState(2);


  useEffect(() => {
    const fetchFloors = async () => {
      try {
        const response = await axiosInstance.get("/patient/floors");
        const data = response.data;
        setFloors(data);
      } catch (error) {
        console.error('Failed to fetch floors:', error);
      }
    };

    fetchFloors();
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

  const navigateToWards = (floor: number) => {
    navigation.navigate('floor', { floor }); 
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dietitian Dashboard</Text>
        <Text style={styles.headerSubtitle}>Select a floor to view Wards</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.cardGrid}>
          {floors.map((floor) => (
            <TouchableOpacity
              key={floor}
              style={[styles.floorCard, { width: `${100 / numColumns - 3}%` }]}
              onPress={() => {
                navigateToWards(floor)
                console.log(floor);
              }
              }
            >
              <View style={styles.floorIconContainer}>
                <Building size={32} color="#166534" />
              </View>
              <Text style={styles.floorTitle}>Floor {floor}</Text>
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
    paddingTop: 40,
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
  floorCard: {
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
  floorIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(22, 101, 52, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  floorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 4,
  },
  arrowIcon: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  }
});