import { Card } from '@/components/ui/card';
import { Dropdown } from '@/components/ui/dropdown';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Input } from '@/components/ui/input';
import { Colors } from '@/constants/theme';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ACTIONS = [
  { label: 'Disable Camera', value: 'disable_camera' },
  { label: 'Send Alert', value: 'send_alert' },
  { label: 'Start Recording', value: 'start_recording' },
];

const TIME_UNITS = [
  { label: 'Minutes', value: 'minutes' },
  { label: 'Seconds', value: 'seconds' },
  { label: 'Hours', value: 'hours' },
];

const ALERT_TYPES = [
  { label: 'Send Alert', value: 'send_alert' },
  { label: 'Push Notification', value: 'push' },
  { label: 'Email', value: 'email' },
];

export default function RuleActionScreen() {
  const [action, setAction] = useState('disable_camera');
  const [duration, setDuration] = useState('5');
  const [timeUnit, setTimeUnit] = useState('minutes');
  const [notification, setNotification] = useState(true);
  const [alertType, setAlertType] = useState('send_alert');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color={Colors.text} />
        </TouchableOpacity>

        <Card style={styles.card}>
          <Text style={styles.title}>Action</Text>

          <Dropdown
            value={action}
            options={ACTIONS}
            onChange={setAction}
          />

          <View style={styles.durationRow}>
            <Input
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
              containerStyle={styles.durationInput}
            />
            <Dropdown
              value={timeUnit}
              options={TIME_UNITS}
              onChange={setTimeUnit}
              containerStyle={styles.timeUnitDropdown}
            />
          </View>

          <TouchableOpacity 
            style={styles.checkbox}
            onPress={() => setNotification(!notification)}
          >
            <View style={[styles.checkboxBox, notification && styles.checkboxBoxChecked]}>
              {notification && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Notification</Text>
          </TouchableOpacity>

          <Dropdown
            value={alertType}
            options={ALERT_TYPES}
            onChange={setAlertType}
          />
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
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: 20,
  },
  card: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textDark,
    textAlign: 'center',
    marginBottom: 20,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  durationInput: {
    width: 80,
  },
  timeUnitDropdown: {
    flex: 1,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 14,
    color: Colors.textDark,
  },
});
