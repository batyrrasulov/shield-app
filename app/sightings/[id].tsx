import { getEvents } from '@/api/hub';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { getCameraById } from '@/stores/camerasStore';
import { findProfileById } from '@/stores/profilesStore';
import { getSightingsByProfile } from '@/stores/sightingsStore';
import { DetectionEvent } from '@/types';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }
  return date.toLocaleString();
};

export default function SightingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = id ? findProfileById(id) : undefined;
  const [sightings, setSightings] = useState<DetectionEvent[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!id) {
        return;
      }
      setLoadError(null);
      try {
        const events = await getEvents({ profileId: id });
        if (isMounted) {
          setSightings(events);
        }
      } catch {
        if (isMounted) {
          setSightings(getSightingsByProfile(id));
          setLoadError('Using cached sightings.');
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const sortedSightings = useMemo(() => {
    return sightings.slice().sort((a, b) => (
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ));
  }, [sightings]);

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
          <Text style={styles.title}>Sightings</Text>
        </View>
        {loadError ? <Text style={styles.statusText}>{loadError}</Text> : null}
      </View>

      <FlatList
        data={sortedSightings}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.sightingCard}>
            <Text style={styles.sightingTime}>{formatTimestamp(item.timestamp)}</Text>
            <Text style={styles.sightingCamera}>
              {getCameraById(item.cameraId)?.name || 'Unknown Camera'}
            </Text>
            <Text style={styles.sightingMeta}>Confidence: {item.confidence ?? 'N/A'}</Text>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.emptyStateInline}>
            <Text style={styles.emptyText}>No sightings recorded yet.</Text>
          </View>
        }
      />
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
  subtitle: {
    fontSize: 14,
    color: Colors.text,
    marginTop: 12,
  },
  statusText: {
    fontSize: 12,
    color: Colors.textGray,
    marginTop: 6,
  },
  list: {
    padding: 20,
    gap: 12,
  },
  sightingCard: {
    marginBottom: 0,
    gap: 6,
  },
  sightingTime: {
    fontSize: 14,
    color: Colors.textDark,
    fontWeight: '600',
  },
  sightingCamera: {
    fontSize: 13,
    color: Colors.textGray,
  },
  sightingMeta: {
    fontSize: 12,
    color: Colors.textGray,
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
  emptyStateInline: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textGray,
  },
});
