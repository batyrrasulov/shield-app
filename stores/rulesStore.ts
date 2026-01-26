import { Rule } from '@/types';

// Shared mock store for rules - accessible from any component
export const MOCK_RULES: Rule[] = [
  {
    id: '01',
    name: 'Motion Alert',
    description: 'Alert for any motion',
    cameras: ["01", "02"],
    triggers: [{ type: 'motion_detected' }],
    actions: [{ type: 'send_notification', message: 'Alert Alert!' }],
    enabled: true,
  },
  {
    id: '02',
    name: 'Internal Recording',
    description: 'Record every 10 minutes',
    cameras: [],
    triggers: [{ type: 'time_interval', interval: 10, unit: 'minute' }],
    actions: [{ type: 'start_recording_clip', duration: 1, unit: 'minute' }],
    enabled: true,
    global: true
  },
];

export const addRule = (rule: Rule) => {
  MOCK_RULES.push(rule);
};

export const updateRule = (rule: Rule) => {
  const index = MOCK_RULES.findIndex(r => r.id === rule.id);
  if (index !== -1) {
    MOCK_RULES[index] = rule;
  }
};

export const getRuleById = (id: string) => {
  return MOCK_RULES.find(r => r.id === id);
};

export const deleteRule = (id: string) => {
  const index = MOCK_RULES.findIndex(r => r.id === id);
  if (index !== -1) {
    MOCK_RULES.splice(index, 1);
  }
};
