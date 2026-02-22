import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, borderRadius, spacing } from "../constants/theme";

interface Alert {
  type: "danger" | "warning" | "info";
  message: string;
  kpi: string;
}

interface AlertBannerProps {
  alerts: Alert[];
}

const alertConfig = {
  danger: { color: colors.danger, bg: "#2A000D", icon: "alert-circle" as const },
  warning: { color: colors.warning, bg: "#2A1800", icon: "warning" as const },
  info: { color: colors.info, bg: "#001A2A", icon: "information-circle" as const },
};

export default function AlertBanner({ alerts }: AlertBannerProps) {
  if (!alerts.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {alerts.map((alert, i) => {
        const cfg = alertConfig[alert.type];
        return (
          <View
            key={i}
            style={[
              styles.alert,
              { backgroundColor: cfg.bg, borderColor: `${cfg.color}40` },
            ]}
          >
            <Ionicons name={cfg.icon} size={14} color={cfg.color} />
            <View style={styles.textWrap}>
              <Text style={[styles.kpiTag, { color: cfg.color }]}>{alert.kpi}</Text>
              <Text style={styles.message} numberOfLines={2}>
                {alert.message}
              </Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  alert: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    maxWidth: 280,
  },
  textWrap: {
    flex: 1,
  },
  kpiTag: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});
