import { Colors } from '@/constants/theme';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'lavender';
}

export function Card({ children, style, variant = 'default' }: CardProps) {
  return (
    <View style={[
      styles.card,
      variant === 'lavender' && styles.cardLavender,
      style
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    elevation: 3,
  },
  cardLavender: {
    backgroundColor: Colors.accent,
  },
});
