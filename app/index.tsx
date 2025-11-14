import { Redirect } from 'expo-router';

export default function Index() {
  // here lets check if user authed? -> redirect to /(tabs)
  return <Redirect href="/sign-in" />;
}
