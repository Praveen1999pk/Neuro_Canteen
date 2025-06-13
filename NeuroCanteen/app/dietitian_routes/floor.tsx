import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { DoorOpen as Door, ArrowRight, Search } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import axiosInstance from '../api/axiosInstance';

export default function DietitianHomeScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { floor } = route.params as { floor: number }; 
  const [wards, setwards] = useState<number[]>([]);
  const [filteredWards, setFilteredWards] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [numColumns, setNumColumns] = useState(2);

  useEffect(() => {
    const fetchWards = async () => {
      try {
        const response = await axiosInstance.get(`/patient/wards/${floor}`);
        const data = response.data;
        console.log('Fetched wards:', data);
        setwards(data);
        setFilteredWards(data);
      } catch (error) {
        console.error('Failed to fetch floors:', error);
      }
    };

    fetchWards();
  }, []);

  useEffect(() => {
    console.log('Search query:', searchQuery);
    console.log('Current wards:', wards);
    if (searchQuery.trim() === '') {
      setFilteredWards(wards);
    } else {
      const filtered = wards.filter(ward => {
        const wardStr = `Ward${ward.toString().padStart(3, '0')}`;
        return wardStr.toLowerCase().includes(searchQuery.toLowerCase());
      });
      console.log('Filtered wards:', filtered);
      setFilteredWards(filtered);
    }
  }, [searchQuery, wards]);

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

  const navigateToWard = (ward: number) => {
    navigation.navigate('rooms', { ward, floor });
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wards in Floor {floor}</Text>
        <Text style={styles.headerSubtitle}>Select a ward to view Rooms</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search wards..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#64748b"
          />
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.cardGrid}>
          {filteredWards.map((ward: number) => (
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
