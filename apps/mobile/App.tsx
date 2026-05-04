import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppTabs } from "./src/navigation/AppTabs";
import type { RootStackParamList } from "./src/navigation/types";
import { ArtworkViewerScreen } from "./src/screens/ArtworkViewerScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { opusNavTheme } from "./src/theme/opusTheme";
import { getOrCreateDeviceId } from "./src/security/deviceId";
import { pollAndWipeIfRevoked } from "./src/security/deviceStatusPoller";
import { AuthProvider, useAuth } from "./src/auth/AuthContext";

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigation() {
  const { auth } = useAuth();

  useEffect(() => {
    if (auth.status !== "authenticated") return;
    const apiBase = process.env["EXPO_PUBLIC_API_URL"] ?? "https://app.opus-store.com";
    void (async () => {
      const deviceId = await getOrCreateDeviceId();
      await pollAndWipeIfRevoked({ apiBase, userId: auth.user.id, deviceId });
    })();
  }, [auth]);

  if (auth.status === "loading") return null;

  if (auth.status === "unauthenticated") {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <LoginScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer theme={opusNavTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Tabs" component={AppTabs} />
          <Stack.Screen name="ArtworkViewer" component={ArtworkViewerScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RootNavigation />
    </AuthProvider>
  );
}
