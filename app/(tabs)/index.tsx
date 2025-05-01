import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { getAllAnimalRecords, getMonthlyExpense } from '../../firebase/firestore';
import { auth, db } from '../../firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import SignOutButton from '../components/SignOutButton';

interface Permissions {
  canCreateExpense?: boolean;
  canCreateInvoice?: boolean;
  canManageAnimals?: boolean;
  canManageCollections?: boolean;
  canManageUsers?: boolean;
  canViewMonthlyProfit?: boolean;
  [key: string]: boolean | undefined;
}

interface UserData {
  fullName: string;
  lastName: string;
  firstName: string;
  name?: string;
  permissions?: Permissions;
  admin?: boolean;
}

interface AnimalRecord {
  purchaseDate: string;
  profit?: number;
  loss?: number;
}

interface Stats {
  activeAnimals: number;
  monthlyProfitLoss: number;
  monthlyExpenseEntered: boolean;
}

const HomeScreen: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permissions>({});
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('Farmer');
  const [stats, setStats] = useState<Stats>({
    activeAnimals: 0,
    monthlyProfitLoss: 0,
    monthlyExpenseEntered: false,
  });

  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Get reference to users collection
        const usersCollectionRef = collection(db, 'users');
        
        // Create a query to find the user with matching email
        const q = query(usersCollectionRef, where('email', '==', currentUser.email));
        
        // Set up listener for query results
        const unsubscribeUser = onSnapshot(q, (querySnapshot) => {
          if (!querySnapshot.empty) {
            // Get first matching user document
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data() as UserData;
            
            // Correctly set user name from Firestore
            // setUserName(userData.fullName || 'Farmer');
            
            // // Correctly set user permissions from Firestore
            // setPermissions(userData.permissions || {});
            // setIsAdmin(userData.admin || false);
            
            // console.log("User data loaded:", userData);
            // console.log("Permissions:", userData.permissions);
            const isSuperAdmin = userData.admin === true || currentUser.email === 'ammarmohib09@gmail.com';
console.log("Is super admin:", isSuperAdmin);
const fullPermissions: Permissions = {
  canCreateExpense: true,
  canCreateInvoice: true,
  canManageAnimals: true,
  canManageCollections: true,
  canManageUsers: true,
  canViewMonthlyProfit: true,
};

setUserName(userData.fullName || 'Farmer');
setIsAdmin(isSuperAdmin);
setPermissions(isSuperAdmin ? fullPermissions : (userData.permissions || {}));

          } else {
            console.log("No user found with email:", currentUser.email);
            // Set default values if no matching user found
            const isSuperAdmin = currentUser.email === 'ammarmohib09@gmail.com';
console.log("Is super admin:", isSuperAdmin);
const fullPermissions: Permissions = {
  canCreateExpense: true,
  canCreateInvoice: true,
  canManageAnimals: true,
  canManageCollections: true,
  canManageUsers: true,
  canViewMonthlyProfit: true,
};

// setUserName(userData.fullName || 'Farmer');
setIsAdmin(isSuperAdmin);
setPermissions(isSuperAdmin ? fullPermissions : permissions);
console.log("Permissions:", permissions);
            // setUserName(currentUser.displayName || 'Farmer');
            // setPermissions({});
            // setIsAdmin(false);
          }
          
          // Load dashboard data after attempting to get user information
          loadDashboardData();
        });

        return () => unsubscribeUser();
      } else {
        setUser(null);
        setUserName('Farmer');
        setPermissions({});
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const currentDate = new Date();
      const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

      const records: AnimalRecord[] = await getAllAnimalRecords();
      const monthlyExpense = await getMonthlyExpense(currentMonthStr);

      const currentMonthRecords = records.filter(record => {
        const purchaseDate = new Date(record.purchaseDate);
        return (
          purchaseDate.getMonth() === currentDate.getMonth() &&
          purchaseDate.getFullYear() === currentDate.getFullYear()
        );
      });

      const profitLoss = currentMonthRecords.reduce((total, record) => {
        return total + (record.profit || 0) - (record.loss || 0);
      }, 0);

      setStats({
        activeAnimals: records.length,
        monthlyProfitLoss: profitLoss,
        monthlyExpenseEntered: monthlyExpense !== null,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const getTimeOfDay = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../assets/images/icon.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Farm Expense Manager</Text>
      </View>

      <View style={styles.welcomeSection}>
        <View style={styles.welcomeHeader}>
          <View>
            <Text style={styles.welcomeText}>{getTimeOfDay()},</Text>
            <Text style={styles.nameText}>{userName}</Text>
            <Text style={styles.dateText}>{new Date().toDateString()}</Text>
          </View>
          <SignOutButton />
        </View>
      </View>

      {/* Summary Cards */}
      <View style={styles.cardsContainer}>
        {/* Only show Animal Records card if user has permission */}
        {permissions.canManageAnimals && (
          <TouchableOpacity 
            style={styles.card}
            onPress={() => router.push('/records')}
          >
            <View style={styles.cardIconContainer}>
              <Ionicons name="paw" size={28} color={Colors.light.tint} />
            </View>
            <Text style={styles.cardLabel}>Active Animals</Text>
            <Text style={styles.cardValue}>{stats.activeAnimals}</Text>
          </TouchableOpacity>
        )}

        {/* Only show Monthly Profit card if user has permission */}
        {permissions.canViewMonthlyProfit && (
          <TouchableOpacity 
            style={styles.card}
            onPress={() => router.push('/reports')}
          >
            <View style={styles.cardIconContainer}>
              <Ionicons 
                name={stats.monthlyProfitLoss >= 0 ? "trending-up" : "trending-down"} 
                size={28} 
                color={stats.monthlyProfitLoss >= 0 ? '#4CAF50' : '#F44336'} 
              />
            </View>
            <Text style={styles.cardLabel}>
              Monthly {stats.monthlyProfitLoss >= 0 ? 'Profit' : 'Loss'}
            </Text>
            <Text 
              style={[
                styles.cardValue, 
                stats.monthlyProfitLoss >= 0 ? styles.profitText : styles.lossText
              ]}
            >
              {formatCurrency(Math.abs(stats.monthlyProfitLoss))}
            </Text>
          </TouchableOpacity>
        )}

        {/* Only show Monthly Expense card if user has permission */}
        {permissions.canCreateExpense && (
          <TouchableOpacity 
            style={styles.card}
            onPress={() => router.push('/expenses')}
          >
            <View style={styles.cardIconContainer}>
              <Ionicons 
                name={stats.monthlyExpenseEntered ? "checkmark-circle" : "alert-circle"} 
                size={28} 
                color={stats.monthlyExpenseEntered ? '#4CAF50' : '#FF9800'} 
              />
            </View>
            <Text style={styles.cardLabel}>Monthly Expense</Text>
            <Text 
              style={[
                styles.cardValue, 
                stats.monthlyExpenseEntered ? styles.expenseEnteredText : styles.expenseMissingText
              ]}
            >
              {stats.monthlyExpenseEntered ? 'Entered' : 'Missing!'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.actionButtons}>
          {/* Add Record Button - Only show if user has permission */}
          {permissions.canManageAnimals && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/records/new')}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="add-circle" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.actionText}>Add Record</Text>
            </TouchableOpacity>
          )}

          {/* View Records Button - Only show if user has permission */}
          {permissions.canManageAnimals && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/records')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#FF9800' }]}>
                <Ionicons name="list" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.actionText}>View Records</Text>
            </TouchableOpacity>
          )}

          {/* Expenses Button - Only show if user has permission */}
          {permissions.canCreateExpense && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/expenses')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#2196F3' }]}>
                <Ionicons name="wallet" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.actionText}>Expenses</Text>
            </TouchableOpacity>
          )}

          {/* Reports Button - Only show if user has permission */}
          {permissions.canViewMonthlyProfit && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/reports')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#673AB7' }]}>
                <Ionicons name="bar-chart" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.actionText}>Reports</Text>
            </TouchableOpacity>
          )}

          {/* Create Invoice Button - Only show if user has permission */}
          {permissions.canCreateInvoice && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/invoices/new')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#009688' }]}> 
                <Ionicons name="document-text" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.actionText}>Create Invoice</Text>
            </TouchableOpacity>
          )}

          {/* Breeding Button - Only show if user has permission for animal management */}
          {permissions.canManageAnimals && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/breeding')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#E91E63' }]}> 
                <Ionicons name="paw" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.actionText}>Breeding</Text>
            </TouchableOpacity>
          )}

          {/* Load In/Load Out Button - Only show if user has permission for collections management */}
          {permissions.canManageCollections && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/loading')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#795548' }]}> 
                <Ionicons name="swap-horizontal" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.actionText}>Load In / Load Out</Text>
            </TouchableOpacity>
          )}

          {/* Sale/Purchase Button - Only show if user has permission for collections */}
          {permissions.canManageCollections && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/sale')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#E91E63' }]}> 
                <Ionicons name="cart-outline" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.actionText}>Sale / Purchase</Text>
            </TouchableOpacity>
          )}
          
          {/* Users Management - Only show for admins */}
          {permissions.canManageUsers && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/admin/dashboard')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#3F51B5' }]}> 
                <Ionicons name="people" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.actionText}>Manage Users</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  welcomeSection: {
    backgroundColor: Colors.light.tint,
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  nameText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  dateText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    marginTop: -14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    width: '31%',
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 15,
    alignItems: 'center',
  },
  cardIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  profitText: {
    color: '#4CAF50',
  },
  lossText: {
    color: '#F44336',
  },
  expenseEnteredText: {
    color: '#4CAF50',
  },
  expenseMissingText: {
    color: '#FF9800',
  },
  actionsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 15,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#444',
  },
  warningContainer: {
    backgroundColor: '#FFF9C4',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    flexDirection: 'column',
    alignItems: 'center',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#FF9800',
    marginVertical: 10,
    textAlign: 'center',
  },
  warningButton: {
    backgroundColor: '#FF9800',
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginTop: 5,
  },
  warningButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  refreshText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginBottom: 20,
  },
});

export default HomeScreen;