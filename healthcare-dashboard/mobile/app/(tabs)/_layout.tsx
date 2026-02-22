import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet, Platform } from "react-native";
import { colors, borderRadius } from "../../constants/theme";

function TabIcon({
  name,
  color,
  size,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  size: number;
  focused: boolean;
}) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapFocused]}>
      <Ionicons name={name} size={size - 2} color={color} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="grid" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="census"
        options={{
          title: "Census",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="bed" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="revenue"
        options={{
          title: "Revenue",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="cash" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="labor"
        options={{
          title: "Labor",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="people" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="ar"
        options={{
          title: "AR",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              name="bar-chart"
              color={color}
              size={size}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="agent"
        options={{
          title: "AI Advisor",
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              name="sparkles"
              color={focused ? colors.secondary : color}
              size={size}
              focused={focused}
            />
          ),
          tabBarActiveTintColor: colors.secondary,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#0A1020",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: Platform.OS === "ios" ? 84 : 64,
    paddingBottom: Platform.OS === "ios" ? 24 : 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  tabItem: {
    paddingTop: 4,
  },
  iconWrap: {
    width: 32,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: borderRadius.sm,
  },
  iconWrapFocused: {
    backgroundColor: `${colors.primary}18`,
  },
});
