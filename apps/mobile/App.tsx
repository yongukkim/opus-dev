import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import {
  Cinzel_400Regular,
  Cinzel_600SemiBold,
  Cinzel_700Bold,
} from "@expo-google-fonts/cinzel";
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from "@expo-google-fonts/jetbrains-mono";
import { AppTabs } from "./src/navigation/AppTabs";
import type { RootStackParamList } from "./src/navigation/types";
import { ArtworkViewerScreen } from "./src/screens/ArtworkViewerScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { opusNavTheme, opusColors } from "./src/theme/opusTheme";
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

  if (auth.status === "loading") {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: opusColors.charcoal,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={opusColors.gold} />
      </View>
    );
  }

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
  const [fontsLoaded] = useFonts({
    Cinzel_400Regular,
    Cinzel_600SemiBold,
    Cinzel_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: opusColors.charcoal }} />;
  }

  return (
    <AuthProvider>
      <RootNavigation />
    </AuthProvider>
  );
}
