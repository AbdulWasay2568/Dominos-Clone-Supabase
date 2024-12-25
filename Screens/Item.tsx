import React, { useState, useEffect } from 'react'; 
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator } from 'react-native'; 
import { RadioButton } from 'react-native-paper'; 
import { useRoute, useNavigation } from '@react-navigation/native'; 
import { supabase } from '@/lib/supabase';
import Loader from '@/components/Loader';

const { width } = Dimensions.get('window');

type RouteParams = {
  itemId: string;
  products: Array<{ id: string, [key: string]: any }>;
};


const Item = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { itemId, products } = route.params as RouteParams;

  const [addons, setAddons] = useState<Record<string, any>>({});
  const [selectedAddOns, setSelectedAddOns] = useState<Record<string, any>>({});
  
  const [loading, setLoading] = useState(true);
  const [loadingCart, setLoadingCart] = useState(false); 
  const [loadingCartItem, setLoadingCartItem] = useState(false); 


  if (!itemId || !products) {
    return (
      <View style={styles.container}>
        <Text>Item not found</Text>
      </View>
    );
  }

  const item = products.find((product: { id: string }) => product.id === itemId);

  useEffect(() => {
    const fetchAddonsAndOptions = async () => {
      try {
        setLoading(true);
        const { data: addonsData, error } = await supabase
          .from('Addons')
          .select('id, name, AddonOptions (id, option_name, additional_price)')
          .eq('productID', item.id);

        if (error) {
          console.error('Error fetching addons:', error.message);
          return;
        }

        const formattedAddons = {};
        addonsData.forEach((addon) => {
          formattedAddons[addon.name] = addon.AddonOptions.map((option) => ({
            id: option.id,
            name: option.option_name,
            price: option.additional_price,
          }));
        });

        setAddons(formattedAddons);
      } catch (err) {
        console.error((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchAddonsAndOptions();
  }, [item.id]);

  const handleAddOnChange = (category, option) => {
    setSelectedAddOns((prev) => {

      if (prev[category] === option) {
        const updatedAddOns = { ...prev };
        delete updatedAddOns[category]; 
        return updatedAddOns;
      }
  

      return { ...prev, [category]: option };
    });
  };
  
  const calculateTotalAmount = () => {
    const addonsTotal = Object.keys(selectedAddOns).reduce((sum, key) => {
      const selectedOption = addons[key]?.find((option) => option.name === selectedAddOns[key]);
      return sum + (selectedOption?.price || 0);
    }, 0);
    return addonsTotal;
  };

  const handleAddToCart = async () => {

    if (loadingCart || loadingCartItem) {
      return;
    }

    setLoadingCart(true); 

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (!session || sessionError) {
      console.log("User is not logged in");
      navigation.navigate("Auth");
      setLoadingCart(false);
      return;
    }

    const userID = session.user.id;
    const productId = item.id;
    const baseQuantity = 1;
    const totalAmount = calculateTotalAmount();

    console.log(userID);

    try {
      // Step 1: Check if the user has an active cart
      const { data: existingCart, error: fetchError } = await supabase
        .from("Cart")
        .select("id, userID, total_amount")
        .eq("userID", userID);

      if (fetchError) {
        console.error("Error fetching cart:", fetchError.message);
        setLoadingCart(false);
        return;
      }

      // If no cart exists, create a new cart
      if (!existingCart || existingCart.length === 0) {
        console.log("No cart found for the user, creating a new cart.");

        const { data: newCart, error: createCartError } = await supabase
          .from("Cart")
          .insert([
            {
              userID: userID,
              total_amount: totalAmount,
            },
          ])
          .single();

        if (createCartError) {
          console.error("Error creating cart:", createCartError.message);
          setLoadingCart(false);
          return;
        }

        setLoadingCartItem(true); 

        // Step 2: Add product to CartItem table
        const { error: insertCartItemError } = await supabase
          .from("CartItem")
          .insert([
            {
              cartID: newCart.id,
              productID: productId,
              quantity: baseQuantity,
              price: totalAmount,
            },
          ]);

        if (insertCartItemError) {
          console.error("Error adding item to cart:", insertCartItemError.message);
          setLoadingCartItem(false);
          setLoadingCart(false);
          return;
        }

        console.log("Item successfully added to new cart!");


        navigation.navigate("Cart");
        setLoadingCartItem(false);
        setLoadingCart(false);
      } else {

        // Step 3: Cart exists, check for cart item
        const { data: existingCartItem, error: fetchItemError } = await supabase
          .from("CartItem")
          .select("id, cartID, productID, quantity, price")
          .eq("cartID", existingCart[0].id)
          .eq("productID", productId);

        if (fetchItemError && fetchItemError.code !== "PGRST116") {
          console.error("Error fetching cart item:", fetchItemError.message);
          setLoadingCart(false);
          return;
        }

        if (existingCartItem && existingCartItem.length > 0) {
          // Update existing cart item with new quantity
          const updatedQuantity = existingCartItem[0].quantity + baseQuantity;

          // Update cart item quantity
          const { error: updateCartItemError } = await supabase
            .from("CartItem")
            .update({
              quantity: updatedQuantity,
            })
            .eq("id", existingCartItem[0].id);

          if (updateCartItemError) {
            console.error("Error updating cart item:", updateCartItemError.message);
            setLoadingCart(false);
            return;
          }

          // Step 5: Update total amount in Cart table
          const { error: updateCartError } = await supabase
            .from("Cart")
            .update({
              total_amount: existingCart[0].total_amount + totalAmount,
            })
            .eq("id", existingCart[0].id);

          if (updateCartError) {
            console.error("Error updating cart total:", updateCartError.message);
            setLoadingCart(false);
            return;
          }

          console.log("Cart item updated successfully!");
        } else {
          // Add new product to CartItem
          const { error: insertCartItemError } = await supabase
            .from("CartItem")
            .insert([
              {
                cartID: existingCart[0].id,
                productID: productId,
                quantity: baseQuantity,
                price: totalAmount,
              },
            ]);

          if (insertCartItemError) {
            console.error("Error adding item to cart:", insertCartItemError.message);
            setLoadingCart(false);
            return;
          }

          console.log("Item successfully added to cart!");
        }

        // Update total amount in Cart
        const { error: updateCartError } = await supabase
          .from("Cart")
          .update({
            total_amount: existingCart[0].total_amount + totalAmount,
          })
          .eq("id", existingCart[0].id);

        if (updateCartError) {
          console.error("Error updating cart total:", updateCartError.message);
        }

        navigation.navigate("Cart");
        setLoadingCart(false);
      }
    } catch (err) {
      console.error("Error hai abhi:", err.message);
      setLoadingCart(false);
    }
  };

  if (loading) {
    return (
      <>
        <Loader />
      </>
    );
  }
  return (
    <View style={styles.container}>
      <ScrollView>
        <Image source={{ uri: item.image_url }} style={styles.image} />
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.description}>{item.description}</Text>

        {/* Addon Options */}
        {Object.keys(addons).map((category) => (
          <View key={category} style={styles.addonContainer}>
            <Text style={styles.addonTitle}>{category}</Text>
            {addons[category]?.map((option) => (
              <View key={option.id} style={styles.optionContainer}>
                <RadioButton
                  value={option.name}
                  status={selectedAddOns[category] === option.name ? 'checked' : 'unchecked'}
                  onPress={() => handleAddOnChange(category, option.name)}
                />
                <Text>{`${option.name} - Rs. ${option.price}`}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Add to Cart Button */}
      <TouchableOpacity
        style={styles.addToCartButton}
        onPress={handleAddToCart}
        disabled={loadingCart || loadingCartItem} 
      >
        {loadingCart || loadingCartItem ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.addToCartButtonText}>Add to Cart - Rs. {calculateTotalAmount()}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  image: { width: '100%', height: width * 0.6, resizeMode: 'cover', borderRadius: 10 },
  title: { fontSize: 24, fontWeight: 'bold', marginVertical: 10 },
  description: { fontSize: 16, color: '#666', marginBottom: 10 },
  addonContainer: { marginTop: 10 },
  addonTitle: { fontSize: 18, fontWeight: 'bold' },
  optionContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  addToCartButton: { backgroundColor: '#007BFF', paddingVertical: 12, borderRadius: 8, marginTop: 20 },
  addToCartButtonText: { color: '#fff', textAlign: 'center', fontSize: 18 },
});

export default Item;
