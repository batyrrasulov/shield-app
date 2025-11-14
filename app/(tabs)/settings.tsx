import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const handleLogOut = () => {
    router.replace('/sign-in');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>
        
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>System Status</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Hub Status</Text>
            <Text style={styles.value}>Online</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Storage</Text>
            <Text style={styles.value}>45 GB / 128 GB</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Cameras Online</Text>
            <Text style={styles.value}>3 / 3</Text>
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Language</Text>
            <Text style={styles.value}>English</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Notifications</Text>
            <Text style={styles.value}>Enabled</Text>
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Role</Text>
            <Text style={styles.value}>Owner</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Version</Text>
            <Text style={styles.value}>1.0.0</Text>
          </View>
        </Card>

        <Button
          title="Log Out"
          onPress={handleLogOut}
          variant="outline"
          style={styles.logoutButton}
          textStyle={styles.logoutText}
        />
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
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 24,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  label: {
    fontSize: 15,
    color: Colors.textDark,
  },
  value: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textGray,
  },
  logoutButton: {
    marginTop: 24,
    backgroundColor: '#CD7672',
    borderWidth: 0,
  },
  logoutText: {
    color: '#FFFFFF',
  },
});
