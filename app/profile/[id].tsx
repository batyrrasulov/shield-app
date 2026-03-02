import { getCameras, getProfileById } from '@/api/hub';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { Camera, Profile } from '@/types';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!id) {
        setProfile(null);
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const [profileData, camerasData] = await Promise.all([
          getProfileById(id),
          getCameras(),
        ]);

        if (!isMounted) {
          return;
        }

        setProfile(profileData);
        setCameras(camerasData);
      } catch {
        if (!isMounted) {
          return;
        }

        setProfile(null);
        setCameras([]);
        setLoadError('Failed to load profile details from the hub.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const lastSeenCameraName = useMemo(() => {
    if (!profile?.lastSeen) {
      return null;
    }
    return cameras.find((camera) => camera.id === profile.lastSeen?.cameraId)?.name ?? 'Unknown Camera';
  }, [cameras, profile]);

  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{isLoading ? 'Loading profile...' : 'Profile not found'}</Text>
          {loadError ? <Text style={styles.emptyMessage}>{loadError}</Text> : null}
          <Button title="Back" onPress={() => router.back()} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/(tabs)/profiles')}>
          <IconSymbol name="chevron.left" size={24} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Avatar name={profile.displayName} size={120} />
          <Text style={styles.name}>{profile.displayName}</Text>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push(`/enroll/${profile.id}`)}>
              <IconSymbol name="camera.fill" size={28} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <IconSymbol name="trash.fill" size={28} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <IconSymbol name="pencil" size={28} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <Card style={styles.infoCard}>
          {profile.lastSeen ? (
            <>
              <Text style={styles.infoTitle}>LAST SEEN</Text>
              <Text style={styles.infoDateTime}>
                {profile.lastSeen.date} - {profile.lastSeen.time}
              </Text>
              <Text style={styles.infoCamera}>{lastSeenCameraName}</Text>
            </>
          ) : (
            <Text style={styles.infoCamera}>No recent sightings for this profile.</Text>
          )}
        </Card>

        <Button
          title="More Sightings"
          onPress={() => router.push(`/sightings/${profile.id}`)}
          variant="outline"
          style={styles.button}
        />

        <Button
          title="New Rule"
          onPress={() => router.push('/rule/new')}
          variant="outline"
          style={styles.button}
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
  },
  backButton: {
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  name: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 24,
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surfaceDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: Colors.textGray,
    marginBottom: 12,
  },
  infoDateTime: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: 4,
  },
  infoCamera: {
    fontSize: 15,
    color: Colors.textGray,
    marginTop: 2,
  },
  button: {
    marginBottom: 12,
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
  emptyMessage: {
    color: Colors.textGray,
    marginBottom: 12,
    textAlign: 'center',
  },
});
