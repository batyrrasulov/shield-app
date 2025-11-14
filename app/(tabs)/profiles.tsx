import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Input } from '@/components/ui/input';
import { Colors } from '@/constants/theme';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MOCK_PROFILES = [
  { id: '1', name: 'Person 1', description: 'Description' },
  { id: '2', name: 'Person 2', description: 'Description' },
  { id: '3', name: 'Kevin', description: 'Known visitor' },
  { id: '4', name: 'Sarah', description: 'Family member' },
  { id: '5', name: 'Unknown', description: 'Detected 3 times' },
];

export default function ProfilesScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProfiles = MOCK_PROFILES.filter(profile =>
    profile.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <IconSymbol name="magnifyingglass" size={20} color={Colors.textGray} />
          <Input
            placeholder="Search for a profile"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            containerStyle={styles.searchInputContainer}
          />
          <IconSymbol name="line.3.horizontal.decrease" size={20} color={Colors.textGray} />
        </View>
      </View>

      <FlatList
        data={filteredProfiles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push('/profile-detail')}>
            <Card variant="lavender" style={styles.profileCard}>
              <View style={styles.profileContent}>
                <Avatar name={item.name} size={50} />
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{item.name}</Text>
                  <Text style={styles.profileDescription}>{item.description}</Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    marginBottom: 0,
  },
  searchInput: {
    borderWidth: 0,
    padding: 0,
    marginBottom: 0,
  },
  list: {
    padding: 20,
    gap: 12,
  },
  profileCard: {
    marginBottom: 0,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: 4,
  },
  profileDescription: {
    fontSize: 14,
    color: Colors.textGray,
  },
});
