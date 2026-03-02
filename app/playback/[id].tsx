import { getCameras, getRecordingById } from '@/api/hub';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { Camera, Recording } from '@/types';
import { ResizeMode, Video } from 'expo-av';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }
  return date.toLocaleString();
};

export default function PlaybackDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [recording, setRecording] = useState<Recording | null>(null);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!id) {
        setRecording(null);
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const [recordingData, camerasData] = await Promise.all([
          getRecordingById(id),
          getCameras(),
        ]);
        if (!isMounted) {
          return;
        }

        setRecording(recordingData);
        setCameras(camerasData);
      } catch {
        if (!isMounted) {
          return;
        }
        setRecording(null);
        setCameras([]);
        setLoadError('Failed to load recording details from the hub.');
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

  const cameraName = useMemo(
    () =>
      recording
        ? (cameras.find((camera) => camera.id === recording.cameraId)?.name ?? 'Unknown Camera')
        : 'Unknown Camera',
    [cameras, recording],
  );

  if (!recording) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{isLoading ? 'Loading recording...' : 'Recording not found'}</Text>
          {loadError ? <Text style={styles.emptyMessage}>{loadError}</Text> : null}
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
          <Text style={styles.title}>Playback</Text>
        </View>
        {loadError ? <Text style={styles.statusText}>{loadError}</Text> : null}
      </View>
      <ScrollView contentContainerStyle={styles.content}>

        <Card style={styles.videoCard}>
          <Video
            style={styles.video}
            source={{ uri: recording.fileRef }}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={isPlaying}
            isMuted={isMuted}
            useNativeControls={false}
          />
        </Card>

        <View style={styles.controls}>
          <Button
            title={isPlaying ? 'Pause' : 'Play'}
            onPress={() => setIsPlaying(prev => !prev)}
            variant="outline"
            style={styles.controlButton}
          />
          <Button
            title={isMuted ? 'Unmute' : 'Mute'}
            onPress={() => setIsMuted(prev => !prev)}
            variant="outline"
            style={styles.controlButton}
          />
        </View>

        <Card style={styles.detailsCard}>
          <Text style={styles.detailLabel}>Camera</Text>
          <Text style={styles.detailValue}>{cameraName}</Text>

          <Text style={styles.detailLabel}>Start</Text>
          <Text style={styles.detailValue}>{formatTimestamp(recording.startTimestamp)}</Text>

          <Text style={styles.detailLabel}>End</Text>
          <Text style={styles.detailValue}>{formatTimestamp(recording.endTimestamp)}</Text>

          <Text style={styles.detailLabel}>Reason</Text>
          <Text style={styles.detailValue}>{recording.reason}</Text>

          <Text style={styles.detailLabel}>Stream URL</Text>
          <Text style={styles.detailValue}>{recording.fileRef}</Text>
        </Card>
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
  videoCard: {
    marginBottom: 16,
  },
  video: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: 12,
    aspectRatio: 16 / 9,
    width: '100%',
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  controlButton: {
    flex: 1,
  },
  detailsCard: {
    marginBottom: 16,
    gap: 6,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textGray,
    marginTop: 8,
  },
  detailValue: {
    fontSize: 14,
    color: Colors.textDark,
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
  statusText: {
    marginTop: 6,
    color: Colors.textGray,
    fontSize: 12,
  },
});
