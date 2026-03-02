import { getCameras, getProfiles, getRules } from '@/api/hub';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dropdown } from '@/components/ui/dropdown';
import RuleCard from '@/components/ui/rule-card';
import { Colors } from '@/constants/theme';
import { Camera, Profile, Rule } from '@/types';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ...existing code...

export default function RulesScreen() {
  const [cameraFilter, setCameraFilter] = useState<string>('all');
  const [personFilter, setPersonFilter] = useState<string>('all');
  const [rules, setRules] = useState<Rule[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [rulesData, camerasData, profilesData] = await Promise.all([
        getRules(),
        getCameras(),
        getProfiles(),
      ]);
      setRules(rulesData);
      setCameras(camerasData);
      setProfiles(profilesData);
    } catch {
      setRules([]);
      setCameras([]);
      setProfiles([]);
      setLoadError('Failed to load rules from the hub.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  const filteredRules = useMemo(
    () =>
      rules.filter((rule) => {
        const cameraMatch = cameraFilter === 'all' || rule.global === true || rule.cameras.includes(cameraFilter);
        const personMatch =
          personFilter === 'all' ||
          rule.triggers.some(
            (trigger) => trigger.type === 'face_detected' && trigger.profileId === personFilter,
          );
        return cameraMatch && personMatch;
      }),
    [rules, cameraFilter, personFilter],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Rules</Text>
        {isLoading ? <Text style={styles.statusText}>Loading...</Text> : null}
        {loadError ? <Text style={styles.statusText}>{loadError}</Text> : null}
      </View>

      <View style={styles.filters}>
        <Card style={styles.filterSection}>
          <Text style={styles.filterTitle}>CAMERA</Text>
          <Dropdown
            options={[{ label: 'All', value: 'all' }, ...cameras.map(c => ({ label: c.name, value: c.id }))]}
            value={cameraFilter}
            onChange={setCameraFilter}
          />
        </Card>
        <Card style={styles.filterSection}>
          <Text style={styles.filterTitle}>PERSON</Text>
          <Dropdown
            options={[{ label: 'All', value: 'all' }, ...profiles.map(p => ({ label: p.displayName, value: p.id }))]}
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
        ListEmptyComponent={<Text style={styles.emptyText}>No rules found.</Text>}
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
  statusText: {
    color: Colors.textGray,
    fontSize: 12,
    marginTop: 6,
  },
  // ...existing code...
  list: {
    padding: 20,
    gap: 12,
  },
  emptyText: {
    color: Colors.textGray,
    textAlign: 'center',
    marginTop: 20,
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
