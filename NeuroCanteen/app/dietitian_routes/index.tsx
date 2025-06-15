import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Building, ArrowRight, Search } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import axiosInstance from '../api/axiosInstance';

export default function DietitianHomeScreen() {
  const navigation = useNavigation<any>(); 
  const router = useRouter();
  const [floors, setFloors] = useState<number[]>([]);
  const [filteredFloors, setFilteredFloors] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [numColumns, setNumColumns] = useState(2);

  useEffect(() => {
    const fetchFloors = async () => {
      try {
        const response = await axiosInstance.get("/patient/floors");
        const data = response.data;
        setFloors(data);
        setFilteredFloors(data);
      } catch (error) {
        console.error('Failed to fetch floors:', error);
      }
    };

    fetchFloors();
  }, []);

  useEffect(() => {
    console.log('Search query:', searchQuery);
    console.log('Current floors:', floors);
    if (searchQuery.trim() === '') {
      setFilteredFloors(floors);
    } else {
      const filtered = floors.filter(floor => {
        const floorStr = `Floor${floor.toString().padStart(3, '0')}`;
        const searchLower = searchQuery.toLowerCase().trim();
        
        // Remove any non-alphanumeric characters from search
        const cleanSearch = searchLower.replace(/[^a-z0-9]/gi, '');
        
        // If search is just numbers, try different number formats
        if (/^\d+$/.test(cleanSearch)) {
          const numSearch = parseInt(cleanSearch);
          return (
            floor === numSearch || // Exact number match
            floorStr.includes(cleanSearch) || // Number in string
            floorStr.includes(cleanSearch.padStart(3, '0')) // Padded number
          );
        }
        
        // For text searches
        return (
          floorStr.toLowerCase().includes(cleanSearch) || // Full string match
          floorStr.toLowerCase().includes(`floor${cleanSearch}`) || // With "floor" prefix
          floorStr.toLowerCase().includes(`f${cleanSearch}`) || // With "f" prefix
          floorStr.toLowerCase().includes(`fl${cleanSearch}`) || // With "fl" prefix
          floorStr.toLowerCase().includes(`flo${cleanSearch}`) || // With "flo" prefix
          floorStr.toLowerCase().includes(`floo${cleanSearch}`) || // With "floo" prefix
          floorStr.toLowerCase().includes(`floor${cleanSearch.padStart(3, '0')}`) // With padded number
        );
      });
      console.log('Filtered floors:', filtered);
      setFilteredFloors(filtered);
    }
  }, [searchQuery, floors]);

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
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>

      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>Select a floor to view Wards</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search floors..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#64748b"
          />
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.cardGrid}>
          {filteredFloors.map((floor) => (
            <TouchableOpacity
              key={floor}
              style={[styles.floorCard, { width: `${100 / numColumns - 3}%` }]}
              onPress={() => {
                navigateToWards(floor);
                console.log(floor);
              }}
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
    paddingTop: 20,
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    padding: 0,
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