import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dropdown } from '@/components/ui/dropdown';
import RuleCard from '@/components/ui/rule-card';
import { Colors } from '@/constants/theme';
import { MOCK_CAMERAS } from '@/stores/camerasStore';
import { MOCK_PROFILES } from '@/stores/profilesStore';
import { MOCK_RULES } from '@/stores/rulesStore';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ...existing code...

export default function RulesScreen() {
  const [cameraFilter, setCameraFilter] = useState<string>('all');
  const [personFilter, setPersonFilter] = useState<string>('all');
  const [, setRefresh] = useState(0);

  // Refresh the list when screen comes into focus to show newly added rules
  useFocusEffect(
    useCallback(() => {
      setRefresh(prev => prev + 1);
    }, [])
  );

  // ...existing code...

  // Filtering logic
  const filteredRules = MOCK_RULES.filter(rule => {
    // Camera filter
    const cameraMatch = cameraFilter === 'all' || rule.global === true || rule.cameras.includes(cameraFilter);

    // Person filter
    const personMatch = personFilter === 'all' || rule.triggers.some(trigger =>
      trigger.type === 'face_detected' && trigger.profileId === personFilter
    );

    return cameraMatch && personMatch;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Rules</Text>
      </View>

      <View style={styles.filters}>
        <Card style={styles.filterSection}>
          <Text style={styles.filterTitle}>CAMERA</Text>
          <Dropdown
            options={[{ label: 'All', value: 'all' }, ...MOCK_CAMERAS.map(c => ({ label: c.name, value: c.id }))]}
            value={cameraFilter}
            onChange={setCameraFilter}
          />
        </Card>
        <Card style={styles.filterSection}>
          <Text style={styles.filterTitle}>PERSON</Text>
          <Dropdown
            options={[{ label: 'All', value: 'all' }, ...MOCK_PROFILES.map(p => ({ label: p.displayName, value: p.id }))]}
            value={personFilter}
            onChange={setPersonFilter}
          />
        </Card>
      </View>

      <FlatList
        data={filteredRules}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <RuleCard rule={item}></RuleCard>
        )}
      />

      <View style={styles.buttonContainer}>
        <Button
          title="Add Rule"
          onPress={() => router.push('../rule/new')}
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
  // ...existing code...
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
