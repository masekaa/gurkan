import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme';

/** Entry gate: route to the app when signed in, otherwise to the auth flow. */
export default function Index() {
  const { loading, profile } = useAuth();

  if (loading) {
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

  return <Redirect href={profile ? '/(tabs)' : '/(auth)/login'} />;
}
