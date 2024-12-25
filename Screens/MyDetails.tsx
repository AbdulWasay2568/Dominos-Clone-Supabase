import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,  
} from 'react-native';
import { supabase } from "@/lib/supabase";
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  MyDetails: undefined;
  Auth: undefined;
};

type MyDetailsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MyDetails'
>;

interface MyDetailsProps {
  navigation: MyDetailsScreenNavigationProp;
}

const MyDetails: React.FC<MyDetailsProps> = ({ navigation }) => {
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    email: '',
    avatar_url: '',
    phoneNumber: ''
  });

  const [loading, setLoading] = useState(false);  

  const fetchUserData = async () => {
    setLoading(true);
    try {

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) throw new Error('Error fetching session: ' + sessionError.message);

      if (!session) {
        console.log('User is not logged in, navigating to Auth screen.');
        navigation.navigate('Auth');
        setLoading(false);  
        return;
      }

      const userID = session.user.id;
      console.log('User ID:', userID);

      const { data, error } = await supabase
        .from('users')
        .select('firstName, lastName, email, address, avatar_url, phoneNumber')
        .eq('id', userID)
        .single();

      if (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Error', 'Unable to fetch user data.');
        setLoading(false);  // Hide loader
        return;
      }

      const filteredData = Object.fromEntries(
        Object.entries(data || {}).filter(([_, value]) => value !== null)
      ) as {
        firstName: string;
        lastName: string;
        email: string;
        address: string;
        avatar_url: string;
        phoneNumber: string;
      };

      setUserData(filteredData);
    } catch (err) {
      console.error('Unexpected error:', err);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setLoading(false);  
    }
  };

  const updateUserData = async () => {
    setLoading(true);  
    try {

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) throw new Error('Error fetching session: ' + sessionError.message);

      if (!session) {
        console.log('User is not logged in, navigating to Auth screen.');
        navigation.navigate('Auth');
        setLoading(false);  
        return;
      }

      const userID = session.user.id;
      console.log("User ID:", userID);

      const updateFields = Object.fromEntries(
        Object.entries(userData).filter(([_, value]) => value !== '')
      );

      console.log("Update fields:", updateFields); 

      const { error, data } = await supabase
        .from('users') 
        .update(updateFields)
        .eq('id', userID);

      console.log('Response data:', data);
      if (error) {
        console.error('Error updating user data:', error);
        Alert.alert('Error', `Unable to update user data: ${error.message}`);
        setLoading(false);  
        return;
      }

      console.log('Success', 'User details updated successfully.');
    } catch (err) {
      console.error('Unexpected error:', err);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setLoading(false);  
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.profileImageContainer}>
        <Image
          source={{ uri: userData.avatar_url || 'https://via.placeholder.com/150' }}
          style={styles.profileImage}
        />
      </View>

      {/* Input Fields */}
      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={userData.firstName}
        onChangeText={(text) => setUserData((prev) => ({ ...prev, firstName: text }))} 
      />
      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={userData.lastName}
        onChangeText={(text) => setUserData((prev) => ({ ...prev, lastName: text }))} 
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={userData.email}
        onChangeText={(text) => setUserData((prev) => ({ ...prev, email: text }))} 
      />
      <TextInput
        style={styles.input}
        placeholder="Address"
        value={userData.address}
        onChangeText={(text) => setUserData((prev) => ({ ...prev, address: text }))} 
      />
      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        value={userData.phoneNumber}
        keyboardType="phone-pad"
        onChangeText={(text) => setUserData((prev) => ({ ...prev, phoneNumber: text }))} 
      />

      {/* Loader */}
      {loading ? (
        <ActivityIndicator size="large" color="#0056A3" />
      ) : (
        <TouchableOpacity style={styles.saveButton} onPress={updateUserData}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#ccc',
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  saveButton: {
    backgroundColor: '#0056A3',
    width: '100%',
    padding: 16,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MyDetails;
