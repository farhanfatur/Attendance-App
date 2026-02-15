// Live Map Screen - Real-time officer tracking for supervisors

import { RoleGate } from '@/src/components/role-gate';
import { LiveMap } from '@/src/features/map/components/live-map';
import { GeoFence, GeoLocation, User } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface OfficerLocation {
  user: User;
  location: GeoLocation;
  status: 'online' | 'offline';
  lastUpdated: string;
  currentTask?: string;
}

// Mock geofences - replace with actual data
const mockGeoFences: GeoFence[] = [
  {
    id: '1',
    name: 'Main Office',
    latitude: 37.7749,
    longitude: -122.4194,
    radius: 200,
    type: 'office',
    isActive: true,
  },
  {
    id: '2',
    name: 'Client Site A',
    latitude: 37.7849,
    longitude: -122.4094,
    radius: 150,
    type: 'client',
    isActive: true,
  },
  {
    id: '3',
    name: 'Client Site B',
    latitude: 37.7649,
    longitude: -122.4294,
    radius: 100,
    type: 'client',
    isActive: true,
  },
];

type ViewMode = 'all' | 'online' | 'offline';

export default function MapScreen() {
  const { officerId } = useLocalSearchParams<{ officerId?: string }>();
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [showGeoFences, setShowGeoFences] = useState(true);
  const [selectedOfficerId, setSelectedOfficerId] = useState<string | undefined>(
    officerId
  );

  const handleOfficerSelect = useCallback((officer: OfficerLocation) => {
    setSelectedOfficerId(officer.user.id);
  }, []);

  const handleRefresh = useCallback(() => {
    // Trigger location refresh
  }, []);

  return (
    <RoleGate roles={['admin', 'supervisor']}>
      <SafeAreaView style={styles.container}>
        {/* Map Controls */}
        <View style={styles.controls}>
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                viewMode === 'all' && styles.filterButtonActive,
              ]}
              onPress={() => setViewMode('all')}
            >
              <Text
                style={[
                  styles.filterText,
                  viewMode === 'all' && styles.filterTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                viewMode === 'online' && styles.filterButtonActive,
              ]}
              onPress={() => setViewMode('online')}
            >
              <View style={styles.filterContent}>
                <View style={[styles.statusDot, styles.onlineDot]} />
                <Text
                  style={[
                    styles.filterText,
                    viewMode === 'online' && styles.filterTextActive,
                  ]}
                >
                  Online
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                viewMode === 'offline' && styles.filterButtonActive,
              ]}
              onPress={() => setViewMode('offline')}
            >
              <View style={styles.filterContent}>
                <View style={[styles.statusDot, styles.offlineDot]} />
                <Text
                  style={[
                    styles.filterText,
                    viewMode === 'offline' && styles.filterTextActive,
                  ]}
                >
                  Offline
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                showGeoFences && styles.actionButtonActive,
              ]}
              onPress={() => setShowGeoFences(!showGeoFences)}
            >
              <Ionicons
                name="locate-outline"
                size={18}
                color={showGeoFences ? '#FFFFFF' : '#007AFF'}
              />
              <Text
                style={[
                  styles.actionText,
                  showGeoFences && styles.actionTextActive,
                ]}
              >
                Geo-Fences
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
              <Ionicons name="refresh-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          <LiveMap
            geoFences={showGeoFences ? mockGeoFences : []}
            onOfficerSelect={handleOfficerSelect}
          />
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Legend</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#34C759' }]} />
              <Text style={styles.legendText}>Online</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF9500' }]} />
              <Text style={styles.legendText}>Idle</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#8E8E93' }]} />
              <Text style={styles.legendText}>Offline</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendCircle, { borderColor: '#007AFF' }]} />
              <Text style={styles.legendText}>Office</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendCircle, { borderColor: '#FF9500' }]} />
              <Text style={styles.legendText}>Client</Text>
            </View>
          </View>
        </View>

        {/* Selected Officer Info */}
        {selectedOfficerId && (
          <View style={styles.selectedInfo}>
            <View style={styles.selectedHeader}>
              <Text style={styles.selectedTitle}>Selected Officer</Text>
              <TouchableOpacity onPress={() => setSelectedOfficerId(undefined)}>
                <Ionicons name="close" size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            <Text style={styles.selectedName}>Officer #{selectedOfficerId}</Text>
            <Text style={styles.selectedDetail}>Tap on marker for details</Text>
          </View>
        )}
      </SafeAreaView>
    </RoleGate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  controls: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterText: {
    fontSize: 14,
    color: '#3C3C43',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  onlineDot: {
    backgroundColor: '#34C759',
  },
  offlineDot: {
    backgroundColor: '#8E8E93',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    gap: 6,
  },
  actionButtonActive: {
    backgroundColor: '#007AFF',
  },
  actionText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  actionTextActive: {
    color: '#FFFFFF',
  },
  refreshButton: {
    padding: 8,
  },
  mapContainer: {
    flex: 1,
  },
  legend: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  legendText: {
    fontSize: 12,
    color: '#3C3C43',
  },
  selectedInfo: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  selectedTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  selectedName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  selectedDetail: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
});
