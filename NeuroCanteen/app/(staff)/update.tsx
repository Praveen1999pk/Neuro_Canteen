import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
} from 'react-native';
import { Search } from 'lucide-react-native';

export default function UpdateStaff() {
  const [searchQuery, setSearchQuery] = useState('');
  const [staffList, setStaffList] = useState([
    { id: '1', name: 'John Doe', department: 'IT', employeeId: 'EMP001' },
    { id: '2', name: 'Jane Smith', department: 'HR', employeeId: 'EMP002' },
    // Add more dummy data as needed
  ]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Implement search logic here
  };

  const renderStaffItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.staffCard}>
      <View>
        <Text style={styles.staffName}>{item.name}</Text>
        <Text style={styles.staffDetails}>ID: {item.employeeId}</Text>
        <Text style={styles.staffDetails}>Department: {item.department}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Search size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search staff..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      <FlatList
        data={staffList}
        renderItem={renderStaffItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 8,
  },
  listContainer: {
    padding: 16,
  },
  staffCard: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  staffName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  staffDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
});