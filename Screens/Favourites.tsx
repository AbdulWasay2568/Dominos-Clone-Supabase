import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import Loader from '@/components/Loader';

type Product = {
  id: number;
  name: string;
  category?: string;
  image_url: string;
  description: string;
  price: number;
};

interface FavouritesProps {
  navigation: NavigationProp<any>;
}

const { width } = Dimensions.get('window');

const Favourites: React.FC<FavouritesProps> = ({ navigation }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

const fetchFavourites = async () => {
    try {
      console.log('Fetching favourites...');
      setLoading(true);
    
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
      if (sessionError) throw new Error('Error fetching session: ' + sessionError.message);
    
      if (!session) {
        console.log('User is not logged in, navigating to Auth screen.');
        navigation.navigate('Auth');
        return;
      }
    
      const userID = session.user.id;
      console.log('User ID:', userID);
    
      const { data, error } = await supabase
        .from('Favourites')
        .select(`
          productID,
          Product (
            id,
            name,
            description,
            price,
            image_url
          )
        `)
        .eq('userID', userID);
    
      if (error) throw new Error('Error fetching favourites: ' + error.message);
    
      const favouriteProducts = data.map((fav: any) => ({
        id: fav.Product.id,
        name: fav.Product.name,
        description: fav.Product.description,
        price: fav.Product.price,
        image_url: fav.Product.image_url,
      }));
    
      setProducts(favouriteProducts);
    } catch (error: unknown) {

      if (error instanceof Error) {
        console.error('Error fetching favourites:', error.message);
      } else {
        console.error('Unexpected error:', error);
      }
    } finally {
      setLoading(false); 
    }
  }
    
    

  const removeProduct = async (id: number) => {
    try {
      console.log('Removing product with ID:', id);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.log('User is not logged in, navigating to Auth screen.');
        navigation.navigate('Auth');
        return;
      }

      const userID = session.user.id;

      const { error } = await supabase
        .from('Favourites')
        .delete()
        .eq('userID', userID)
        .eq('productID', id);

      if (error) throw new Error('Error removing product: ' + error.message);

      setProducts((prevProducts) => prevProducts.filter((product) => product.id !== id));
      console.log('Product successfully removed.');
    }   catch (error: unknown) {

      if (error instanceof Error) {
        console.error('Error removing product:', error.message);
      } else {
        console.error('Unexpected error:', error);
      }
    }
  };



  const navigateToItemPage = (item: Product) => {
    console.log('Navigating to item page with productID:', item.id);

    console.log('Favourites successfully fetched.',products);
    navigation.navigate('Item', { 
      itemId: item.id, 
      products 
    });
  };

  const renderProduct = ({ item }: { item: Product | undefined }) => {
    if (!item) return null;

    return (
      <TouchableOpacity
        style={[styles.card, { width: width / 2 - 30 }]}
        onPress={() => navigateToItemPage(item)}
      >
        <Image source={{ uri: item.image_url }} style={styles.image} />

        <View style={styles.titleContainer}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <TouchableOpacity onPress={() => removeProduct(item.id)}>
            <Ionicons name="heart" size={24} color="#e63946" />
          </TouchableOpacity>
        </View>

        <Text style={styles.cardDescription}>{item.description}</Text>
        <Text style={styles.price}>Rs. {item.price}</Text>
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    fetchFavourites();
  }, []);

  if (loading) {
    return (
      <>
        <Loader />
      </>
    );
  }

  return (
    <SafeAreaProvider style={styles.container}>
      <View style={{ flex: 1 }}>
        <FlatList
          data={products || []} 
          renderItem={renderProduct}
          keyExtractor={(product) => product?.id?.toString() || Math.random().toString()}
          numColumns={2}
          columnWrapperStyle={styles.row}
        />
      </View>
    </SafeAreaProvider>
  );
};

export default Favourites;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  card: {
    marginVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: 15,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
    flex: 1,
  },
  cardDescription: {
    color: '#666',
    fontSize: 12,
    marginVertical: 5,
    textAlign: 'center',
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
    color: '#e63946',
    textAlign: 'center',
  },
});
