import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { auth, db } from '../../firebase/config';
import { useRouter } from 'expo-router';
import {
  collection,
  query,
  orderBy,
  where,
  getDocs,
  limit,
  Timestamp,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';

// Activity log types
export type ActivityType =
  | 'record_added'
  | 'record_updated'
  | 'record_deleted'
  | 'invoice_generated'
  | 'expense_added'
  | 'expense_updated'
  | 'expense_deleted'
  | 'user_login'
  | 'user_logout'
  | 'load_in'
  | 'load_out'
  | 'breeding_record'
  | 'health_record'
  | 'sale_record'
  | 'purchase_record'
  | 'user_management';

interface ActivityLog {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: Timestamp;
  userId: string;
  metadata?: Record<string, any>;
  userName?: string;
  entityId?: string;
  entityType?: string;
  action?: 'create' | 'update' | 'delete' | 'view';
}

// Helper function to log activities (for use in other parts of the app)
export async function logActivity(
  type: ActivityType, 
  description: string, 
  userId: string,
  options?: {
    metadata?: Record<string, any>;
    userName?: string;
    entityId?: string;
    entityType?: string;
    action?: 'create' | 'update' | 'delete' | 'view';
  }
): Promise<void> {
  try {
    const activityRef = collection(db, 'activityLogs');
    await addDoc(activityRef, {
      type,
      description,
      timestamp: serverTimestamp(),
      userId,
      ...options
    });
    console.log(`Activity logged: ${type}`);
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

export default function ActivityLogScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [filter, setFilter] = useState<ActivityType | 'all'>('all');
  const router = useRouter();

  useEffect(() => {
    loadActivityLogs();
  }, [filter]);

  const loadActivityLogs = async () => {
    try {
      setLoading(true);
      
      // Base query to get all activity logs, sorted by timestamp
      let activityQuery = query(
        collection(db, 'activityLogs'),
        orderBy('timestamp', 'desc'),
        limit(100)
      );

      // If a specific filter is applied
      if (filter !== 'all') {
        activityQuery = query(
          collection(db, 'activityLogs'),
          where('type', '==', filter),
          orderBy('timestamp', 'desc'),
          limit(100)
        );
      }

      const snapshot = await getDocs(activityQuery);
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ActivityLog[];

      setActivityLogs(logs);
    } catch (error) {
      console.error('Error loading activity logs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadActivityLogs();
  };

  const formatTimestamp = (timestamp: Timestamp | any) => {
    if (!timestamp) return 'Unknown time';
    
    try {
      if (timestamp instanceof Timestamp) {
        return new Date(timestamp.seconds * 1000).toLocaleString();
      } else if (typeof timestamp === 'object' && 'toDate' in timestamp) {
        return timestamp.toDate().toLocaleString();
      } else {
        return new Date(timestamp).toLocaleString();
      }
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'Invalid date';
    }
  };

  const renderActivityItem = ({ item }: { item: ActivityLog }) => {
    const getIconAndColor = () => {
      switch (item.type) {
        case 'record_added':
          return { icon: 'add-circle', color: '#27ae60' };
        case 'record_updated':
          return { icon: 'create', color: '#3498db' };
        case 'record_deleted':
          return { icon: 'trash', color: '#e74c3c' };
        case 'invoice_generated':
          return { icon: 'document-text', color: '#9b59b6' };
        case 'expense_added':
          return { icon: 'cash', color: '#f39c12' };
        case 'expense_updated':
          return { icon: 'create', color: '#f39c12' };
        case 'expense_deleted':
          return { icon: 'trash', color: '#e74c3c' };
        case 'user_login':
          return { icon: 'log-in', color: '#2ecc71' };
        case 'user_logout':
          return { icon: 'log-out', color: '#e67e22' };
        case 'load_in':
          return { icon: 'arrow-down', color: '#3498db' };
        case 'load_out':
          return { icon: 'arrow-up', color: '#e74c3c' };
        case 'breeding_record':
          return { icon: 'heart', color: '#e84393' };
        case 'health_record':
          return { icon: 'medkit', color: '#0097e6' };
        case 'sale_record':
          return { icon: 'cart', color: '#27ae60' };
        case 'purchase_record':
          return { icon: 'basket', color: '#8e44ad' };
        case 'user_management':
          return { icon: 'people', color: '#3498db' };
        default:
          return { icon: 'information-circle', color: '#95a5a6' };
      }
    };

    const { icon, color } = getIconAndColor();

    // Get user information
    const userInfo = item.userName || (item.metadata?.email as string) || 'Unknown user';

    return (
      <TouchableOpacity 
        style={styles.activityItem}
        onPress={() => {
          // Handle press - could show more details modal here in the future
        }}
      >
        <View style={styles.activityIconContainer}>
          <Ionicons name={icon as any} size={24} color={color} />
        </View>
        <View style={styles.activityDetails}>
          <Text style={styles.activityTitle}>{item.description}</Text>
          <Text style={styles.activitySubtitle}>
            {formatTimestamp(item.timestamp)}
          </Text>
          {userInfo && (
            <Text style={styles.activityUser}>
              By: {userInfo}
            </Text>
          )}
          <Text style={[styles.activityType, { color }]}>
            {item.type.replace(/_/g, ' ').toUpperCase()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const FilterButton = ({ type, label }: { type: ActivityType | 'all', label: string }) => (
    <TouchableOpacity 
      style={[
        styles.filterButton, 
        filter === type && styles.activeFilterButton
      ]}
      onPress={() => setFilter(type)}
    >
      <Text style={[
        styles.filterButtonText, 
        filter === type && styles.activeFilterButtonText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
   <View style={styles.header}>
  <View style={styles.headerTop}>
    <TouchableOpacity onPress={() => router.push('/(tabs)')}>
      <Ionicons name="arrow-back" size={24} color="#fff" />
    </TouchableOpacity>
    <Text style={styles.headerTitle}>Activity Log</Text>
  </View>
  <Text style={styles.headerSubtitle}>Track all system activities</Text>
</View>

      <ScrollableFilters 
        currentFilter={filter} 
        onFilterChange={setFilter} 
      />

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
          <Text style={styles.loadingText}>Loading Activities...</Text>
        </View>
      ) : (
        <FlatList
          data={activityLogs}
          renderItem={renderActivityItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.activityList}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="information-circle-outline" size={50} color="#bdc3c7" />
              <Text style={styles.emptyText}>No activities found</Text>
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.light.tint]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

// Component for horizontal scrollable filters
function ScrollableFilters({ 
  currentFilter, 
  onFilterChange 
}: { 
  currentFilter: ActivityType | 'all', 
  onFilterChange: (filter: ActivityType | 'all') => void 
}) {
  const filters = [
    { type: 'all' as const, label: 'All Activities' },
    { type: 'record_added' as const, label: 'Records Added' },
    { type: 'record_updated' as const, label: 'Records Updated' },
    { type: 'record_deleted' as const, label: 'Records Deleted' },
    { type: 'invoice_generated' as const, label: 'Invoices' },
    { type: 'expense_added' as const, label: 'Expenses Added' },
    { type: 'expense_updated' as const, label: 'Expenses Updated' },
    { type: 'expense_deleted' as const, label: 'Expenses Deleted' },
    { type: 'user_login' as const, label: 'User Logins' },
    { type: 'user_logout' as const, label: 'User Logouts' },
    { type: 'load_in' as const, label: 'Load In' },
    { type: 'load_out' as const, label: 'Load Out' },
    { type: 'breeding_record' as const, label: 'Breeding' },
    { type: 'health_record' as const, label: 'Health' },
    { type: 'sale_record' as const, label: 'Sales' },
    { type: 'purchase_record' as const, label: 'Purchases' },
    { type: 'user_management' as const, label: 'User Management' }
  ];

  return (
    <FlatList
      horizontal
      data={filters}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[
            styles.filterButton,
            currentFilter === item.type && styles.activeFilterButton
          ]}
          onPress={() => onFilterChange(item.type)}
        >
          <Text style={[
            styles.filterButtonText,
            currentFilter === item.type && styles.activeFilterButtonText
          ]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      )}
      keyExtractor={(item) => item.type}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filtersContainer}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 0,
    // backgroundColor: '#f7f8fc',
    paddingTop: Platform.OS === 'android' ? 15  : 0
  },
  header: {
  paddingHorizontal: 20,
  paddingVertical: 15,
  backgroundColor: Colors.light.tint,
},

headerTop: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 4,
},

headerTitle: {
  fontSize: 20,
  fontWeight: 'bold',
  color: 'white',
  marginLeft: 10,
},

headerSubtitle: {
  fontSize: 14,
  color: 'rgba(255, 255, 255, 0.8)',
},

  filtersContainer: {
  paddingHorizontal: 10,
  paddingVertical: 10, // slightly reduced for mobile
  backgroundColor: 'white',
  borderBottomWidth: 1,
  borderBottomColor: '#eeeeee',
  flexDirection: 'row',
  flexWrap: 'wrap', // allows wrapping on small screens
  justifyContent: 'center',
},

filterButton: {
  paddingHorizontal: 12, // smaller padding
  paddingVertical: 6,
  borderRadius: 16, // slightly smaller for a tighter look
  marginHorizontal: 4,
  marginVertical: 4, // add vertical spacing
  backgroundColor: '#f1f2f6',
},

  activeFilterButton: {
    backgroundColor: Colors.light.tint,
  },
  filterButtonText: {
    color: '#333',
    fontSize: 13,
  },
  activeFilterButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#333',
  },
  activityList: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 20,
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginBottom: 10,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityIconContainer: {
    justifyContent: 'center',
    marginRight: 15,
  },
  activityDetails: {
    flex: 0,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  activityUser: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  activityType: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginTop: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 15,
    color: '#bdc3c7',
    fontSize: 16,
  },
});