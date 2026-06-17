import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { hasSeenOnboarding } from '@/lib/onboarding';
import { colors } from '@/theme';

/** Entry gate: onboarding (first launch) -> app (guests browse without login). */
export default function Index() {
  const { loading, profile } = useAuth();
  const [seenOnboarding, setSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    void hasSeenOnboarding().then(setSeenOnboarding);
  }, []);

  if (loading || seenOnboarding === null) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  if (profile) return <Redirect href="/(tabs)" />;
  if (!seenOnboarding) return <Redirect href="/onboarding" />;
  // Guests may browse freely (App Store 5.1.1): land in the app, not login.
  return <Redirect href="/(tabs)" />;
}
