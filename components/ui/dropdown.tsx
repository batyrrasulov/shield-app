import { Colors } from '@/constants/theme';
import React, { useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { IconSymbol } from './icon-symbol';

interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  label?: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  containerStyle?: ViewStyle;
}

export function Dropdown({ 
  label, 
  value, 
  options, 
  onChange, 
  placeholder = 'Select...',
  containerStyle 
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.selectorText, !selectedOption && styles.placeholder]}>
          {selectedOption?.label || placeholder}
        </Text>
        <IconSymbol name="chevron.down" size={20} color={Colors.textGray} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.modalContent}>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    item.value === value && styles.optionSelected
                  ]}
                  onPress={() => {
                    onChange(item.value);
                    setIsOpen(false);
                  }}
                >
                  <Text style={[
                    styles.optionText,
                    item.value === value && styles.optionTextSelected
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textDark,
    marginBottom: 8,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectorText: {
    fontSize: 16,
    color: Colors.textDark,
  },
  placeholder: {
    color: Colors.disabled,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    width: '80%',
    maxHeight: '60%',
    overflow: 'hidden',
  },
  option: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionSelected: {
    backgroundColor: Colors.accent,
  },
  optionText: {
    fontSize: 16,
    color: Colors.textDark,
  },
  optionTextSelected: {
    fontWeight: '600',
    color: Colors.primary,
  },
});
