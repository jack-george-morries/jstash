import React, { useEffect, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";
import { GalleryScreen } from "@screens/GalleryScreen";

// Keep splash screen visible while we load resources
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const App: React.FC = () => {
  useEffect(() => {
    // Simulate app initialization (cache, database, etc.)
    const prepare = async () => {
      try {
        // Small delay to show splash screen (optional)
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      }
    };

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    // Hide splash screen once the root view has laid out
    await SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaView style={styles.container}>
          <GalleryScreen />
          <StatusBar style="auto" />
        </SafeAreaView>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});

export default App;
