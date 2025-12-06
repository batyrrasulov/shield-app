import { Rule } from '@/types';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

// Simple in-memory mock store for demo — replace with API / persistent storage
const MOCK_STORE: Record<string, Rule> = {
  '01': {
    id: '01',
    name: 'Motion Alert',
    description: 'Alert for any motion',
    triggers: [{ type: 'motion_detected' }],
    actions: [{ type: 'send_notification', message: 'Alert Alert!' }],
    enabled: true,
  },
};

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

export default function RuleEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';

  const [loading, setLoading] = useState(true);
  const [rule, setRule] = useState<Rule>({
    id: '',
    name: '',
    description: '',
    triggers: [],
    actions: [],
    enabled: true,
  });

  useEffect(() => {
    if (!id) return;
    if (isNew) {
      setRule(r => ({ ...r, id: generateId() }));
      setLoading(false);
      return;
    }
    // load existing rule (replace with real API call)
    const existing = MOCK_STORE[id];
    if (existing) {
      setRule(existing);
    } else {
      Alert.alert('Not found', 'Rule not found, creating new.');
      setRule(r => ({ ...r, id: generateId() }));
    }
    setLoading(false);
  }, [id]);

  const save = () => {
    // basic validation
    if (!rule.name.trim()) {
      Alert.alert('Validation', 'Name is required');
      return;
    }

    // replace with API create/update
    MOCK_STORE[rule.id] = { ...rule };
    router.back();
  };

  if (loading) return <View style={styles.container}><Text>Loading...</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Name</Text>
      <TextInput
        value={rule.name}
        onChangeText={(t) => setRule(r => ({ ...r, name: t }))}
        style={styles.input}
        placeholder="Rule name"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        value={rule.description}
        onChangeText={(t) => setRule(r => ({ ...r, description: t }))}
        style={styles.input}
        placeholder="Optional description"
      />

      <View style={styles.row}>
        <Text style={styles.label}>Enabled</Text>
        <Switch
          value={rule.enabled}
          onValueChange={(v) => setRule(r => ({ ...r, enabled: v }))}
        />
      </View>

      <View style={styles.actions}>
        <Button title={isNew ? 'Create' : 'Save'} onPress={save} />
        <View style={{ height: 8 }} />
        <Button title="Cancel" onPress={() => router.back()} color="#888" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 6, marginTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  actions: { marginTop: 24 },
});