import { getProfiles } from '@/api/hub';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Input } from '@/components/ui/input';
import { Colors } from '@/constants/theme';
import { Profile } from '@/types';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfilesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadProfiles = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await getProfiles();
      setProfiles(data);
    } catch {
      setProfiles([]);
      setLoadError('Failed to load profiles from the hub.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadProfiles();
    }, [loadProfiles]),
  );

  const filteredProfiles = useMemo(
    () =>
      profiles.filter((profile) =>
        profile.displayName.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [profiles, searchQuery],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Profiles</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/profile/add')}>
          <IconSymbol name="plus" size={18} color={Colors.text} />
          <Text style={styles.addButtonText}>Add Profile</Text>
        </TouchableOpacity>
      </View>

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
          <TouchableOpacity onPress={() => router.push(`../profile/${item.id}`)}>
            <Card variant="lavender" style={styles.profileCard}>
              <View style={styles.profileContent}>
                <Avatar name={item.displayName} size={50} />
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{item.displayName}</Text>
                  {item.description ? (
                    <Text style={styles.profileDescription}>{item.description}</Text>
                  ) : null}
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {isLoading ? 'Loading profiles...' : 'No profiles found.'}
          </Text>
        }
      />
      {loadError ? <Text style={styles.errorText}>{loadError}</Text> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerRow: {
    padding: 20,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButtonText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600',
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
  emptyText: {
    color: Colors.textGray,
    textAlign: 'center',
    marginTop: 20,
  },
  errorText: {
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 16,
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
