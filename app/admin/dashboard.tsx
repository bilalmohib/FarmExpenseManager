import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, Modal, Switch } from 'react-native';
import { Colors } from '../../constants/Colors';
import { db } from '../../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { User, UserPermission, updateUserPermissions } from '../../firebase/firestore';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator } from 'react-native-paper';

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [tempPermissions, setTempPermissions] = useState<UserPermission | null>(null);
  const router = useRouter();

  const defaultPermissions: UserPermission = {
    canCreateInvoice: false,
    canCreateExpense: false,
    canViewMonthlyProfit: false,
    canManageAnimals: false,
    canManageCollections: false,
    canManageUsers: false,
    isAdmin: false,
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList = usersSnapshot.docs.map(doc => {
        const userData = doc.data();
        return {
          id: doc.id,
          ...userData,
          permissions: userData.permissions || defaultPermissions // Set default permissions if none exist
        };
      }) as User[];
      setUsers(usersList);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const openPermissionsModal = (user: User) => {
    setSelectedUser(user);
    setTempPermissions(user.permissions || defaultPermissions);
    setModalVisible(true);
  };
  
  const togglePermission = (permission: keyof UserPermission) => {
    if (tempPermissions) {
      setTempPermissions(prev => ({
        ...prev!,
        [permission]: !prev![permission],
      }));
    }
  };

  const savePermissions = async () => {
    if (!selectedUser || !tempPermissions) return;
    try {
      await updateUserPermissions(selectedUser.id, tempPermissions);
      Alert.alert('Success', 'Permissions updated successfully');
      setModalVisible(false);
      fetchUsers();
    } catch (error) {
      Alert.alert('Error', 'Failed to update permissions');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
      <TouchableOpacity 
      // style={styles.backButton}
      onPress={() => router.push('/(tabs)')}
    >
      <Ionicons name="arrow-back" size={24} style={{color: '#fff', marginRight: 10}} />
    </TouchableOpacity>
        <Text style={styles.title}>User Management</Text>
      </View>

      <ScrollView style={styles.content}>
        {users.length > 0 ? users.map(user => (
          <View key={user.id} style={styles.userCard}>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>

            <TouchableOpacity 
              style={styles.permissionButton}
              onPress={() => openPermissionsModal(user)}
            >
              <Text style={styles.permissionButtonText}>Permissions</Text>
            </TouchableOpacity>
          </View>
        )): <Text style={{textAlign: 'center', marginTop: 20}}>No users found</Text>}
        {loading && <ActivityIndicator />}
      </ScrollView>

      {/* Permissions Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Permissions</Text>
            {tempPermissions && (
              <ScrollView style={{maxHeight: 400}}>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Create Invoice</Text>
                  <Switch
                    value={tempPermissions.canCreateInvoice}
                    onValueChange={() => togglePermission('canCreateInvoice')}
                  />
                </View>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Create Expense</Text>
                  <Switch
                    value={tempPermissions.canCreateExpense} 
                    onValueChange={() => togglePermission('canCreateExpense')}
                  />
                </View>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>View Monthly Profit</Text>
                  <Switch
                    value={tempPermissions.canViewMonthlyProfit}
                    onValueChange={() => togglePermission('canViewMonthlyProfit')} 
                  />
                </View>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Manage Animals</Text>
                  <Switch
                    value={tempPermissions.canManageAnimals}
                    onValueChange={() => togglePermission('canManageAnimals')}
                  />
                </View>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Manage Collections</Text>
                  <Switch
                    value={tempPermissions.canManageCollections}
                    onValueChange={() => togglePermission('canManageCollections')}
                  />
                </View>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Manage Users</Text>
                  <Switch
                    value={tempPermissions.canManageUsers}
                    onValueChange={() => togglePermission('canManageUsers')}
                  />
                </View>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Admin</Text>
                  <Switch
                    value={tempPermissions.isAdmin}
                    onValueChange={() => togglePermission('isAdmin')}
                  />
                </View>
              </ScrollView>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelButton}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={savePermissions} style={styles.saveButton}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: 'row', justifyContent: 'flex-start',
    alignItems: 'center', padding: 16, backgroundColor: Colors.light.primary,
    marginTop: 50,
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  backButton: { color: '#fff', fontSize: 16 },
  content: { flex: 1, padding: 16 },
  userCard: {
    backgroundColor: '#fff', borderRadius: 8, padding: 16,
    marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  userInfo: { marginBottom: 12 },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  userEmail: { fontSize: 14, color: '#666', marginTop: 4 },
  permissionButton: {
    backgroundColor: Colors.light.primary, paddingVertical: 8, paddingHorizontal: 16,
    borderRadius: 8, alignSelf: 'flex-start',
  },
  permissionButtonText: { color: '#fff', fontSize: 14 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center',
  },
  modalContent: {
    width: '90%', backgroundColor: '#fff', borderRadius: 12, padding: 20,
    maxHeight: '80%',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12,
  },
  switchLabel: { fontSize: 16, color: '#333' },
  modalButtons: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#ccc', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8,
  },
  saveButton: {
    backgroundColor: Colors.light.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});
