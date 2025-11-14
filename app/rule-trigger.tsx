import { Card } from '@/components/ui/card';
import { Dropdown } from '@/components/ui/dropdown';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Input } from '@/components/ui/input';
import { Colors } from '@/constants/theme';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TRIGGER_TYPES = [
  { label: 'Person', value: 'person' },
  { label: 'Motion', value: 'motion' },
  { label: 'Camera Offline', value: 'camera_offline' },
];

const PEOPLE = [
  { label: 'Kevin', value: 'kevin' },
  { label: 'Sarah', value: 'sarah' },
  { label: 'Unknown', value: 'unknown' },
];

const CAMERAS = [
  { label: 'Camera 1', value: 'camera-1' },
  { label: 'Camera 2', value: 'camera-2' },
  { label: 'All Cameras', value: 'all' },
];

const SCHEDULE_TYPES = [
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Interval', value: 'interval' },
];

const DAYS = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'];

export default function RuleTriggerScreen() {
  const [triggerType, setTriggerType] = useState('person');
  const [person, setPerson] = useState('kevin');
  const [exclusive, setExclusive] = useState(true);
  const [global, setGlobal] = useState(false);
  const [camera, setCamera] = useState('camera-1');
  const [scheduleType, setScheduleType] = useState('scheduled');
  const [startDate, setStartDate] = useState(false);
  const [endDate, setEndDate] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>(['M', 'Tu', 'W', 'Th', 'F']);
  const [time, setTime] = useState('12:34 pm');

  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

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
          <Text style={styles.title}>Trigger</Text>

          <Dropdown
            value={triggerType}
            options={TRIGGER_TYPES}
            onChange={setTriggerType}
          />

          <View style={styles.rowWithButtons}>
            <Dropdown
              value={person}
              options={PEOPLE}
              onChange={setPerson}
              containerStyle={styles.flexDropdown}
            />
            <TouchableOpacity style={styles.iconButton}>
              <IconSymbol name="plus.circle" size={24} color={Colors.textDark} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <IconSymbol name="minus.circle" size={24} color={Colors.textDark} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.checkbox}
            onPress={() => setExclusive(!exclusive)}
          >
            <View style={[styles.checkboxBox, exclusive && styles.checkboxBoxChecked]}>
              {exclusive && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Exclusive</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.checkbox}
            onPress={() => setGlobal(!global)}
          >
            <View style={[styles.checkboxBox, global && styles.checkboxBoxChecked]}>
              {global && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Global</Text>
          </TouchableOpacity>

          <View style={styles.rowWithButtons}>
            <Dropdown
              value={camera}
              options={CAMERAS}
              onChange={setCamera}
              containerStyle={styles.flexDropdown}
            />
            <TouchableOpacity style={styles.iconButton}>
              <IconSymbol name="plus.circle" size={24} color={Colors.textDark} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <IconSymbol name="minus.circle" size={24} color={Colors.textDark} />
            </TouchableOpacity>
          </View>

          <Dropdown
            value={scheduleType}
            options={SCHEDULE_TYPES}
            onChange={setScheduleType}
          />

          <View style={styles.dateRow}>
            <TouchableOpacity 
              style={styles.checkbox}
              onPress={() => setStartDate(!startDate)}
            >
              <View style={[styles.checkboxBox, startDate && styles.checkboxBoxChecked]}>
                {startDate && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Start Date</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.checkbox}
              onPress={() => setEndDate(!endDate)}
            >
              <View style={[styles.checkboxBox, endDate && styles.checkboxBoxChecked]}>
                {endDate && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>End Date</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dateInputRow}>
            <Input placeholder="mm/dd/yyyy" containerStyle={styles.dateInput} />
            <Text style={styles.dateSeparator}>—</Text>
            <Input placeholder="mm/dd/yyyy" containerStyle={styles.dateInput} />
          </View>

          <View style={styles.daysRow}>
            {DAYS.map(day => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayButton,
                  selectedDays.includes(day) && styles.dayButtonSelected
                ]}
                onPress={() => toggleDay(day)}
              >
                <Text style={[
                  styles.dayText,
                  selectedDays.includes(day) && styles.dayTextSelected
                ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.rowWithButtons}>
            <Input 
              value={time}
              onChangeText={setTime}
              containerStyle={styles.flexDropdown}
            />
            <TouchableOpacity style={styles.iconButton}>
              <IconSymbol name="plus.circle" size={24} color={Colors.textDark} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <IconSymbol name="minus.circle" size={24} color={Colors.textDark} />
            </TouchableOpacity>
          </View>

          <Dropdown
            value="interval"
            options={[{ label: 'Interval', value: 'interval' }]}
            onChange={() => {}}
          />

          <TouchableOpacity style={styles.newTrigger}>
            <IconSymbol name="plus.circle" size={24} color={Colors.textDark} />
            <Text style={styles.newTriggerText}>New Trigger</Text>
          </TouchableOpacity>
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
  rowWithButtons: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 12,
  },
  flexDropdown: {
    flex: 1,
    marginBottom: 0,
  },
  iconButton: {
    padding: 4,
    marginBottom: 4,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  dateInput: {
    flex: 1,
    marginBottom: 0,
  },
  dateSeparator: {
    fontSize: 18,
    color: Colors.textDark,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonSelected: {
    backgroundColor: Colors.primary,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
  },
  dayTextSelected: {
    color: Colors.text,
  },
  newTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  newTriggerText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
  },
});
