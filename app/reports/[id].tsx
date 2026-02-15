// Report Detail Screen

import { Badge, Button, Card } from '@/src/components/ui';
import { useAuthStore } from '@/src/store/auth-store';
import { Report, ReportPhoto, ReportStatus } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = (width - 48 - 8) / 2;

// Mock photos
const mockPhotos: ReportPhoto[] = [
  {
    id: '1',
    uri: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400',
    timestamp: new Date().toISOString(),
    isSynced: true,
  },
  {
    id: '2',
    uri: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400',
    timestamp: new Date().toISOString(),
    isSynced: true,
  },
  {
    id: '3',
    uri: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400',
    timestamp: new Date().toISOString(),
    isSynced: true,
  },
];

// Mock report - replace with actual API call
const mockReport: Report = {
  id: '1',
  odId: 'od1',
  odSynced: true,
  userId: '1',
  title: 'Site Inspection Report - Downtown Construction',
  description:
    'Conducted full site inspection including safety compliance check, progress assessment, and equipment verification. All areas were thoroughly inspected with findings documented below.',
  type: 'inspection',
  status: 'submitted',
  location: {
    latitude: 37.7749,
    longitude: -122.4194,
    accuracy: 10,
    timestamp: Date.now(),
  },
  photos: mockPhotos,
  taskId: 'task1',
  formData: {
    inspectionType: 'Safety Compliance',
    findings: 'All areas meet safety standards',
    recommendations: 'Continue regular inspections',
  },
  submittedAt: new Date().toISOString(),
  createdAt: new Date(Date.now() - 3600000).toISOString(),
  updatedAt: new Date().toISOString(),
};

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [report, setReport] = useState<Report | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const isSupervisor = user?.role === 'supervisor' || user?.role === 'admin';

  useEffect(() => {
    loadReport();
  }, [id]);

  const loadReport = async () => {
    // In production, fetch from API
    setReport(mockReport);
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadReport();
    setIsRefreshing(false);
  };

  const handleApprove = async () => {
    Alert.alert('Approve Report', 'Are you sure you want to approve this report?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          setIsUpdating(true);
          try {
            // In production, call API
            await new Promise(resolve => setTimeout(resolve, 1000));
            setReport(prev => (prev ? { ...prev, status: 'approved' } : null));
            Alert.alert('Success', 'Report has been approved');
          } catch (error) {
            Alert.alert('Error', 'Failed to approve report');
          } finally {
            setIsUpdating(false);
          }
        },
      },
    ]);
  };

  const handleReject = async () => {
    Alert.prompt(
      'Reject Report',
      'Please provide a reason for rejection:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async (reason: string | undefined) => {
            if (!reason?.trim()) {
              Alert.alert('Error', 'Please provide a reason');
              return;
            }
            setIsUpdating(true);
            try {
              // In production, call API with reason
              await new Promise(resolve => setTimeout(resolve, 1000));
              setReport(prev => (prev ? { ...prev, status: 'rejected' } : null));
              Alert.alert('Success', 'Report has been rejected');
            } catch (error) {
              Alert.alert('Error', 'Failed to reject report');
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleEdit = () => {
    // For now, navigate to new report (edit functionality can be added later)
    router.push('/reports/new');
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Report',
      'Are you sure you want to delete this report? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // In production, call API
              await new Promise(resolve => setTimeout(resolve, 500));
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete report');
            }
          },
        },
      ]
    );
  };

  const getStatusBadge = (status: ReportStatus) => {
    const variants: Record<ReportStatus, 'default' | 'warning' | 'success' | 'danger'> = {
      draft: 'default',
      submitted: 'warning',
      reviewed: 'warning',
      approved: 'success',
      rejected: 'danger',
    };
    const labels: Record<ReportStatus, string> = {
      draft: 'Draft',
      submitted: 'Pending Review',
      reviewed: 'Reviewed',
      approved: 'Approved',
      rejected: 'Rejected',
    };
    return <Badge label={labels[status]} variant={variants[status]} />;
  };

  const getTypeIcon = (type: Report['type']) => {
    const icons: Record<Report['type'], string> = {
      inspection: 'eye-outline',
      incident: 'warning-outline',
      daily: 'today-outline',
      client_visit: 'people-outline',
      custom: 'document-outline',
    };
    return icons[type] || 'document-outline';
  };

  if (!report) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const canEdit = report.status === 'draft' && report.userId === user?.id;
  const canReview = isSupervisor && report.status === 'submitted';

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.typeContainer}>
              <Ionicons
                name={getTypeIcon(report.type) as any}
                size={20}
                color="#007AFF"
              />
              <Text style={styles.typeText}>
                {report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report
              </Text>
            </View>
            {getStatusBadge(report.status)}
          </View>

          <Text style={styles.title}>{report.title}</Text>

          <View style={styles.metadata}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color="#8E8E93" />
              <Text style={styles.metaText}>
                {format(parseISO(report.createdAt), 'MMM d, yyyy h:mm a')}
              </Text>
            </View>
            {report.submittedAt && (
              <View style={styles.metaItem}>
                <Ionicons name="send-outline" size={14} color="#8E8E93" />
                <Text style={styles.metaText}>
                  Submitted {format(parseISO(report.submittedAt), 'MMM d, h:mm a')}
                </Text>
              </View>
            )}
          </View>

          {!report.odSynced && (
            <View style={styles.syncWarning}>
              <Ionicons name="cloud-offline-outline" size={16} color="#FF9500" />
              <Text style={styles.syncWarningText}>Pending sync</Text>
            </View>
          )}
        </Card>

        {/* Description */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{report.description}</Text>
        </Card>

        {/* Photos */}
        {report.photos && report.photos.length > 0 && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>
              Photos ({report.photos.length})
            </Text>
            <View style={styles.photosGrid}>
              {report.photos.map((photo, index) => (
                <TouchableOpacity
                  key={photo.id}
                  style={styles.photoContainer}
                  onPress={() => setSelectedImageIndex(index)}
                >
                  <Image source={{ uri: photo.uri }} style={styles.photo} />
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}

        {/* Location */}
        {report.location && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.locationInfo}>
              <Ionicons name="location" size={20} color="#007AFF" />
              <View style={styles.locationText}>
                <Text style={styles.locationCoords}>
                  {report.location.latitude.toFixed(6)},{' '}
                  {report.location.longitude.toFixed(6)}
                </Text>
                {report.location.accuracy && (
                  <Text style={styles.locationAccuracy}>
                    Accuracy: ±{report.location.accuracy.toFixed(0)}m
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.mapButton}
                onPress={() => {
                  // Open in maps app
                }}
              >
                <Ionicons name="map-outline" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Custom Fields / Form Data */}
        {report.formData && Object.keys(report.formData).length > 0 && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Additional Details</Text>
            {Object.entries(report.formData).map(([key, value]) => (
              <View key={key} style={styles.customField}>
                <Text style={styles.customFieldLabel}>
                  {key
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase())}
                </Text>
                <Text style={styles.customFieldValue}>{String(value)}</Text>
              </View>
            ))}
          </Card>
        )}

        {/* Task Link */}
        {report.taskId && (
          <Card style={styles.sectionCard}>
            <TouchableOpacity
              style={styles.taskLink}
              onPress={() => router.push(`/tasks/${report.taskId}`)}
            >
              <Ionicons name="clipboard-outline" size={20} color="#007AFF" />
              <Text style={styles.taskLinkText}>View Related Task</Text>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {canEdit && (
            <>
              <Button
                title="Edit Report"
                onPress={handleEdit}
                icon="create-outline"
                fullWidth
              />
              <View style={styles.actionSpacer} />
              <Button
                title="Delete Report"
                onPress={handleDelete}
                variant="danger"
                icon="trash-outline"
                fullWidth
              />
            </>
          )}

          {canReview && (
            <>
              <Button
                title="Approve Report"
                onPress={handleApprove}
                icon="checkmark-circle-outline"
                loading={isUpdating}
                fullWidth
              />
              <View style={styles.actionSpacer} />
              <Button
                title="Reject Report"
                onPress={handleReject}
                variant="danger"
                icon="close-circle-outline"
                loading={isUpdating}
                fullWidth
              />
            </>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Image Viewer Modal */}
      {selectedImageIndex !== null && report.photos && (
        <TouchableOpacity
          style={styles.imageViewerOverlay}
          activeOpacity={1}
          onPress={() => setSelectedImageIndex(null)}
        >
          <Image
            source={{ uri: report.photos[selectedImageIndex].uri }}
            style={styles.fullImage}
            resizeMode="contain"
          />
          <View style={styles.imageViewerControls}>
            <Text style={styles.imageCounter}>
              {selectedImageIndex + 1} / {report.photos.length}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedImageIndex(null)}
            >
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  headerCard: {
    padding: 16,
    marginBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 12,
    lineHeight: 26,
  },
  metadata: {
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  syncWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  syncWarningText: {
    fontSize: 13,
    color: '#FF9500',
    fontWeight: '500',
  },
  sectionCard: {
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 24,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  photo: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 8,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationText: {
    flex: 1,
  },
  locationCoords: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  locationAccuracy: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  mapButton: {
    padding: 8,
  },
  customField: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  customFieldLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 4,
  },
  customFieldValue: {
    fontSize: 15,
    color: '#1C1C1E',
  },
  taskLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskLinkText: {
    flex: 1,
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
  },
  actionsContainer: {
    marginTop: 8,
  },
  actionSpacer: {
    height: 12,
  },
  bottomPadding: {
    height: 40,
  },
  imageViewerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
  imageViewerControls: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  imageCounter: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  closeButton: {
    padding: 8,
  },
});
