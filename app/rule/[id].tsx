import { createRuleWithDetails, getCameras, getProfiles, getRuleById } from '@/api/hub';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dropdown } from '@/components/ui/dropdown';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Input } from '@/components/ui/input';
import { Colors } from '@/constants/theme';
import { Camera, Profile, Rule, RuleAction, RuleTrigger, WeekDay } from '@/types';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';



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

const TIME_UNITS = [
  { label: 'Minutes', value: 'minute' },
  { label: 'Hours', value: 'hour' },
  { label: 'Days', value: 'day' },
  { label: 'Weeks', value: 'week' },
  { label: 'Years', value: 'year' },
];

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

export default function RuleEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [rule, setRule] = useState<Rule>({
    id: '',
    name: '',
    description: '',
    cameras: [],
    triggers: [],
    actions: [],
    enabled: true,
  });

  // Step 2 - Triggers state
  const [selectedTriggerType, setSelectedTriggerType] = useState<string>('motion_detected');
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [timeInterval, setTimeInterval] = useState<string>('5');
  const [timeUnit, setTimeUnit] = useState<string>('minute');
  const [scheduledDays, setScheduledDays] = useState<WeekDay[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [scheduledTime, setScheduledTime] = useState<string>('13:00');
  const days : WeekDay[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Step 3 - Actions state
  const [selectedActionType, setSelectedActionType] = useState<string>('send_notification');
  const [actionMessage, setActionMessage] = useState<string>('');
  const [recordingDuration, setRecordingDuration] = useState<string>('5');
  const [recordingUnit, setRecordingUnit] = useState<string>('minute');
  const [selectedCameras, setSelectedCameras] = useState<string[]>([]);
  const [disableCameraDuration, setDisableCameraDuration] = useState<string>('5');
  const [disableCameraUnit, setDisableCameraUnit] = useState<string>('minute');

  // Step 1 - Camera selection state
  const [isGlobal, setIsGlobal] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!id) {
        return;
      }

      setLoading(true);
      try {
        const [cameraData, profileData] = await Promise.all([
          getCameras(),
          getProfiles(),
        ]);

        if (!isMounted) {
          return;
        }

        setCameras(cameraData);
        setProfiles(profileData);
        if (profileData.length > 0) {
          setSelectedProfile(profileData[0].id);
        }

        if (isNew) {
          setRule((current) => ({ ...current, id: generateId() }));
          return;
        }

        const existing = await getRuleById(id);
        if (!isMounted) {
          return;
        }

        if (existing) {
          setRule(existing);
          setIsGlobal(existing.global || false);
          setStep(1);
        } else {
          Alert.alert('Not found', 'Rule not found, creating new.');
          setRule((current) => ({ ...current, id: generateId() }));
        }
      } catch {
        if (!isMounted) {
          return;
        }

        setCameras([]);
        setProfiles([]);
        Alert.alert('Load error', 'Failed to load rule editor data from the hub.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [id, isNew]);

  const handleNextStep = () => {
    if (step === 1) {
      if (!rule.name.trim()) {
        Alert.alert('Validation', 'Rule name is required');
        return;
      }
      if (!isGlobal && rule.cameras.length === 0) {
        Alert.alert('Validation', 'Please select cameras or enable global mode');
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

  const toggleCamera = (cameraId: string) => {
    setRule(r => {
      const cameras = r.cameras.includes(cameraId)
        ? r.cameras.filter(id => id !== cameraId)
        : [...r.cameras, cameraId];
      return { ...r, cameras };
    });
  };

  const toggleGlobal = () => {
    setIsGlobal(!isGlobal);
    if (!isGlobal) {
      // When enabling global, clear selected cameras and set global property
      setRule(r => ({ ...r, cameras: [], global: true }));
    } else {
      // When disabling global, unset global property
      setRule(r => ({ ...r, global: false }));
    }
  };

  const handlePreviousStep = () => {
    if (step > 1) {
      setStep((step - 1) as 1 | 2 | 3);
    }
  };

  const addTrigger = () => {
    if (selectedTriggerType === 'face_detected' && !selectedProfile) {
      Alert.alert('Validation', 'Select a profile for face-detected trigger.');
      return;
    }

    const newTrigger: RuleTrigger =
      selectedTriggerType === 'motion_detected'
        ? { type: 'motion_detected' }
        : selectedTriggerType === 'face_detected'
          ? { type: 'face_detected', profileId: selectedProfile, isExclusive: false }
          : selectedTriggerType === 'time_interval'
            ? { type: 'time_interval', interval: parseInt(timeInterval) || 5, unit: timeUnit as any }
            : { type: 'scheduled', days: scheduledDays, time: scheduledTime };

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
            ? { type: 'start_recording_clip', duration: parseInt(recordingDuration) || 5, unit: recordingUnit as any }
            : selectedActionType === 'tag_event_for_followup'
              ? { type: 'tag_event_for_followup' }
              : { type: 'disable_camera', cameraIds: selectedCameras.length > 0 ? selectedCameras : rule.cameras, duration: parseInt(disableCameraDuration) || 5, unit: disableCameraUnit as any, notification: true };

    setRule(r => ({
      ...r,
      actions: [...r.actions, newAction],
    }));
    setSelectedActionType('send_notification');
    setActionMessage('');
    setRecordingDuration('5');
    setRecordingUnit('minute');
    setSelectedCameras([]);
    setDisableCameraDuration('5');
    setDisableCameraUnit('minute');
  };

  const removeAction = (index: number) => {
    setRule(r => ({
      ...r,
      actions: r.actions.filter((_, i) => i !== index),
    }));
  };

  const save = async () => {
    const ruleToSave: Rule = {
      ...rule,
      global: isGlobal,
      cameras: isGlobal ? [] : rule.cameras,
    };

    if (!ruleToSave.name.trim()) {
      Alert.alert('Validation', 'Name is required');
      return;
    }
    if (ruleToSave.triggers.length === 0) {
      Alert.alert('Validation', 'At least one trigger is required');
      return;
    }
    if (ruleToSave.actions.length === 0) {
      Alert.alert('Validation', 'At least one action is required');
      return;
    }

    if (!isNew) {
      Alert.alert('Not supported', 'Rule updates are not supported by the current API.');
      return;
    }

    setSaving(true);
    try {
      await createRuleWithDetails({
        rule: ruleToSave,
      });
      router.back();
    } catch {
      Alert.alert('Save failed', 'Unable to save rule to the hub.');
    } finally {
      setSaving(false);
    }
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

              <Text style={styles.sectionTitle}>Camera Selection</Text>

              <TouchableOpacity 
                style={styles.checkbox}
                onPress={toggleGlobal}
              >
                <View style={[styles.checkboxBox, isGlobal && styles.checkboxBoxChecked]}>
                  {isGlobal && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Global (All Cameras)</Text>
              </TouchableOpacity>

              {!isGlobal && (
                <>
                  <View style={styles.cameraButtonGroup}>
                    {cameras.map(camera => (
                      <TouchableOpacity
                        key={camera.id}
                        style={[styles.cameraButton, rule.cameras.includes(camera.id) && styles.cameraButtonSelected]}
                        onPress={() => toggleCamera(camera.id)}
                      >
                        <Text style={[styles.cameraButtonText, rule.cameras.includes(camera.id) && styles.cameraButtonTextSelected]}>
                          {camera.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
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

              {selectedTriggerType === 'face_detected' && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Profile</Text>
                  <Dropdown
                    value={selectedProfile}
                    options={profiles.map(profile => ({
                      label: profile.displayName,
                      value: profile.id,
                    }))}
                    onChange={setSelectedProfile}
                  />
                </View>
              )}

              {selectedTriggerType === 'time_interval' && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Interval</Text>
                  <View style={styles.intervalRow}>
                    <Input
                      value={timeInterval}
                      onChangeText={setTimeInterval}
                      keyboardType="numeric"
                      placeholder="5"
                      containerStyle={styles.intervalInput}
                    />
                    <Dropdown
                      value={timeUnit}
                      options={TIME_UNITS}
                      onChange={setTimeUnit}
                      containerStyle={styles.intervalDropdown}
                    />
                  </View>
                </View>
              )}

              {selectedTriggerType === 'scheduled' && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Days</Text>
                  <View style={styles.daysRow}>
                    {days.map((day) => (
                      <TouchableOpacity
                        key={day}
                        style={[styles.dayButton, scheduledDays.includes(day) && styles.dayButtonActive]}
                        onPress={() => {
                          setScheduledDays(prev =>
                            prev.includes(day)
                              ? prev.filter(d => d !== day)
                              : [...prev, day]
                          );
                        }}
                      >
                        <Text style={[styles.dayButtonText, scheduledDays.includes(day) && styles.dayButtonTextActive]}>
                          {day.charAt(0)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={[styles.label, { marginTop: 16 }]}>Time</Text>
                  <Input
                    value={scheduledTime}
                    onChangeText={setScheduledTime}
                    placeholder="13:00"
                  />
                </View>
              )}

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
                        {trigger.type === 'face_detected' && `Face Detected - ${profiles.find(p => p.id === (trigger as any).profileId)?.displayName || 'Unknown'}`}
                        {trigger.type === 'time_interval' && `Every ${(trigger as any).interval} ${(trigger as any).unit}(s)`}
                        {trigger.type === 'scheduled' && `Scheduled - ${((trigger as any).days || []).join(', ')} at ${(trigger as any).time}`}
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

              {selectedActionType === 'start_recording_clip' && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Recording Duration</Text>
                  <View style={styles.intervalRow}>
                    <Input
                      value={recordingDuration}
                      onChangeText={setRecordingDuration}
                      placeholder="Duration"
                      style={styles.intervalInput}
                    />
                    <View style={styles.intervalDropdown}>
                      <Dropdown
                        value={recordingUnit}
                        options={TIME_UNITS}
                        onChange={setRecordingUnit}
                      />
                    </View>
                  </View>
                </View>
              )}

              {selectedActionType === 'disable_camera' && (
                <>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Select Cameras to Disable</Text>
                    <View style={styles.cameraButtonGroup}>
                      {cameras.map((camera) => (
                        <TouchableOpacity
                          key={camera.id}
                          style={[
                            styles.cameraButton,
                            selectedCameras.includes(camera.id) && styles.cameraButtonSelected,
                          ]}
                          onPress={() => {
                            setSelectedCameras(prev =>
                              prev.includes(camera.id)
                                ? prev.filter(id => id !== camera.id)
                                : [...prev, camera.id]
                            );
                          }}
                        >
                          <Text
                            style={[
                              styles.cameraButtonText,
                              selectedCameras.includes(camera.id) && styles.cameraButtonTextSelected,
                            ]}
                          >
                            {camera.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Disable Duration</Text>
                    <View style={styles.intervalRow}>
                      <Input
                        value={disableCameraDuration}
                        onChangeText={setDisableCameraDuration}
                        placeholder="Duration"
                        style={styles.intervalInput}
                      />
                      <View style={styles.intervalDropdown}>
                        <Dropdown
                          value={disableCameraUnit}
                          options={TIME_UNITS}
                          onChange={setDisableCameraUnit}
                        />
                      </View>
                    </View>
                  </View>
                </>
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
                        {action.type === 'start_recording_clip' && `Start Recording - ${(action as any).duration} ${(action as any).unit}(s)`}
                        {action.type === 'tag_event_for_followup' && 'Tag for Follow-up'}
                        {action.type === 'disable_camera' && `Disable Camera - ${(action as any).cameraIds.map((id: string) => cameras.find(c => c.id === id)?.name || id).join(', ')} for ${(action as any).duration} ${(action as any).unit}(s)`}
                      </Text>
                      <TouchableOpacity onPress={() => removeAction(idx)}>
                        <IconSymbol name="trash.fill" size={20} color={Colors.error} />
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
                onPress={() => void save()}
                variant="primary"
                loading={saving}
                disabled={saving}
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
    marginTop: 20,
    marginBottom: 12,
  },
  cameraButtonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  cameraButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  cameraButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  cameraButtonText: {
    fontSize: 13,
    color: Colors.textDark,
    fontWeight: '500',
  },
  cameraButtonTextSelected: {
    color: Colors.text,
    fontWeight: '600',
  },
  cameraListContent: {
    flex: 1,
  },
  cameraLocation: {
    fontSize: 12,
    color: Colors.textGray,
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
  intervalRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  intervalInput: {
    width: 80,
  },
  intervalDropdown: {
    flex: 1,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  dayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textGray,
  },
  dayButtonTextActive: {
    color: Colors.text,
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
