import { uploadEnrollmentPhotos } from '@/api/hub';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { findProfileById } from '@/stores/profilesStore';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type EnrollmentPhoto = {
  id: string;
  uri: string;
  fileName?: string;
  mimeType?: string;
};

export default function EnrollmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = id ? findProfileById(id) : undefined;
  const [photos, setPhotos] = useState<EnrollmentPhoto[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isPicking, setIsPicking] = useState(false);

  const appendAssets = (assets: ImagePicker.ImagePickerAsset[]) => {
    const newPhotos = assets.map(asset => ({
      id: asset.assetId ?? `${asset.uri}-${Date.now()}`,
      uri: asset.uri,
      fileName: asset.fileName ?? undefined,
      mimeType: asset.mimeType ?? undefined,
    }));
    setPhotos(prev => [...prev, ...newPhotos]);
  };

  const handleAddFromLibrary = async () => {
    setIsPicking(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow photo library access.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });
      if (!result.canceled) {
        appendAssets(result.assets);
      }
    } catch {
      Alert.alert('Error', 'Unable to select photos.');
    } finally {
      setIsPicking(false);
    }
  };

  const handleTakePhoto = async () => {
    setIsPicking(true);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow camera access.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (!result.canceled) {
        appendAssets(result.assets);
      }
    } catch {
      Alert.alert('Error', 'Unable to capture photo.');
    } finally {
      setIsPicking(false);
    }
  };

  const handleUpload = async () => {
    if (photos.length === 0 || !profile) {
      Alert.alert('No photos', 'Add photos before uploading.');
      return;
    }
    setIsUploading(true);
    try {
      await uploadEnrollmentPhotos(profile.id, photos);
      Alert.alert('Uploaded', 'Enrollment photos uploaded successfully.');
      setPhotos([]);
    } catch {
      Alert.alert('Upload failed', 'Unable to upload photos to the hub.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Profile not found</Text>
          <Button title="Back" onPress={() => router.back()} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Enrollment</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content}>

        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <Avatar name={profile.displayName} size={64} />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile.displayName}</Text>
              <Text style={styles.profileMeta}>Confidence: {profile.confidenceThreshold}</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.instructionsCard}>
          <Text style={styles.sectionTitle}>Photo Guidelines</Text>
          <Text style={styles.instructionsText}>
            Capture 6-12 photos with different angles, lighting, and expressions. Keep the
            face centered and avoid heavy shadows.
          </Text>
        </Card>

        <Card style={styles.photosCard}>
          <Text style={styles.sectionTitle}>Selected Photos</Text>
          {photos.length === 0 ? (
            <Text style={styles.emptyText}>No photos selected yet</Text>
          ) : (
            <View style={styles.photoGrid}>
              {photos.map(photo => (
                <View key={photo.id} style={styles.photoTile}>
                  <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                </View>
              ))}
            </View>
          )}
        </Card>

        <View style={styles.photoActions}>
          <Button
            title="From Library"
            onPress={handleAddFromLibrary}
            variant="outline"
            disabled={isPicking}
            style={styles.photoActionButton}
          />
          <Button
            title="Take Photo"
            onPress={handleTakePhoto}
            variant="outline"
            disabled={isPicking}
            style={styles.photoActionButton}
          />
        </View>

        <Button
          title="Upload to Train Model"
          onPress={handleUpload}
          disabled={photos.length === 0}
          loading={isUploading}
          style={styles.uploadButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    paddingVertical: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
  },
  content: {
    padding: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  profileCard: {
    marginBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textDark,
  },
  profileMeta: {
    fontSize: 13,
    color: Colors.textGray,
    marginTop: 4,
  },
  instructionsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: Colors.textDark,
  },
  photosCard: {
    marginBottom: 16,
    gap: 8,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoTile: {
    width: 96,
    height: 96,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceDark,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  emptyText: {
    color: Colors.textGray,
    marginBottom: 8,
  },
  photoActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  photoActionButton: {
    flex: 1,
  },
  uploadButton: {
    marginTop: 0,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
});
