import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MOCK_RULES = [
  { id: '1', name: 'Rule #1', summary: 'CAMERA | PERSON' },
  { id: '2', name: 'Rule #2', summary: 'CAMERA | PERSON' },
  { id: '3', name: 'Night Alert', summary: 'CAMERA 1 | UNKNOWN' },
  { id: '4', name: 'Front Door', summary: 'ALL CAMERAS | MOTION' },
];

const CAMERA_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'camera-1', label: 'Camera 1' },
  { id: 'camera-2', label: 'Camera 2' },
];

const PERSON_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'person-1', label: 'Person 1' },
  { id: 'person-2', label: 'Person 2' },
];

export default function RulesScreen() {
  const [cameraFilter, setCameraFilter] = useState<string[]>(['all']);
  const [personFilter, setPersonFilter] = useState<string[]>(['all']);

  const toggleFilter = (filterId: string, filterType: 'camera' | 'person') => {
    const currentFilters = filterType === 'camera' ? cameraFilter : personFilter;
    const setFilters = filterType === 'camera' ? setCameraFilter : setPersonFilter;
    
    if (filterId === 'all') {
      setFilters(['all']);
    } else {
      const newFilters = currentFilters.includes(filterId)
        ? currentFilters.filter(f => f !== filterId)
        : [...currentFilters.filter(f => f !== 'all'), filterId];
      setFilters(newFilters.length === 0 ? ['all'] : newFilters);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Rules</Text>
      </View>

      <View style={styles.filters}>
        <Card style={styles.filterSection}>
          <Text style={styles.filterTitle}>CAMERA</Text>
          {CAMERA_FILTERS.map(filter => (
            <TouchableOpacity
              key={filter.id}
              style={styles.checkbox}
              onPress={() => toggleFilter(filter.id, 'camera')}
            >
              <View style={[
                styles.checkboxBox,
                cameraFilter.includes(filter.id) && styles.checkboxBoxChecked
              ]}>
                {cameraFilter.includes(filter.id) && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              <Text style={styles.checkboxLabel}>{filter.label}</Text>
            </TouchableOpacity>
          ))}
        </Card>

        <Card style={styles.filterSection}>
          <Text style={styles.filterTitle}>PERSON</Text>
          {PERSON_FILTERS.map(filter => (
            <TouchableOpacity
              key={filter.id}
              style={styles.checkbox}
              onPress={() => toggleFilter(filter.id, 'person')}
            >
              <View style={[
                styles.checkboxBox,
                personFilter.includes(filter.id) && styles.checkboxBoxChecked
              ]}>
                {personFilter.includes(filter.id) && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              <Text style={styles.checkboxLabel}>{filter.label}</Text>
            </TouchableOpacity>
          ))}
        </Card>
      </View>

      <FlatList
        data={MOCK_RULES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push('/rule-trigger')}>
            <Card variant="lavender" style={styles.ruleCard}>
              <View style={styles.ruleContent}>
                <View style={styles.ruleAvatar}>
                  <Text style={styles.ruleAvatarText}>A</Text>
                </View>
                <View style={styles.ruleInfo}>
                  <Text style={styles.ruleName}>{item.name}</Text>
                  <Text style={styles.ruleSummary}>{item.summary}</Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />

      <View style={styles.buttonContainer}>
        <Button
          title="Add Action"
          onPress={() => router.push('/rule-action')}
          variant="outline"
        />
      </View>
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
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  filterSection: {
    flex: 1,
    padding: 12,
  },
  filterTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 8,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
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
  list: {
    padding: 20,
    gap: 12,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  ruleCard: {
    marginBottom: 0,
  },
  ruleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ruleAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.avatarBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ruleAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.avatarText,
  },
  ruleInfo: {
    flex: 1,
  },
  ruleName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: 2,
  },
  ruleSummary: {
    fontSize: 12,
    color: Colors.textGray,
  },
});
