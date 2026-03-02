import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useHubConnection } from '@/api/hub-connection';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useIsAuthenticated } from '@/stores/sessionStore';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isAuthenticated = useIsAuthenticated();
  const hubConnection = useHubConnection();
  const hasHubConnection = hubConnection !== null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="index" />
          <Stack.Screen name="sign-in" />
        </Stack.Protected>

        <Stack.Protected guard={isAuthenticated && !hasHubConnection}>
          <Stack.Screen name="hub-discovery" />
        </Stack.Protected>

        <Stack.Protected guard={isAuthenticated && hasHubConnection}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          <Stack.Screen name="playback" />
          <Stack.Screen name="playback/[id]" />
          <Stack.Screen name="profile/add" />
          <Stack.Screen name="profile/[id]" />
          <Stack.Screen name="enroll/[id]" />
          <Stack.Screen name="sightings/[id]" />
          <Stack.Screen name="rule/[id]" />
        </Stack.Protected>
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
