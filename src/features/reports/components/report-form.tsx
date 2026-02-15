// Report Form Component with Photo Upload

import { Button, Card } from '@/src/components/ui';
import { locationService } from '@/src/services/location/location-service';
import { useReportStore } from '@/src/store/report-store';
import { GeoLocation, Report, ReportPhoto, ReportType } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { v4 as uuidv4 } from 'uuid';

const reportTypes: { type: ReportType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { type: 'daily', label: 'Daily Report', icon: 'today-outline' },
  { type: 'incident', label: 'Incident Report', icon: 'warning-outline' },
  { type: 'inspection', label: 'Inspection', icon: 'clipboard-outline' },
  { type: 'client_visit', label: 'Client Visit', icon: 'business-outline' },
  { type: 'custom', label: 'Custom Report', icon: 'document-text-outline' },
];

interface ReportFormProps {
  existingReport?: Report;
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
}

export function ReportForm({ existingReport, onSubmitSuccess, onCancel }: ReportFormProps) {
  const {
    currentReport,
    isSubmitting,
    createReport,
    updateReport,
    submitReport,
    addPhoto,
    removePhoto,
    setCurrentReport,
  } = useReportStore();

  const [selectedType, setSelectedType] = useState<ReportType>(
    existingReport?.type || 'daily'
  );
  const [title, setTitle] = useState(existingReport?.title || '');
  const [description, setDescription] = useState(existingReport?.description || '');
  const [photos, setPhotos] = useState<ReportPhoto[]>(existingReport?.photos || []);
  const [location, setLocation] = useState<GeoLocation | null>(
    existingReport?.location || null
  );
  const [address, setAddress] = useState(existingReport?.address || '');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  useEffect(() => {
    if (existingReport) {
      setCurrentReport(existingReport);
    }
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const loc = await locationService.getCurrentLocation();
      if (loc) {
        setLocation(loc);
        const addr = await locationService.getAddressFromCoordinates(
          loc.latitude,
          loc.longitude
        );
        if (addr) {
          setAddress(addr);
        }
      }
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Camera permission is required to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      const newPhoto: ReportPhoto = {
        id: uuidv4(),
        uri: result.assets[0].uri,
        localUri: result.assets[0].uri,
        location: location || undefined,
        timestamp: new Date().toISOString(),
        isSynced: false,
      };
      setPhotos([...photos, newPhoto]);
    }
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Media library permission is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 5,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newPhotos: ReportPhoto[] = result.assets.map(asset => ({
        id: uuidv4(),
        uri: asset.uri,
        localUri: asset.uri,
        timestamp: new Date().toISOString(),
        isSynced: false,
      }));
      setPhotos([...photos, ...newPhotos]);
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    setPhotos(photos.filter(p => p.id !== photoId));
  };

  const handleSaveDraft = async () => {
    try {
      if (!existingReport) {
        const report = await createReport(selectedType, title || 'Untitled Report');
        await updateReport(report.odId, {
          description,
          photos,
          location: location || undefined,
          address,
        });
      } else {
        await updateReport(existingReport.odId || existingReport.id, {
          type: selectedType,
          title,
          description,
          photos,
          location: location || undefined,
          address,
        });
      }
      Alert.alert('Success', 'Report saved as draft');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save draft');
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a report title');
      return;
    }

    Alert.alert(
      'Submit Report',
      'Are you sure you want to submit this report? You cannot edit it after submission.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            try {
              let reportId: string;
              
              if (!existingReport && !currentReport) {
                const report = await createReport(selectedType, title);
                await updateReport(report.odId, {
                  description,
                  photos,
                  location: location || undefined,
                  address,
                });
                reportId = report.odId;
              } else {
                reportId = existingReport?.odId || existingReport?.id || currentReport!.odId;
                await updateReport(reportId, {
                  type: selectedType,
                  title,
                  description,
                  photos,
                  location: location || undefined,
                  address,
                });
              }

              await submitReport(reportId);
              Alert.alert('Success', 'Report submitted successfully!');
              onSubmitSuccess?.();
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to submit report');
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Report Type Selection */}
        <Card style={styles.card} title="Report Type">
          <View style={styles.typeGrid}>
            {reportTypes.map(({ type, label, icon }) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeItem,
                  selectedType === type && styles.typeItemSelected,
                ]}
                onPress={() => setSelectedType(type)}
              >
                <Ionicons
                  name={icon}
                  size={24}
                  color={selectedType === type ? '#007AFF' : '#8E8E93'}
                />
                <Text
                  style={[
                    styles.typeLabel,
                    selectedType === type && styles.typeLabelSelected,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Title & Description */}
        <Card style={styles.card} title="Details">
          <TextInput
            style={styles.titleInput}
            placeholder="Report Title *"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#8E8E93"
          />
          <TextInput
            style={styles.descriptionInput}
            placeholder="Description (optional)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColor="#8E8E93"
          />
        </Card>

        {/* Location */}
        <Card style={styles.card} title="Location">
          <View style={styles.locationContainer}>
            <Ionicons
              name={location ? 'location' : 'location-outline'}
              size={20}
              color={location ? '#34C759' : '#8E8E93'}
            />
            <Text style={styles.locationText}>
              {isLoadingLocation
                ? 'Getting location...'
                : address || 'Location not available'}
            </Text>
            <TouchableOpacity onPress={getCurrentLocation}>
              <Ionicons name="refresh-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Photos */}
        <Card style={styles.card} title="Photos">
          <View style={styles.photoActions}>
            <TouchableOpacity style={styles.photoAction} onPress={handleTakePhoto}>
              <Ionicons name="camera-outline" size={24} color="#007AFF" />
              <Text style={styles.photoActionText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoAction} onPress={handlePickImage}>
              <Ionicons name="images-outline" size={24} color="#007AFF" />
              <Text style={styles.photoActionText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>

          {photos.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.photoList}
            >
              {photos.map((photo) => (
                <View key={photo.id} style={styles.photoItem}>
                  <Image source={{ uri: photo.localUri || photo.uri }} style={styles.photoImage} />
                  <TouchableOpacity
                    style={styles.photoRemove}
                    onPress={() => handleRemovePhoto(photo.id)}
                  >
                    <Ionicons name="close-circle" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                  {photo.caption && (
                    <Text style={styles.photoCaption} numberOfLines={1}>
                      {photo.caption}
                    </Text>
                  )}
                </View>
              ))}
            </ScrollView>
          )}

          {photos.length === 0 && (
            <View style={styles.noPhotos}>
              <Ionicons name="image-outline" size={48} color="#C7C7CC" />
              <Text style={styles.noPhotosText}>No photos added</Text>
            </View>
          )}
        </Card>

        {/* Spacer for bottom actions */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <Button
          title="Save Draft"
          onPress={handleSaveDraft}
          variant="outline"
          style={{ flex: 1, marginRight: 8 }}
        />
        <Button
          title="Submit"
          onPress={handleSubmit}
          loading={isSubmitting}
          icon="send-outline"
          style={{ flex: 2 }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginBottom: 0,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  typeItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeItemSelected: {
    backgroundColor: '#E5F0FF',
    borderColor: '#007AFF',
  },
  typeLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666666',
  },
  typeLabelSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    marginBottom: 12,
  },
  descriptionInput: {
    fontSize: 16,
    color: '#1A1A1A',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    minHeight: 100,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
  },
  locationText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#666666',
  },
  photoActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  photoAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
  },
  photoActionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  photoList: {
    marginTop: 8,
  },
  photoItem: {
    marginRight: 12,
    position: 'relative',
  },
  photoImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: '#E5E5EA',
  },
  photoRemove: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  photoCaption: {
    marginTop: 4,
    fontSize: 12,
    color: '#8E8E93',
    width: 100,
  },
  noPhotos: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noPhotosText: {
    marginTop: 8,
    fontSize: 14,
    color: '#8E8E93',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
});

export default ReportForm;
