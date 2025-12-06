import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dropdown } from '@/components/ui/dropdown';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Input } from '@/components/ui/input';
import { Colors } from '@/constants/theme';
import { Rule, RuleAction, RuleTrigger } from '@/types';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

const TRIGGER_TYPES = [
  { label: 'Motion Detected', value: 'motion_detected' },
  { label: 'Face Detected', value: 'face_detected' },
  { label: 'Time Interval', value: 'time_interval' },
  { label: 'Scheduled', value: 'scheduled' },
];

const ACTION_TYPES = [
  { label: 'Send Notification', value: 'send_notification' },
  { label: 'Mark Event Important', value: 'mark_event_important' },
  { label: 'Start Recording', value: 'start_recording_clip' },
  { label: 'Tag for Follow-up', value: 'tag_event_for_followup' },
  { label: 'Disable Camera', value: 'disable_camera' },
];

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

export default function RuleEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';

  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rule, setRule] = useState<Rule>({
    id: '',
    name: '',
    description: '',
    triggers: [],
    actions: [],
    enabled: true,
  });

  // Step 2 - Triggers state
  const [selectedTriggerType, setSelectedTriggerType] = useState<string>('motion_detected');
  const [triggerMessage, setTriggerMessage] = useState<string>('');

  // Step 3 - Actions state
  const [selectedActionType, setSelectedActionType] = useState<string>('send_notification');
  const [actionMessage, setActionMessage] = useState<string>('');

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
      setStep(1);
    } else {
      Alert.alert('Not found', 'Rule not found, creating new.');
      setRule(r => ({ ...r, id: generateId() }));
    }
    setLoading(false);
  }, [id]);

  const handleNextStep = () => {
    if (step === 1) {
      if (!rule.name.trim()) {
        Alert.alert('Validation', 'Rule name is required');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (rule.triggers.length === 0) {
        Alert.alert('Validation', 'At least one trigger is required');
        return;
      }
      setStep(3);
    }
  };

  const handlePreviousStep = () => {
    if (step > 1) {
      setStep((step - 1) as 1 | 2 | 3);
    }
  };

  const addTrigger = () => {
    const newTrigger: RuleTrigger =
      selectedTriggerType === 'motion_detected'
        ? { type: 'motion_detected' }
        : selectedTriggerType === 'face_detected'
          ? { type: 'face_detected', profileId: 'profile-1' }
          : selectedTriggerType === 'time_interval'
            ? { type: 'time_interval', interval: 5, unit: 'minute' }
            : { type: 'scheduled', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] };

    setRule(r => ({
      ...r,
      triggers: [...r.triggers, newTrigger],
    }));
    setSelectedTriggerType('motion_detected');
  };

  const removeTrigger = (index: number) => {
    setRule(r => ({
      ...r,
      triggers: r.triggers.filter((_, i) => i !== index),
    }));
  };

  const addAction = () => {
    const newAction: RuleAction =
      selectedActionType === 'send_notification'
        ? { type: 'send_notification', message: actionMessage || 'Alert!' }
        : selectedActionType === 'mark_event_important'
          ? { type: 'mark_event_important' }
          : selectedActionType === 'start_recording_clip'
            ? { type: 'start_recording_clip', duration: 1, unit: 'minute' }
            : selectedActionType === 'tag_event_for_followup'
              ? { type: 'tag_event_for_followup' }
              : { type: 'disable_camera', duration: 5, unit: 'minute', notification: true };

    setRule(r => ({
      ...r,
      actions: [...r.actions, newAction],
    }));
    setSelectedActionType('send_notification');
    setActionMessage('');
  };

  const removeAction = (index: number) => {
    setRule(r => ({
      ...r,
      actions: r.actions.filter((_, i) => i !== index),
    }));
  };

  const save = () => {
    if (!rule.name.trim()) {
      Alert.alert('Validation', 'Name is required');
      return;
    }
    if (rule.triggers.length === 0) {
      Alert.alert('Validation', 'At least one trigger is required');
      return;
    }
    if (rule.actions.length === 0) {
      Alert.alert('Validation', 'At least one action is required');
      return;
    }

    // replace with API create/update
    MOCK_STORE[rule.id] = { ...rule };
    router.back();
  };

  if (loading) return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    </SafeAreaView>
  );

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
          <View style={styles.stepIndicator}>
            {[1, 2, 3].map((stepNum) => (
              <View key={stepNum} style={styles.stepIndicatorItem}>
                <View
                  style={[
                    styles.stepDot,
                    stepNum <= step && styles.stepDotActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepDotText,
                      stepNum <= step && styles.stepDotTextActive,
                    ]}
                  >
                    {stepNum}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {step === 1 && (
            <>
              <Text style={styles.title}>Basic Information</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Name</Text>
                <Input
                  value={rule.name}
                  onChangeText={(t) => setRule(r => ({ ...r, name: t }))}
                  placeholder="Rule name"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Description</Text>
                <Input
                  value={rule.description}
                  onChangeText={(t) => setRule(r => ({ ...r, description: t }))}
                  placeholder="Optional description"
                />
              </View>

              <TouchableOpacity 
                style={styles.checkbox}
                onPress={() => setRule(r => ({ ...r, enabled: !r.enabled }))}
              >
                <View style={[styles.checkboxBox, rule.enabled && styles.checkboxBoxChecked]}>
                  {rule.enabled && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Enabled</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.title}>Triggers</Text>
              <Text style={styles.subtitle}>Add one or more triggers to activate this rule</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Trigger Type</Text>
                <Dropdown
                  value={selectedTriggerType}
                  options={TRIGGER_TYPES}
                  onChange={setSelectedTriggerType}
                />
              </View>

              <Button 
                title="Add Trigger"
                onPress={addTrigger}
                variant="secondary"
              />

              {rule.triggers.length > 0 && (
                <View style={styles.listSection}>
                  <Text style={styles.listTitle}>Added Triggers:</Text>
                  {rule.triggers.map((trigger, idx) => (
                    <View key={idx} style={styles.listItem}>
                      <Text style={styles.listItemText}>
                        {trigger.type === 'motion_detected' && 'Motion Detected'}
                        {trigger.type === 'face_detected' && 'Face Detected'}
                        {trigger.type === 'time_interval' && 'Time Interval'}
                        {trigger.type === 'scheduled' && 'Scheduled'}
                      </Text>
                      <TouchableOpacity onPress={() => removeTrigger(idx)}>
                        <IconSymbol name="trash.fill" size={20} color={Colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.title}>Actions</Text>
              <Text style={styles.subtitle}>Add one or more actions to execute when triggered</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Action Type</Text>
                <Dropdown
                  value={selectedActionType}
                  options={ACTION_TYPES}
                  onChange={setSelectedActionType}
                />
              </View>

              {selectedActionType === 'send_notification' && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Message</Text>
                  <Input
                    value={actionMessage}
                    onChangeText={setActionMessage}
                    placeholder="Notification message"
                  />
                </View>
              )}

              <Button 
                title="Add Action"
                onPress={addAction}
                variant="secondary"
              />

              {rule.actions.length > 0 && (
                <View style={styles.listSection}>
                  <Text style={styles.listTitle}>Added Actions:</Text>
                  {rule.actions.map((action, idx) => (
                    <View key={idx} style={styles.listItem}>
                      <Text style={styles.listItemText}>
                        {action.type === 'send_notification' && `Send: ${(action as any).message}`}
                        {action.type === 'mark_event_important' && 'Mark Event Important'}
                        {action.type === 'start_recording_clip' && 'Start Recording'}
                        {action.type === 'tag_event_for_followup' && 'Tag for Follow-up'}
                        {action.type === 'disable_camera' && 'Disable Camera'}
                      </Text>
                      <TouchableOpacity onPress={() => removeAction(idx)}>
                        <IconSymbol name="xmark.circle" size={20} color={Colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          <View style={styles.buttonGroup}>
            {step > 1 && (
              <Button 
                title="Back"
                onPress={handlePreviousStep}
                variant="primary"
                style={{ flex: 1 }}
              />
            )}
            {step < 3 ? (
              <Button 
                title="Next"
                onPress={handleNextStep}
                variant="primary"
                style={{ flex: 1 }}
              />
            ) : (
              <Button 
                title="Save Rule"
                onPress={save}
                variant="primary"
                style={{ flex: 1 }}
              />
            )}
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.text,
    fontSize: 16,
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
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    gap: 52,
  },
  stepIndicatorItem: {
  },
  stepDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepDotText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textGray,
  },
  stepDotTextActive: {
    color: Colors.text,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textDark,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textGray,
    textAlign: 'center',
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: 8,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 4,
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
  listSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  listItemText: {
    fontSize: 13,
    color: Colors.textDark,
    flex: 1,
  },
  buttonGroup: {
    gap: 12,
    marginTop: 24,
    flexDirection: 'row',
  },
});
