import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, borderRadius, spacing, shadows } from "../constants/theme";

type Status = "good" | "warning" | "danger" | "neutral";
type Trend = "up" | "down" | "flat";

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  subValue?: string;
  status: Status;
  trend?: Trend;
  change?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  onPress?: () => void;
  compact?: boolean;
}

const statusConfig: Record<Status, { color: string; gradient: readonly [string, string]; label: string }> = {
  good: { color: colors.success, gradient: ["#003D2A", "#00966A"] as const, label: "On Track" },
  warning: { color: colors.warning, gradient: ["#3D2A00", "#B07820"] as const, label: "Attention" },
  danger: { color: colors.danger, gradient: ["#3D0015", "#A83050"] as const, label: "Critical" },
  neutral: { color: colors.primary, gradient: ["#003040", "#0085AA"] as const, label: "Info" },
};

export default function KPICard({
  title,
  value,
  unit,
  subValue,
  status,
  trend,
  change,
  icon,
  iconColor,
  onPress,
  compact = false,
}: KPICardProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    if (status === "danger") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [status]);

  const cfg = statusConfig[status];
  const trendIcon = trend === "up" ? "trending-up" : trend === "down" ? "trending-down" : "remove";
  const trendColor =
    trend === "up" ? colors.success : trend === "down" ? colors.danger : colors.textMuted;

  const displayValue =
    typeof value === "number"
      ? value >= 1000000
        ? `$${(value / 1000000).toFixed(2)}M`
        : value >= 1000
        ? `$${(value / 1000).toFixed(0)}K`
        : value % 1 === 0
        ? value.toString()
        : value.toFixed(1)
      : value;

  return (
    <Animated.View style={[{ opacity: fadeAnim, transform: [{ scale: pulseAnim }] }]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} disabled={!onPress}>
        <LinearGradient
          colors={["#0F1B35", "#162040"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.card, compact && styles.cardCompact, shadows.card]}
        >
          {/* Status accent line */}
          <View style={[styles.accentLine, { backgroundColor: cfg.color }]} />

          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: `${iconColor || cfg.color}20` }]}>
              <Ionicons
                name={icon}
                size={compact ? 18 : 22}
                color={iconColor || cfg.color}
              />
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${cfg.color}20`, borderColor: `${cfg.color}40` }]}>
              <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
              <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={1}>
            {title}
          </Text>

          {/* Value */}
          <View style={styles.valueRow}>
            <Text style={[styles.value, compact && styles.valueCompact]}>
              {displayValue}
            </Text>
            {unit && (
              <Text style={[styles.unit, compact && styles.unitCompact]}>{unit}</Text>
            )}
          </View>

          {/* Sub value & trend */}
          <View style={styles.footer}>
            {subValue && (
              <Text style={styles.subValue} numberOfLines={1}>
                {subValue}
              </Text>
            )}
            {change && trend && (
              <View style={styles.trendRow}>
                <Ionicons name={trendIcon} size={12} color={trendColor} />
                <Text style={[styles.change, { color: trendColor }]}>{change}</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    position: "relative",
  },
  cardCompact: {
    padding: spacing.sm + 4,
  },
  accentLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  titleCompact: {
    fontSize: 11,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  valueCompact: {
    fontSize: 22,
  },
  unit: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "600",
    marginBottom: 4,
  },
  unitCompact: {
    fontSize: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subValue: {
    fontSize: 11,
    color: colors.textMuted,
    flex: 1,
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  change: {
    fontSize: 11,
    fontWeight: "600",
  },
});
