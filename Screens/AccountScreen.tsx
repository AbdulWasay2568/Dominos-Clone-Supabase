import React from 'react'; 
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'; 
import { Ionicons } from '@expo/vector-icons'; 
import { useNavigation, NavigationProp } from '@react-navigation/native'; 
import { NativeStackNavigationProp } from '@react-navigation/native-stack';


type RootStackParamList = {
  MyDetails: undefined;
  History: undefined;
  Favourites: undefined;
  Auth: undefined;
};

type AccountScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MyDetails'>;


const AccountScreen = () => {
  const navigation = useNavigation<AccountScreenNavigationProp>();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Options Section */}
        <View style={styles.optionsContainer}>
          <View style={styles.optionRow}>
            <TouchableOpacity 
              style={styles.optionBox} 
              onPress={() => navigation.navigate('MyDetails')}>
              <Ionicons name="person-outline" size={24} color="black" />
              <Text style={styles.optionText}>My Details</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.optionBox} 
              onPress={() => navigation.navigate('History')}>
              <Ionicons name="receipt-outline" size={24} color="black" />
              <Text style={styles.optionText}>Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.optionBox} 
              onPress={() => navigation.navigate('Favourites')}>
              <Ionicons name="heart-outline" size={24} color="black" />
              <Text style={styles.optionText}>Favourites</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Logout Button */}
      <View style={styles.logoutContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={() => navigation.navigate('Auth')}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    margin: 10,
  },
  optionsContainer: {
    backgroundColor: '#fff',
    marginBottom: 16,
    justifyContent: 'center',
    alignContent: 'center',
    marginTop: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignContent: 'center',
    flexWrap: 'wrap',
    width: 300,
    backgroundColor: '#fff',
    padding: 16,
    margin: 20,
  },
  optionBox: {
    margin: 5,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    padding: 10,
    borderWidth: 1,
    height: 80,
    width: 100,
    alignItems: 'center',
  },
  optionText: {
    marginTop: 8,
    fontSize: 12,
  },
  logoutContainer: {
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  logoutButton: {
    backgroundColor: "#007BFF",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default AccountScreen;
