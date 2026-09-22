import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useStore } from './src/store/useStore';
import Onboarding from './app/Onboarding';
import AppLayout from './app/_layout';

export default function App() {
  const { init, setupComplete, loaded } = useStore();

  useEffect(() => {
    init();
  }, [init]);

  if (!loaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (!setupComplete) {
    return <Onboarding />;
  }

  return <AppLayout />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafbfc',
  },
});
