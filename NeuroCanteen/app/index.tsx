import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Users, User, Bed, Stethoscope, Bike, UtensilsCrossed } from 'lucide-react-native';

const roles = [
  { id: 'admin', name: 'Admin', icon: User, color: '#0F5132' },
  { id: 'staff', name: 'Staff', icon: Users, color: '#0F5132' },
  { id: 'patient', name: 'Patient', icon: Bed, color: '#0F5132' },
  { id: 'dietitian', name: 'Dietitian', icon: Stethoscope, color: '#0F5132' },
  { id: 'delivery', name: 'Delivery', icon: Bike, color: '#0F5132' },
  { id: 'kitchen', name: 'Kitchen', icon: UtensilsCrossed, color: '#0F5132' },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://scontent.fmaa12-2.fna.fbcdn.net/v/t39.30808-6/461422381_3354642994665738_5310835880152761256_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=a5f93a&_nc_ohc=gBoTwlzQYV8Q7kNvwFKQSNt&_nc_oc=AdkYAt1WYQSWkHSXBglvaVsgpp9mfDUwdBVUgLON7DtAYKiGgZ58XgKh0Y2QsG8V25UZS3TVmEXoAVRq7Odfs-KP&_nc_zt=23&_nc_ht=scontent.fmaa12-2.fna&_nc_gid=ikjeI72Bjze3UbUwKf5E5Q&oh=00_AYEPnwtDDl9LKJpdPfAX-5DPHTav243akR8f4-4l7m-fRA&oe=67F56E2B' }}
          style={styles.logo} 
          resizeMode='stretch'
        />
        {/* <Text style={styles.title}>Neuro Foundation</Text>
        <Text style={styles.subtitle}>Committed to Neuro Sciences</Text> */}
      </View>

      <View style={styles.rolesGrid}>
        {roles.map((role) => (
          <TouchableOpacity
            key={role.id}
            style={styles.roleCard}
            onPress={() => router.push(`/(Role)/${role.id}`)}
          >
            <View style={styles.iconContainer}>
              <role.icon size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.roleName}>{role.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  logo: {
    width: 300,
    height: 150,
    resizeMode: 'contain',
    
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
  rolesGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-between',
  },
  roleCard: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0F5132',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  roleName: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#0F5132',
    textAlign: 'center',
  },
});