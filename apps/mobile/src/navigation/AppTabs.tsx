"use client";

import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { TabParamList } from "./types";
import { opusColors } from "../theme/opusTheme";
import { HomeScreen } from "../screens/HomeScreen";
import { MarketScreen } from "../screens/MarketScreen";
import { VaultScreen } from "../screens/VaultScreen";
import { ProfileScreen } from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator<TabParamList>();

export function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: opusColors.charcoal,
          borderTopColor: "rgba(246, 244, 240, 0.08)",
        },
        tabBarActiveTintColor: opusColors.gold,
        tabBarInactiveTintColor: "rgba(246, 244, 240, 0.55)",
        tabBarLabelStyle: { fontSize: 10, letterSpacing: 0.3, paddingBottom: 2 },
        tabBarIcon: ({ color, size }) => {
          const icon =
            route.name === "Home"
              ? "home"
              : route.name === "Market"
                ? "grid-outline"
                : route.name === "Vault"
                  ? "albums-outline"
                  : "person-outline";
          return <Ionicons name={icon} size={Math.max(20, size)} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Market" component={MarketScreen} />
      <Tab.Screen name="Vault" component={VaultScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

