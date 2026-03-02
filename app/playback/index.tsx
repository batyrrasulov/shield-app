import { getCameras, getRecordings } from '@/api/hub';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dropdown } from '@/components/ui/dropdown';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { Camera, Recording } from '@/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }
  return date.toLocaleString();
};

export default function PlaybackScreen() {
  const { cameraId } = useLocalSearchParams<{ cameraId?: string }>();
  const [cameraFilter, setCameraFilter] = useState(cameraId || 'all');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await getRecordings();
        if (isMounted) {
          setRecordings(data);
        }
      } catch {
        if (isMounted) {
          setRecordings([]);
          setLoadError('Failed to load recordings from the hub.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const loadCameras = async () => {
      setCameraError(null);
      try {
        const data = await getCameras();
        if (isMounted) {
          setCameras(data);
        }
      } catch {
        if (isMounted) {
          setCameras([]);
          setCameraError('Failed to load cameras from the hub.');
        }
      }
    };

    load();
    loadCameras();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredRecordings = useMemo(() => {
    return recordings.filter(recording => {
      const cameraMatch = cameraFilter === 'all' || recording.cameraId === cameraFilter;
      const dateMatch = !dateFilter
        || recording.startTimestamp.toLowerCase().includes(dateFilter.toLowerCase());
      return cameraMatch && dateMatch;
    });
  }, [cameraFilter, dateFilter, recordings]);

  const cameraOptions = useMemo(() => {
    return [
      { label: 'All', value: 'all' },
      ...cameras.map(camera => ({ label: camera.name, value: camera.id })),
    ];
  }, [cameras]);

  const resolveCameraName = (cameraId: string) => {
    return cameras.find(camera => camera.id === cameraId)?.name ?? 'Unknown Camera';
  };

  const formatDate = (date: Date) => date.toISOString().slice(0, 10);
  const displayDate = selectedDate ? formatDate(selectedDate) : '';

  const handleDateChange = (event: { type?: string }, date?: Date) => {
    if (Platform.OS === 'android') {
      setIsDatePickerOpen(false);
    }
    if (event.type === 'dismissed') {
      return;
    }
    if (date) {
      setSelectedDate(date);
      setDateFilter(formatDate(date));
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Playbacks</Text>
        </View>
        {isLoading ? <Text style={styles.statusText}>Loading...</Text> : null}
        {loadError ? <Text style={styles.statusText}>{loadError}</Text> : null}
        {cameraError ? <Text style={styles.statusText}>{cameraError}</Text> : null}
      </View>

      <FlatList
        data={filteredRecordings}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.filters}>
            <View style={styles.filtersRow}>
              <View style={styles.filterField}>
                <Text style={styles.filterLabel}>Camera</Text>
                <Dropdown
                  value={cameraFilter}
                  options={cameraOptions}
                  onChange={setCameraFilter}
                  containerStyle={styles.filterControl}
                  selectorStyle={styles.filterSelector}
                  selectorTextStyle={styles.filterSelectorText}
                  iconColor={Colors.textDark}
                />
              </View>
              <View style={styles.filterField}>
                <Text style={styles.filterLabel}>Date</Text>
                <TouchableOpacity
                  style={styles.dateSelector}
                  onPress={() => setIsDatePickerOpen(true)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dateSelectorText, !displayDate && styles.datePlaceholder]}>
                    {displayDate || 'Select date'}
                  </Text>
                  <IconSymbol name="chevron.down" size={20} color={Colors.textDark} />
                </TouchableOpacity>
                {Platform.OS === 'android' && isDatePickerOpen ? (
                  <DateTimePicker
                    value={selectedDate ?? new Date()}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                  />
                ) : null}
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Card style={styles.recordingCard}>
            <View style={styles.recordingCardContent}>
              <View style={styles.recordingDetails}>
                <View style={styles.recordingHeader}>
                  <Text style={styles.recordingCamera}>
                    {resolveCameraName(item.cameraId)}
                  </Text>
                  <Text style={styles.recordingTime}>{formatTimestamp(item.startTimestamp)}</Text>
                </View>
                <Text style={styles.recordingReason}>{item.reason}</Text>
                <Text style={styles.recordingMeta}>Size: {item.size} MB</Text>
              </View>
              <Button
                title="Open"
                onPress={() => router.push(`/playback/${item.id}`)}
                variant="outline"
                style={styles.openButton}
              />
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No recordings match these filters.</Text>
          </View>
        }
      />

      <Modal
        visible={Platform.OS === 'ios' && isDatePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDatePickerOpen(false)}
      >
        <TouchableOpacity
          style={styles.dateModalOverlay}
          activeOpacity={1}
          onPress={() => setIsDatePickerOpen(false)}
        >
          <View style={styles.dateModalCard}>
            <Text style={styles.dateModalTitle}>Select date</Text>
            <DateTimePicker
              value={selectedDate ?? new Date()}
              mode="date"
              display="spinner"
              onChange={handleDateChange}
            />
            <TouchableOpacity
              style={styles.dateModalDone}
              onPress={() => setIsDatePickerOpen(false)}
            >
              <Text style={styles.dateModalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  statusText: {
    marginTop: 6,
    color: Colors.textGray,
    fontSize: 12,
  },
  filters: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 12,
    marginBottom: 16,
  },
  filtersTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  filterField: {
    flex: 1,
    minWidth: 160,
    gap: 8,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  filterControl: {
    marginBottom: 0,
  },
  filterSelector: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  filterSelectorText: {
    color: Colors.textDark,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateSelectorText: {
    fontSize: 16,
    color: Colors.textDark,
  },
  datePlaceholder: {
    color: Colors.textGray,
  },
  dateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  dateModalCard: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: Colors.surface,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  dateModalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textDark,
  },
  dateModalDone: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dateModalDoneText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  list: {
    paddingBottom: 20,
  },
  recordingCard: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  recordingCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  recordingDetails: {
    flex: 1,
  },
  recordingHeader: {
    marginBottom: 8,
  },
  recordingCamera: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
  },
  recordingTime: {
    fontSize: 13,
    color: Colors.textGray,
    marginTop: 4,
  },
  recordingReason: {
    fontSize: 14,
    color: Colors.textDark,
    marginBottom: 6,
  },
  recordingMeta: {
    fontSize: 12,
    color: Colors.textGray,
  },
  openButton: {
    minWidth: 80,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textGray,
  },
});
