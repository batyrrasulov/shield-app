import { Button } from '@/components/ui/button';
import { Dropdown } from '@/components/ui/dropdown';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MOCK_CAMERAS = [
  { label: 'Camera 1', value: 'camera-1' },
  { label: 'Camera 2', value: 'camera-2' },
  { label: 'Front Door', value: 'camera-3' },
];

export default function LiveScreen() {
  const [selectedCamera, setSelectedCamera] = useState('camera-1');
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Dropdown
          value={selectedCamera}
          options={MOCK_CAMERAS}
          onChange={setSelectedCamera}
          containerStyle={styles.dropdown}
        />

        <View style={styles.cameraHeader}>
          <Text style={styles.cameraName}>
            {MOCK_CAMERAS.find(c => c.value === selectedCamera)?.label}
          </Text>
          <TouchableOpacity style={styles.editButton}>
            <IconSymbol name="pencil" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.videoContainer}>
          <TouchableOpacity 
            style={styles.playButton}
            onPress={() => setIsPlaying(!isPlaying)}
          >
            <IconSymbol 
              name={isPlaying ? "pause.circle.fill" : "play.circle.fill"} 
              size={80} 
              color={Colors.text} 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton}>
            <IconSymbol name="camera.fill" size={28} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton}>
            <IconSymbol name="backward.fill" size={28} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => setIsPlaying(!isPlaying)}
          >
            <IconSymbol 
              name={isPlaying ? "pause.fill" : "play.fill"} 
              size={28} 
              color={Colors.text} 
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton}>
            <IconSymbol name="forward.fill" size={28} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton}>
            <IconSymbol name="speaker.slash.fill" size={28} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <Button
          title="View Playback"
          onPress={() => {}}
          variant="primary"
          style={styles.playbackButton}
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
    alignItems: 'center',
  },
  dropdown: {
    marginBottom: 24,
    width: '100%',
  },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  cameraName: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
  },
  editButton: {
    padding: 4,
  },
  videoContainer: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: 16,
    aspectRatio: 16 / 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    width: '100%',
  },
  playButton: {
    opacity: 0.9,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
    width: '100%',
  },
  controlButton: {
    padding: 12,
  },
  playbackButton: {
    marginHorizontal: 0,
    width: '100%',
  },
});
