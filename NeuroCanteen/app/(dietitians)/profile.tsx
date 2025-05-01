import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  Animated, 
  Platform
} from 'react-native';
import { router } from 'expo-router';
import { User, LogOut, Settings, Bell, Shield, CircleHelp as HelpCircle } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

export default function ProfileScreen() {
  const [username, setUsername] = useState<string | null>("Dietitian-1");
  
  // Animation setup
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            // await logout();
            router.replace('/(Role)/dietitian');
          },
        },
      ]
    );
  };

  const renderAnimatedOption = (icon: React.ReactNode, text: string, onPress: () => void, index: number) => {
    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ 
            translateY: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 10 * index]
            }) 
          }]
        }}
      >
        <TouchableOpacity style={styles.optionItem} onPress={onPress}>
          {icon}
          <Text style={styles.optionText}>{text}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>My Profile</Text>
      </View>
      
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <User size={40} color="white" />
        </View>
        <Text style={styles.username}>{username || 'Staff User'}</Text>
        <Text style={styles.role}>Dietitian Account</Text>
      </View>
      
      <View style={styles.optionsContainer}>
        {/* {renderAnimatedOption(
          <Settings size={22} color="#1B5E20" />,
          "Account Settings",
          () => Alert.alert("Settings", "Account settings pressed"),
          0
        )} */}
        
        {/* {renderAnimatedOption(
          <Bell size={22} color="#1B5E20" />,
          "Notifications",
          () => Alert.alert("Notifications", "Notifications pressed"),
          1
        )} */}
        
        {renderAnimatedOption(
          <Shield size={22} color="#1B5E20" />,
          "Privacy & Security",
          () => Alert.alert("Privacy", "Privacy settings pressed"),
          2
        )}
        
        {renderAnimatedOption(
          <HelpCircle size={22} color="#1B5E20" />,
          "Help & Support",
          () => Alert.alert("Help", "Help & support pressed"),
          3
        )}
        
        {renderAnimatedOption(
          <LogOut size={22} color="#E53935" />,
          "Logout",
          handleLogout,
          4
        )}
      </View>
      
      <View style={styles.appInfoContainer}>
        <Text style={styles.appVersion}>NeuroCanteen v1.0.0</Text>
        <Text style={styles.appCopyright}>© 2025 All Rights Reserved</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: Platform.OS === 'web' ? 40 : 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1B5E20',
  },
  profileHeader: {
    alignItems: 'center',
    marginVertical: 24,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1B5E20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  username: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1B5E20',
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
    color: '#2E7D32',
    opacity: 0.8,
  },
  optionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  optionText: {
    fontSize: 16,
    marginLeft: 16,
    color: '#212121',
    flex: 1,
  },
  appInfoContainer: {
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 32,
  },
  appVersion: {
    fontSize: 14,
    color: '#2E7D32',
    marginBottom: 4,
  },
  appCopyright: {
    fontSize: 12,
    color: '#757575',
  }
});