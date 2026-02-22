import { getCameras, startRecording, stopRecording } from '@/api/hub';
import { Button } from '@/components/ui/button';
import { Dropdown } from '@/components/ui/dropdown';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { getCameraById, MOCK_CAMERAS } from '@/stores/camerasStore';
import { Camera } from '@/types';
import { ResizeMode, Video } from 'expo-av';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LiveScreen() {
  const [selectedCameraId, setSelectedCameraId] = useState('01');
  const [cameras, setCameras] = useState<Camera[]>(MOCK_CAMERAS);
  const [selectedCamera, setSelectedCamera] = useState(MOCK_CAMERAS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingLoading, setRecordingLoading] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    let isMounted = true;

    const loadCameras = async () => {
      setCameraError(null);
      try {
        const data = await getCameras();
        if (isMounted && data.length > 0) {
          setCameras(data);
          setSelectedCameraId(data[0].id);
          setSelectedCamera(data[0]);
        }
      } catch {
        if (isMounted) {
          setCameras(MOCK_CAMERAS);
          setCameraError('Using cached cameras.');
        }
      }
    };

    loadCameras();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCameraChange = (newId : string) => {
    setSelectedCameraId(newId);
    const newCamera = cameras.find(camera => camera.id === newId) ?? getCameraById(newId);
    if (newCamera !== undefined) setSelectedCamera(newCamera);
    setStreamError(null);
    setIsPlaying(false);
  }

  const CAMERA_DROPDOWN : {value: string, label: string}[] = cameras.map(camera => ({ label: camera.name, value: camera.id }))
  const streamUrl = useMemo(() => selectedCamera?.streamRef, [selectedCamera]);

  const toggleRecording = async () => {
    if (!selectedCamera) {
      return;
    }

    setRecordingLoading(true);
    try {
      if (isRecording) {
        await stopRecording(selectedCamera.id);
        setIsRecording(false);
      } else {
        await startRecording(selectedCamera.id);
        setIsRecording(true);
      }
    } catch {
      Alert.alert('Recording error', 'Unable to update recording state.');
    } finally {
      setRecordingLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Dropdown
          value={selectedCameraId}
          options={CAMERA_DROPDOWN}
          onChange={handleCameraChange}
          containerStyle={styles.dropdown}
        />

        <View style={styles.cameraHeader}>
          <Text style={styles.cameraName}>
            {selectedCamera.name}
          </Text>
          <TouchableOpacity style={styles.editButton}>
            <IconSymbol name="pencil" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>
        {cameraError ? <Text style={styles.statusText}>{cameraError}</Text> : null}

        <View style={styles.videoContainer}>
          {streamUrl ? (
            <>
              <Video
                ref={videoRef}
                style={styles.video}
                source={{ uri: streamUrl }}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={isPlaying}
                isMuted={isMuted}
                useNativeControls={false}
                onError={() => setStreamError('Unable to load stream.')}
              />
              {streamError ? (
                <View style={styles.videoOverlay}>
                  <Text style={styles.videoOverlayText}>{streamError}</Text>
                </View>
              ) : null}
            </>
          ) : (
            <View style={styles.videoOverlay}>
              <Text style={styles.videoOverlayText}>No stream configured</Text>
            </View>
          )}
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, isRecording && styles.controlButtonActive]}
            onPress={toggleRecording}
            disabled={recordingLoading}
          >
            {recordingLoading ? (
              <ActivityIndicator color={Colors.text} />
            ) : (
              <IconSymbol name="camera.fill" size={28} color={Colors.text} />
            )}
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
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setIsMuted(prev => !prev)}
          >
            <IconSymbol name="speaker.slash.fill" size={28} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <Button
          title="View Playback"
          onPress={() => router.push(`/playback?cameraId=${selectedCameraId}`)}
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
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  videoOverlayText: {
    color: Colors.text,
    fontSize: 14,
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
  controlButtonActive: {
    backgroundColor: 'rgba(205, 118, 114, 0.4)',
    borderRadius: 28,
  },
  playbackButton: {
    marginHorizontal: 0,
    width: '100%',
  },
  statusText: {
    color: Colors.textGray,
    fontSize: 12,
    marginBottom: 12,
  },
});
