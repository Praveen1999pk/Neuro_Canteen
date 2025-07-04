// NeuroCanteen/app/(Role)/[id].tsx
import { useLocalSearchParams } from 'expo-router';
import { View, Text } from 'react-native';
import LoginScreen from './admin';
import Handledeliverylogin from './delivery';
import HandleStaffLogin from './staff'; 
import Handledietitianlogin from './dietitian';
import Handlekitchenlogin from './kitchen';
import HandlepatientLogin from './patient';

export default function RolePage() {
  const { id } = useLocalSearchParams();
  console.log(id);
  
  if (id === 'admin') return <LoginScreen />;
  if (id === 'delivery') return <Handledeliverylogin />;
  if (id === 'staff') return <HandleStaffLogin />;
  if (id === 'dietitian') return <Handledietitianlogin/>;
  if (id === 'kitchen') return <Handlekitchenlogin/>;
  if (id === 'patient') return <HandlepatientLogin/>;

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24 }}>404 - Role Not Found</Text>
    </View>
  );
}