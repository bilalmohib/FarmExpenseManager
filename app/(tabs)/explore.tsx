import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Sample categories data
const categories = [
  {
    id: '1',
    name: 'Cattle',
    icon: 'apps-outline',
    // image: require('../../assets/images/cattle.jpg'),
    // Pick an image from internet
    image: 'https://images.unsplash.com/photo-1502101740006-e1c61dc3320e',
    count: 12
  },
  {
    id: '2',
    name: 'Goats',
    icon: 'apps-outline',
    // image: require('../../assets/images/goats.jpg'),
    // Pick an image from internet
    image: 'https://images.unsplash.com/photo-1502101740006-e1c61dc3320e',
    count: 8
  },
  {
    id: '3',
    name: 'Sheep',
    icon: 'apps-outline',
    // image: require('../../assets/images/sheep.jpg'),
    // Pick an image from internet
    image: 'https://images.unsplash.com/photo-1502101740006-e1c61dc3320e',
    count: 5
  },
  {
    id: '4',
    name: 'Poultry',
    icon: 'apps-outline',
    // image: require('../../assets/images/poultry.jpg'),
    // Pick an image from internet
    image: 'https://images.unsplash.com/photo-1502101740006-e1c61dc3320e',
    count: 20
  },
  {
    id: '5',
    name: 'Other',
    icon: 'apps-outline',
    // image: require('../../assets/images/other.jpg'),
    // Pick an image from internet
    image: 'https://images.unsplash.com/photo-1502101740006-e1c61dc3320e',
    count: 3
  }
];

export default function ExploreScreen() {
  const router = useRouter();

  const handleCategoryPress = (category: typeof categories[0]) => {
    // Navigate to records filtered by category
    router.push({
      pathname: '../records/index',
      params: { category: category.name }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore Categories</Text>
        <Text style={styles.subtitle}>Browse your livestock by categories</Text>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.categoryCard}
            onPress={() => handleCategoryPress(item)}
          >
            <View style={styles.imageContainer}>
              <Image 
                // source={item.image}
                source={{ uri: item.image }} 
                style={styles.categoryImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{item.name}</Text>
              <View style={styles.countContainer}>
                <Ionicons name="analytics-outline" size={16} color="#27ae60" />
                <Text style={styles.countText}>{item.count}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 5,
  },
  list: {
    padding: 10,
  },
  categoryCard: {
    flex: 1,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    height: 120,
    width: '100%',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryInfo: {
    padding: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  countText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#27ae60',
  },
});
