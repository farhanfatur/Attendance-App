import { OptimizedList } from '@/src/components/optimized-list';
import { Avatar } from '@/src/components/ui';
import { User } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mock team data - would come from API/store
const MOCK_TEAM: (User & { status: 'online' | 'offline'; lastLocation?: string; currentTask?: string })[] = [
  {
    id: '1',
    employeeId: 'EMP001',
    name: 'John Smith',
    email: 'john@company.com',
    phone: '+1234567890',
    role: 'field_officer',
    department: 'Sales',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    status: 'online',
    lastLocation: 'Downtown District',
    currentTask: 'Client Visit - ABC Corp',
  },
  {
    id: '2',
    employeeId: 'EMP002',
    name: 'Sarah Johnson',
    email: 'sarah@company.com',
    phone: '+1234567891',
    role: 'field_officer',
    department: 'Support',
    createdAt: '2024-01-02',
    updatedAt: '2024-01-02',
    status: 'online',
    lastLocation: 'North Zone',
    currentTask: 'Site Inspection',
  },
  {
    id: '3',
    employeeId: 'EMP003',
    name: 'Mike Wilson',
    email: 'mike@company.com',
    phone: '+1234567892',
    role: 'field_officer',
    department: 'Sales',
    createdAt: '2024-01-03',
    updatedAt: '2024-01-03',
    status: 'offline',
    lastLocation: 'South District',
  },
  {
    id: '4',
    employeeId: 'EMP004',
    name: 'Emily Brown',
    email: 'emily@company.com',
    phone: '+1234567893',
    role: 'field_officer',
    department: 'Operations',
    createdAt: '2024-01-04',
    updatedAt: '2024-01-04',
    status: 'online',
    lastLocation: 'Central Hub',
    currentTask: 'Equipment Maintenance',
  },
  {
    id: '5',
    employeeId: 'EMP005',
    name: 'David Lee',
    email: 'david@company.com',
    phone: '+1234567894',
    role: 'field_officer',
    department: 'Support',
    createdAt: '2024-01-05',
    updatedAt: '2024-01-05',
    status: 'offline',
    lastLocation: 'East Region',
  },
];

type FilterType = 'all' | 'online' | 'offline';

export default function TeamTab() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Fetch team data
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const filteredTeam = useMemo(() => {
    let result = MOCK_TEAM;
    
    // Apply status filter
    if (filter !== 'all') {
      result = result.filter(member => member.status === filter);
    }
    
    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(member => 
        member.name.toLowerCase().includes(query) ||
        member.employeeId.toLowerCase().includes(query) ||
        member.department.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [filter, searchQuery]);

  const onlineCount = MOCK_TEAM.filter(m => m.status === 'online').length;
  const offlineCount = MOCK_TEAM.filter(m => m.status === 'offline').length;

  const renderMember = useCallback((item: typeof MOCK_TEAM[0]) => (
    <TouchableOpacity
      style={styles.memberCard}
      onPress={() => {
        // Navigate to officer detail
        // router.push(`/team/${item.id}`);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.memberHeader}>
        <Avatar name={item.name} size={48} showStatus status={item.status} />
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.name}</Text>
          <Text style={styles.memberId}>{item.employeeId} • {item.department}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
      </View>
      
      {item.lastLocation && (
        <View style={styles.memberDetail}>
          <Ionicons name="location-outline" size={16} color="#8E8E93" />
          <Text style={styles.memberDetailText}>{item.lastLocation}</Text>
        </View>
      )}
      
      {item.currentTask && (
        <View style={styles.memberDetail}>
          <Ionicons name="briefcase-outline" size={16} color="#007AFF" />
          <Text style={[styles.memberDetailText, { color: '#007AFF' }]}>
            {item.currentTask}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  ), []);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{MOCK_TEAM.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#34C759' }]}>{onlineCount}</Text>
          <Text style={styles.statLabel}>Online</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#8E8E93' }]}>{offlineCount}</Text>
          <Text style={styles.statLabel}>Offline</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search team members..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {(['all', 'online', 'offline'] as FilterType[]).map(type => (
          <TouchableOpacity
            key={type}
            style={[styles.filterTab, filter === type && styles.filterTabActive]}
            onPress={() => setFilter(type)}
          >
            <Text style={[
              styles.filterTabText,
              filter === type && styles.filterTabTextActive
            ]}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Team List */}
      <OptimizedList
        data={filteredTeam}
        renderItem={renderMember}
        keyExtractor={(item) => item.id}
        isRefreshing={refreshing}
        onRefresh={onRefresh}
        emptyMessage="No team members found"
        emptyTitle="No Members"
        contentContainerStyle={styles.listContent}
      />

      {/* FAB for Map View */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          // Navigate to live map
          // router.push('/team/map');
        }}
      >
        <Ionicons name="map" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 4,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  filterTabActive: {
    backgroundColor: '#007AFF',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
  },
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  memberId: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  memberDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    gap: 8,
  },
  memberDetailText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});
