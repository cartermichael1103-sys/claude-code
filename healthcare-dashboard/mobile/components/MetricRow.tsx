import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../constants/theme";

type Status = "good" | "warning" | "danger" | "neutral";

interface MetricRowProps {
  label: string;
  value: string;
  benchmark?: string;
  status?: Status;
  icon?: keyof typeof Ionicons.glyphMap;
  sublabel?: string;
  showDivider?: boolean;
}

const statusColor: Record<Status, string> = {
  good: colors.success,
  warning: colors.warning,
  danger: colors.danger,
  neutral: colors.textSecondary,
};

export default function MetricRow({
  label,
  value,
  benchmark,
  status = "neutral",
  icon,
  sublabel,
  showDivider = true,
}: MetricRowProps) {
  const color = statusColor[status];

  return (
    <>
      <View style={styles.row}>
        <View style={styles.left}>
          {icon && (
            <Ionicons name={icon} size={14} color={color} style={styles.icon} />
          )}
          <View>
            <Text style={styles.label}>{label}</Text>
            {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
          </View>
        </View>
        <View style={styles.right}>
          <Text style={[styles.value, { color }]}>{value}</Text>
          {benchmark && (
            <Text style={styles.benchmark}>target: {benchmark}</Text>
          )}
        </View>
      </View>
      {showDivider && <View style={styles.divider} />}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: spacing.xs,
  },
  icon: {
    marginRight: 2,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  sublabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  right: {
    alignItems: "flex-end",
  },
  value: {
    fontSize: 15,
    fontWeight: "700",
  },
  benchmark: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
});
