import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '@/lib/supabase';

type Product = {
  id: number;
  name: string;
  categoryID: string;
  image_url: string;
  description: string;
  price: number;
  stock: number;
};

type Category = {
  id: string;
  name: string;
};

interface MenuProps {
  navigation: NavigationProp<any>;
}

const { width } = Dimensions.get('window');

const Menu: React.FC<MenuProps> = ({ navigation }) => {
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [productsData, setProductsData] = useState<Product[]>([]);
  const sectionListRef = useRef<SectionList<Product> | null>(null);
  const [favouriteProducts, setFavouriteProducts] = useState<number[]>([]);
  

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data: fetchedCategories, error } = await supabase.from('Category').select('*');
        if (error) throw error;
        setCategories(fetchedCategories || []);
        if (fetchedCategories.length > 0) {
          setActiveCategory(fetchedCategories[0].name); 
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error('Error fetching categories:', error.message);
        } else {
          console.error('An unexpected error occurred:', error);
        }
      }
    };
  
    const fetchProducts = async () => {
      try {
        const { data: fetchedProducts, error } = await supabase.from('Product').select('*');
        if (error) throw error;
        setProductsData(fetchedProducts || []);
      } catch (error) {
        if (error instanceof Error) {
          console.error('Error fetching products:', error.message);
        } else {
          console.error('An unexpected error occurred:', error);
        }
      }
    };
  
    fetchCategories();
    fetchProducts();
  }, []);
  
  const groupedProducts = categories.map((category) => ({
    title: category.name,
    data: productsData.filter((product) => product.categoryID === category.id),
  }));

  const handleCategoryPress = (categoryName: string) => {
    setActiveCategory(categoryName);
    const sectionIndex = categories.findIndex((item) => item.name === categoryName);
    if (sectionListRef.current && sectionIndex !== -1) {
      sectionListRef.current.scrollToLocation({
        sectionIndex,
        itemIndex: 0,
        animated: true,
      });
    }
  };

  const navigateToItemPage = (item: Product) => {
    navigation.navigate('Item', { itemId: item.id, products: productsData });
  };

  const toggleFavourite = async (productId: number) => {

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
    if (!session || sessionError) {
      console.log("User is not logged in");
      navigation.navigate("Auth"); 
      return;
    }
  
    const userID = session.user.id;
    console.log("Logged-in user ID:", userID);
  
    try {
      // Check if the product is already a favorite
      const { data: existingFavourite, error: fetchError } = await supabase
        .from('Favourites')
        .select('*')
        .eq('userID', userID)
        .eq('productID', productId)
        .single();
  
      if (fetchError && fetchError.code !== 'PGRST116') { 
        throw fetchError;
      }
  
      if (existingFavourite) {
        // If the product is already a favorite, remove it
        const { error: deleteError } = await supabase
          .from('Favourites')
          .delete()
          .eq('id', existingFavourite.id);
  
        if (deleteError) {
          throw deleteError;
        }
  
        console.log(`Removed product ${productId} from favorites`);
        setFavouriteProducts((prevFavourites) =>
          prevFavourites.filter((id) => id !== productId)
        );
      } else {
        // If the product is not a favorite, add it
        const { error: insertError } = await supabase
          .from('Favourites')
          .insert({ userID, productID: productId });
  
        if (insertError) {
          throw insertError;
        }
  
        console.log(`Added product ${productId} to favorites`);
        setFavouriteProducts((prevFavourites) => [...prevFavourites, productId]);
      }
    }  catch (error) {
      if (error instanceof Error) {
        console.error('Error toggling favorite:', error.message);
      } else {
        console.error('An unexpected error occurred:', error);
      }
    } finally {
    }
  };

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case 'pizzas':
        return 'pizza-outline';
      case 'sides':
        return 'fast-food-outline'; 
      case 'drinks':
        return 'wine-outline';
      case 'desserts':
        return 'ice-cream-outline';
      case 'meltz':
        return 'restaurant-outline';
      default:
        return 'restaurant-outline'; 
    }
  };
  
  
  const renderCategoryItem = ({ item }: { item: Category }) => (
    
    <TouchableOpacity onPress={() => handleCategoryPress(item.name)}>
      <Text
        style={[styles.category, activeCategory === item.name && styles.activeCategory]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );
  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.products}>

    <TouchableOpacity
      style={[styles.card]}
      onPress={() => navigateToItemPage(item)}
    >
      <Image source={{ uri: item.image_url }} style={styles.image} />
      <View style={styles.titleContainer}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <TouchableOpacity onPress={() => toggleFavourite(item.id)}>
          <Ionicons
            name={favouriteProducts.includes(item.id) ? 'heart' : 'heart-outline'}
            size={24}
            color="#e63946"
          />
        </TouchableOpacity>
      </View>
      <Text style={styles.cardDescription}>{item.description}</Text>
      <Text style={styles.price}>Rs. {item.price}</Text>
    </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaProvider style={styles.container}>
      <View style={{ flex: 1 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
          {categories.map((category) => (
            <TouchableOpacity key={category.id} onPress={() => handleCategoryPress(category.name)}>

              <View style={styles.categoryIconContainer}>
                <Ionicons
                  name={getCategoryIcon(category.name)}
                  size={24}
                  color={activeCategory === category.name ? '#e63946' : '#666'}
                />
                <Text
                  style={[
                    styles.category,
                    activeCategory === category.name && styles.activeCategory,
                  ]}
                >
                  {category.name}
                </Text>
              </View>

            </TouchableOpacity>
          ))}
        </ScrollView>
        <SectionList
          ref={sectionListRef}
          sections={groupedProducts}
          renderItem={renderProduct}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.heading}>{title}</Text>
          )}
          keyExtractor={(item) => item.id.toString()}
        />
      </View>
    </SafeAreaProvider>
  );
};

export default Menu;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  categories: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  category: {
    // marginHorizontal: 5,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    padding: 5,
  },
  activeCategory: {
    color: '#e63946',
    borderBottomWidth: 2,
    borderBottomColor: '#e63946',
  },
  categoryIconContainer: {
    alignItems: 'center',
    marginHorizontal: 10,
  },
  
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    marginVertical: 10,
  },
  products:{


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
    margin: 10
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
    fontSize: 16,
     flex: 1,
    marginRight: 8,
    textAlign: 'center'
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
