import { OptimizedList } from '@/src/components/optimized-list';
import { Badge } from '@/src/components/ui';
import { useAuthStore } from '@/src/store/auth-store';
import { useReportStore } from '@/src/store/report-store';
import { Report, ReportType } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type FilterType = 'all' | 'pending' | 'approved' | 'rejected';

const REPORT_TYPE_CONFIG: Record<ReportType, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  daily: { icon: 'today', color: '#007AFF' },
  incident: { icon: 'warning', color: '#FF9500' },
  inspection: { icon: 'search', color: '#34C759' },
  client_visit: { icon: 'location', color: '#5856D6' },
  custom: { icon: 'document-text', color: '#8E8E93' },
};

export default function ReportsTab() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { reports, isLoading, fetchReports } = useReportStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const isSupervisorOrAdmin = user?.role === 'supervisor' || user?.role === 'admin';

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  }, []);

  const filteredReports = useMemo(() => {
    let result = reports;
    
    // Apply status filter
    if (filter !== 'all') {
      result = result.filter(report => report.status === filter);
    }
    
    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(report => 
        report.title.toLowerCase().includes(query) ||
        report.description?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [reports, filter, searchQuery]);

  const handleCreateReport = () => {
    router.push('/reports/new');
  };

  const renderReport = useCallback((item: Report) => {
    const config = REPORT_TYPE_CONFIG[item.type];
    
    return (
      <TouchableOpacity
        style={styles.reportCard}
        onPress={() => {
          // Navigate to report detail
          // router.push(`/reports/${item.id}`);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.reportHeader}>
          <View style={[styles.reportIcon, { backgroundColor: `${config.color}15` }]}>
            <Ionicons name={config.icon} size={24} color={config.color} />
          </View>
          <View style={styles.reportInfo}>
            <Text style={styles.reportTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.reportMeta}>
              {format(new Date(item.createdAt), 'MMM d, yyyy h:mm a')}
            </Text>
          </View>
          <Badge 
            label={item.status} 
            variant={
              item.status === 'approved' ? 'success' : 
              item.status === 'rejected' ? 'danger' : 
              'warning'
            }
            size="small"
          />
        </View>
        
        {item.description && (
          <Text style={styles.reportDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        
        <View style={styles.reportFooter}>
          {item.photos && item.photos.length > 0 && (
            <View style={styles.reportAttachment}>
              <Ionicons name="images-outline" size={16} color="#8E8E93" />
              <Text style={styles.attachmentText}>{item.photos.length} photos</Text>
            </View>
          )}
          
          {item.location && (
            <View style={styles.reportAttachment}>
              <Ionicons name="location-outline" size={16} color="#8E8E93" />
              <Text style={styles.attachmentText}>Location attached</Text>
            </View>
          )}
          
          {!item.odSynced && (
            <View style={styles.syncPending}>
              <Ionicons name="cloud-upload-outline" size={16} color="#FF9500" />
              <Text style={styles.syncPendingText}>Pending sync</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search reports..."
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
        {(['all', 'pending', 'approved', 'rejected'] as FilterType[]).map(type => (
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

      {/* Reports List */}
      <OptimizedList
        data={filteredReports}
        renderItem={renderReport}
        keyExtractor={(item) => item.id}
        isRefreshing={refreshing}
        onRefresh={onRefresh}
        emptyMessage="No reports found"
        emptyTitle="No Reports"
        contentContainerStyle={styles.listContent}
      />

      {/* FAB for New Report */}
      <TouchableOpacity style={styles.fab} onPress={handleCreateReport}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
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
  reportCard: {
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
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportInfo: {
    flex: 1,
    marginLeft: 12,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  reportMeta: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  reportDescription: {
    fontSize: 14,
    color: '#6E6E73',
    marginTop: 12,
    lineHeight: 20,
  },
  reportFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    gap: 16,
  },
  reportAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  attachmentText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  syncPending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  syncPendingText: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '500',
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
