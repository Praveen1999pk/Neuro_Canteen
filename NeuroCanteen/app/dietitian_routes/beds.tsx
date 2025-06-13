import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BedDouble, ArrowRight, Search } from 'lucide-react-native';
import axiosInstance from '../api/axiosInstance';

export default function BedsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { room, ward, floor } = route.params as { room: number, ward: number, floor: number };

  const [beds, setBeds] = useState<number[]>([]);
  const [filteredBeds, setFilteredBeds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [numColumns, setNumColumns] = useState(2);

  useEffect(() => {
    const fetchBeds = async () => {
      try {
        const response = await axiosInstance.get(`/patient/beds/${floor}/${ward}/${room}`);
        const data = response.data;
        console.log('Fetched beds:', data);
        setBeds(data);
        setFilteredBeds(data);
      } catch (error) {
        console.error('Failed to fetch beds:', error);
      }
    };

    fetchBeds();
  }, [room]);

  useEffect(() => {
    console.log('Search query:', searchQuery);
    console.log('Current beds:', beds);
    if (searchQuery.trim() === '') {
      setFilteredBeds(beds);
    } else {
      const filtered = beds.filter(bed => {
        const bedStr = `BED${bed.toString().padStart(2, '0')}`;
        return bedStr.toLowerCase().includes(searchQuery.toLowerCase());
      });
      console.log('Filtered beds:', filtered);
      setFilteredBeds(filtered);
    }
  }, [searchQuery, beds]);

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

  const navigateToPatient = (bed: number) => {
    navigation.navigate('patient', { bed, room, ward, floor });
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>Select a bed to view Patient</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search beds..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#64748b"
          />
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.cardGrid}>
          {filteredBeds.map((bed: number) => (
            <TouchableOpacity
              key={bed}
              style={[styles.bedCard, { width: `${100 / numColumns - 3}%` }]}
              onPress={() => navigateToPatient(bed)}
            >
              <View style={styles.bedIconContainer}>
                <BedDouble size={32} color="#166534" />
              </View>
              <Text style={styles.bedTitle}>Bed {bed}</Text>
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
  bedCard: {
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
  bedIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(22, 101, 52, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  bedTitle: {
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