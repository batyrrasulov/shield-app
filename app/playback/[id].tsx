import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { getCameraById } from '@/stores/camerasStore';
import { getRecordingById } from '@/stores/recordingsStore';
import { ResizeMode, Video } from 'expo-av';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
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
  const recording = id ? getRecordingById(id) : undefined;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  if (!recording) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Recording not found</Text>
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
          <Text style={styles.detailValue}>
            {getCameraById(recording.cameraId)?.name || 'Unknown Camera'}
          </Text>

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
});
