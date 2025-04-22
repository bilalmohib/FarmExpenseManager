import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';

type Group = {
  id: string;
  name: string;
  count: number;
  profit: number;
  image: any; // Using 'any' for require() images
};

type CollectionsScreenProps = {
  navigation: StackNavigationProp<any>;
};

const CollectionsScreen: React.FC<CollectionsScreenProps> = ({ navigation }) => {
//   const [groups, setGroups] = useState<Group[]>([
//     { id: '1', name: 'Milking Group A', count: 12, profit: 15000, image: require('/assets/images/cow-group.jpg') },
//     { id: '2', name: 'Breeding Group B', count: 8, profit: -2000, image: require('/assets/images/cow-group.jpg') },
//   ]);

  const renderGroupItem = ({ item }: { item: Group }) => (
    <TouchableOpacity 
      style={styles.groupCard}
      onPress={() => navigation.navigate('CollectionDetail', { groupId: item.id })}
    >
      <Image source={item.image} style={styles.groupImage} />
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>{item.name}</Text>
        <Text style={styles.groupCount}>{item.count} animals</Text>
      </View>
      <Text style={[styles.groupProfit, { color: item.profit >= 0 ? '#4CAF50' : '#F44336' }]}>
        {item.profit >= 0 ? '+' : ''}{item.profit.toLocaleString()} PKR
      </Text>
      <MaterialIcons name="chevron-right" size={24} color="#888" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* <View style={styles.header}>
        <Text style={styles.headerTitle}>Animal Groups</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateCollection')}
        >
          <MaterialIcons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={groups}
        renderItem={renderGroupItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#6200EE',
  },
  headerTitle: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#03DAC6',
    borderRadius: 20,
    padding: 8,
  },
  listContent: {
    padding: 16,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  groupImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  groupCount: {
    fontSize: 14,
    color: '#888',
  },
  groupProfit: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default CollectionsScreen;