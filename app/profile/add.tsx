import { createProfileWithEnrollment } from '@/api/hub';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dropdown } from '@/components/ui/dropdown';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Input } from '@/components/ui/input';
import { Colors } from '@/constants/theme';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type NewProfilePhoto = {
  uri: string;
  fileName?: string;
  mimeType?: string;
};

const PROFILE_STATUS_OPTIONS = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Blocked', value: 'BLOCKED' },
];

export default function AddProfileScreen() {
  const [profileName, setProfileName] = useState('');
  const [profileStatus, setProfileStatus] = useState('ACTIVE');
  const [photo, setPhoto] = useState<NewProfilePhoto | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

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
        allowsMultipleSelection: false,
        quality: 0.85,
      });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      setPhoto({
        uri: asset.uri,
        fileName: asset.fileName ?? undefined,
        mimeType: asset.mimeType ?? undefined,
      });
    } catch {
      Alert.alert('Error', 'Unable to select photo.');
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
        quality: 0.85,
      });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      setPhoto({
        uri: asset.uri,
        fileName: asset.fileName ?? undefined,
        mimeType: asset.mimeType ?? undefined,
      });
    } catch {
      Alert.alert('Error', 'Unable to capture photo.');
    } finally {
      setIsPicking(false);
    }
  };

  const handleCreateProfile = async () => {
    const trimmedName = profileName.trim();
    if (!trimmedName) {
      setErrorText('Profile name is required.');
      return;
    }

    if (!photo) {
      setErrorText('A profile photo is required for initial enrollment.');
      return;
    }

    setIsSaving(true);
    setErrorText(null);

    try {
      const createdProfile = await createProfileWithEnrollment({
        profileName: trimmedName,
        profileStatus,
        photo,
      });

      Alert.alert('Success', 'Profile created and initial enrollment photo uploaded.');
      router.replace(`/profile/${createdProfile.id}`);
    } catch (error) {
      if (__DEV__) {
        console.log('[profile-add] failed to create profile', error);
      }
      setErrorText('Failed to create profile or upload enrollment photo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color={Colors.text} />
        </TouchableOpacity>

        <Text style={styles.title}>Add Profile</Text>
        <Text style={styles.subtitle}>Create a profile and upload the first enrollment photo.</Text>

        <Card style={styles.section}>
          <Input
            label="Profile Name"
            placeholder="Enter profile name"
            value={profileName}
            onChangeText={setProfileName}
            autoCapitalize="words"
          />
          <Text style={styles.fieldLabel}>Profile Status</Text>
          <Dropdown
            value={profileStatus}
            options={PROFILE_STATUS_OPTIONS}
            onChange={setProfileStatus}
            containerStyle={styles.dropdown}
          />
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Initial Enrollment Photo</Text>
          {photo ? (
            <View style={styles.photoPreviewContainer}>
              <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
            </View>
          ) : (
            <Text style={styles.emptyPhotoText}>No photo selected yet.</Text>
          )}

          <View style={styles.photoButtons}>
            <Button
              title="From Library"
              onPress={handleAddFromLibrary}
              variant="outline"
              disabled={isPicking || isSaving}
              style={styles.photoButton}
            />
            <Button
              title="Take Photo"
              onPress={handleTakePhoto}
              variant="outline"
              disabled={isPicking || isSaving}
              style={styles.photoButton}
            />
          </View>
        </Card>

        {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

        <Button
          title="Create Profile"
          onPress={() => void handleCreateProfile()}
          loading={isSaving}
          disabled={isSaving || isPicking}
          style={styles.createButton}
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
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 14,
  },
  backButton: {
    marginBottom: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.88)',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textDark,
  },
  dropdown: {
    marginBottom: 0,
  },
  photoPreviewContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceDark,
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  emptyPhotoText: {
    color: Colors.textGray,
    fontSize: 14,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flex: 1,
    marginHorizontal: 0,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
  },
  createButton: {
    marginHorizontal: 0,
    marginTop: 2,
  },
});
