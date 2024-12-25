import React, { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet } from 'react-native';

const Loader = () => {
  const scale = useRef(new Animated.Value(1)).current; // Animated value for scaling

  // Pulsating animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.2, // Scale up
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1, // Scale down
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start(); // Start the pulsating animation

    return () => pulse.stop(); // Cleanup the animation on component unmount
  }, [scale]);

  return (
    <View style={styles.loaderContainer}>
      <Animated.Image
        source={require('../assets/images/logo.gif')}
        style={[styles.image, { transform: [{ scale }] }]} // Apply animated scale to the image
      />
    </View>
  );
};

const styles = StyleSheet.create({
    loaderContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',  // Transparent background
        zIndex: 1000,  // Ensures it appears on top of other elements
      },  image: {
    width: 100,
    height: 100,
  },
});

export default Loader;
