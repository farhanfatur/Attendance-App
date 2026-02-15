// Live Map Component - Real-time officer tracking with markers
// Includes fallback for when native maps aren't available (e.g., Expo Go)

import { Avatar, Badge, Card } from '@/src/components/ui';
import { GeoFence, GeoLocation, User } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.02;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

// Try to import react-native-maps, but handle the case where it's not available
let MapView: any = null;
let Marker: any = null;
let Circle: any = null;
let PROVIDER_DEFAULT: any = null;
let mapsAvailable = false;

try {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  Circle = Maps.Circle;
  PROVIDER_DEFAULT = Maps.PROVIDER_DEFAULT;
  mapsAvailable = true;
} catch (e) {
  // Maps not available - will use fallback
  console.log('react-native-maps not available, using fallback UI');
}

interface OfficerLocation {
  user: User;
  location: GeoLocation;
  status: 'online' | 'offline';
  lastUpdated: string;
  currentTask?: string;
}

interface LiveMapProps {
  officers?: OfficerLocation[];
  geoFences?: GeoFence[];
  currentLocation?: GeoLocation | null;
  onOfficerSelect?: (officer: OfficerLocation) => void;
  onGeoFenceSelect?: (geoFence: GeoFence) => void;
  showCurrentLocation?: boolean;
  style?: any;
}

// Fallback component when maps aren't available
function MapFallback({
  officers = [],
  geoFences = [],
  currentLocation,
  onOfficerSelect,
}: LiveMapProps) {
  const [selectedOfficer, setSelectedOfficer] = useState<OfficerLocation | null>(null);

  const handleOfficerPress = (officer: OfficerLocation) => {
    setSelectedOfficer(officer);
    onOfficerSelect?.(officer);
  };

  const onlineOfficers = officers.filter(o => o.status === 'online');
  const offlineOfficers = officers.filter(o => o.status === 'offline');

  return (
    <View style={fallbackStyles.container}>
      {/* Header */}
      <View style={fallbackStyles.header}>
        <Ionicons name="map-outline" size={24} color="#8E8E93" />
        <Text style={fallbackStyles.headerTitle}>Live Map</Text>
        <Text style={fallbackStyles.headerSubtitle}>
          Native maps require a development build
        </Text>
      </View>

      {/* Current Location */}
      {currentLocation && (
        <Card style={fallbackStyles.locationCard}>
          <View style={fallbackStyles.locationHeader}>
            <Ionicons name="navigate" size={20} color="#007AFF" />
            <Text style={fallbackStyles.locationTitle}>Your Location</Text>
          </View>
          <Text style={fallbackStyles.coordinates}>
            {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
          </Text>
          {currentLocation.accuracy && (
            <Text style={fallbackStyles.accuracy}>
              Accuracy: ±{currentLocation.accuracy.toFixed(0)}m
            </Text>
          )}
        </Card>
      )}

      {/* Stats */}
      <View style={fallbackStyles.stats}>
        <View style={fallbackStyles.statItem}>
          <Text style={fallbackStyles.statValue}>{officers.length}</Text>
          <Text style={fallbackStyles.statLabel}>Total Officers</Text>
        </View>
        <View style={fallbackStyles.statItem}>
          <Text style={[fallbackStyles.statValue, { color: '#34C759' }]}>
            {onlineOfficers.length}
          </Text>
          <Text style={fallbackStyles.statLabel}>Online</Text>
        </View>
        <View style={fallbackStyles.statItem}>
          <Text style={[fallbackStyles.statValue, { color: '#8E8E93' }]}>
            {offlineOfficers.length}
          </Text>
          <Text style={fallbackStyles.statLabel}>Offline</Text>
        </View>
        <View style={fallbackStyles.statItem}>
          <Text style={[fallbackStyles.statValue, { color: '#007AFF' }]}>
            {geoFences.length}
          </Text>
          <Text style={fallbackStyles.statLabel}>Geo-Fences</Text>
        </View>
      </View>

      {/* Officers List */}
      <ScrollView style={fallbackStyles.officersList}>
        {onlineOfficers.length > 0 && (
          <>
            <Text style={fallbackStyles.sectionTitle}>Online Officers</Text>
            {onlineOfficers.map(officer => (
              <TouchableOpacity
                key={officer.user.id}
                style={fallbackStyles.officerItem}
                onPress={() => handleOfficerPress(officer)}
              >
                <View style={[fallbackStyles.statusDot, { backgroundColor: '#34C759' }]} />
                <Avatar name={officer.user.name} size={40} />
                <View style={fallbackStyles.officerInfo}>
                  <Text style={fallbackStyles.officerName}>{officer.user.name}</Text>
                  <Text style={fallbackStyles.officerMeta}>
                    {officer.location.latitude.toFixed(4)}, {officer.location.longitude.toFixed(4)}
                  </Text>
                </View>
                {officer.currentTask && (
                  <Badge label="On Task" variant="info" size="small" />
                )}
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
              </TouchableOpacity>
            ))}
          </>
        )}

        {offlineOfficers.length > 0 && (
          <>
            <Text style={fallbackStyles.sectionTitle}>Offline Officers</Text>
            {offlineOfficers.map(officer => (
              <TouchableOpacity
                key={officer.user.id}
                style={fallbackStyles.officerItem}
                onPress={() => handleOfficerPress(officer)}
              >
                <View style={[fallbackStyles.statusDot, { backgroundColor: '#8E8E93' }]} />
                <Avatar name={officer.user.name} size={40} />
                <View style={fallbackStyles.officerInfo}>
                  <Text style={fallbackStyles.officerName}>{officer.user.name}</Text>
                  <Text style={fallbackStyles.officerMeta}>
                    Last seen: {new Date(officer.lastUpdated).toLocaleTimeString()}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
              </TouchableOpacity>
            ))}
          </>
        )}

        {officers.length === 0 && (
          <View style={fallbackStyles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#C7C7CC" />
            <Text style={fallbackStyles.emptyText}>No officers to display</Text>
          </View>
        )}
      </ScrollView>

      {/* Selected Officer Detail */}
      {selectedOfficer && (
        <Card style={fallbackStyles.selectedCard}>
          <TouchableOpacity
            style={fallbackStyles.closeButton}
            onPress={() => setSelectedOfficer(null)}
          >
            <Ionicons name="close" size={20} color="#8E8E93" />
          </TouchableOpacity>

          <View style={fallbackStyles.selectedHeader}>
            <Avatar name={selectedOfficer.user.name} size={56} />
            <View style={fallbackStyles.selectedInfo}>
              <Text style={fallbackStyles.selectedName}>{selectedOfficer.user.name}</Text>
              <Text style={fallbackStyles.selectedMeta}>
                {selectedOfficer.user.employeeId} • {selectedOfficer.user.department}
              </Text>
              <Badge
                label={selectedOfficer.status}
                variant={selectedOfficer.status === 'online' ? 'success' : 'default'}
                size="small"
              />
            </View>
          </View>

          <View style={fallbackStyles.selectedDetails}>
            <View style={fallbackStyles.detailRow}>
              <Ionicons name="location-outline" size={18} color="#8E8E93" />
              <Text style={fallbackStyles.detailText}>
                {selectedOfficer.location.latitude.toFixed(6)}, {selectedOfficer.location.longitude.toFixed(6)}
              </Text>
            </View>
            {selectedOfficer.currentTask && (
              <View style={fallbackStyles.detailRow}>
                <Ionicons name="briefcase-outline" size={18} color="#007AFF" />
                <Text style={[fallbackStyles.detailText, { color: '#007AFF' }]}>
                  {selectedOfficer.currentTask}
                </Text>
              </View>
            )}
            <View style={fallbackStyles.detailRow}>
              <Ionicons name="time-outline" size={18} color="#8E8E93" />
              <Text style={fallbackStyles.detailText}>
                Updated: {new Date(selectedOfficer.lastUpdated).toLocaleString()}
              </Text>
            </View>
          </View>
        </Card>
      )}
    </View>
  );
}

// Main export - uses fallback since native maps require dev build
export function LiveMap(props: LiveMapProps) {
  // Always use fallback for now - native maps require development build
  // To enable native maps, create a development build with: npx expo run:ios or npx expo run:android
  return <MapFallback {...props} />;
}

const fallbackStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
  locationCard: {
    margin: 16,
    padding: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  locationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  coordinates: {
    fontSize: 14,
    color: '#3C3C43',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  accuracy: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  stats: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    marginTop: 1,
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
  officersList: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 16,
  },
  officerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  officerInfo: {
    flex: 1,
  },
  officerName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  officerMeta: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 12,
  },
  selectedCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
    zIndex: 1,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedInfo: {
    flex: 1,
  },
  selectedName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  selectedMeta: {
    fontSize: 13,
    color: '#8E8E93',
    marginVertical: 4,
  },
  selectedDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#3C3C43',
  },
});

export default LiveMap;
