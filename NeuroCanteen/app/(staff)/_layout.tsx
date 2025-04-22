import { Tabs } from 'expo-router';
import { UserPlus, UserCog } from 'lucide-react-native';

export default function StaffLayout() {
  return (
    <Tabs screenOptions={{ headerShown: true }}>
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add Staff',
          tabBarIcon: ({ size, color }) => (
            <UserPlus size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="update"
        options={{
          title: 'Update Staff',
          tabBarIcon: ({ size, color }) => (
            <UserCog size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}