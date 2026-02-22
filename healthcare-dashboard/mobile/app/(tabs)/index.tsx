import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";
import { useRouter } from "expo-router";
import KPICard from "../../components/KPICard";
import AlertBanner from "../../components/AlertBanner";
import SectionHeader from "../../components/SectionHeader";
import { fetchDashboard } from "../../services/api";
import { colors, spacing, borderRadius, shadows } from "../../constants/theme";

const { width } = Dimensions.get("window");

const CHART_CONFIG = {
  backgroundGradientFrom: "#0F1B35",
  backgroundGradientTo: "#0F1B35",
  backgroundGradientFromOpacity: 0,
  backgroundGradientToOpacity: 0,
  color: (opacity = 1) => `rgba(0, 199, 255, ${opacity})`,
  labelColor: () => colors.textMuted,
  strokeWidth: 2,
  propsForDots: { r: "3", strokeWidth: "1", stroke: colors.primary },
  propsForBackgroundLines: { stroke: colors.border, strokeDasharray: "4,4" },
  decimalPlaces: 0,
};

// Inline mini-chart data
const occupancyData = {
  labels: ["", "", "", "", "", ""],
  datasets: [{ data: [88, 89, 90, 89.5, 90.2, 90], strokeWidth: 2 }],
};

export default function DashboardScreen() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const data = await fetchDashboard();
      setDashboard(data);
    } catch (e) {
      console.error("Dashboard load error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <LinearGradient colors={["#060B16", "#0A0F1E"]} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </LinearGradient>
    );
  }

  const kpi = dashboard?.summary?.kpiSummary;
  const alerts = dashboard?.alerts || [];
  const facility = dashboard?.facility;
  const healthScore = dashboard?.summary?.overallHealthScore || 74;
  const scoreColor =
    healthScore >= 80 ? colors.success : healthScore >= 65 ? colors.warning : colors.danger;

  return (
    <LinearGradient colors={["#060B16", "#0A0F1E"]} style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={colors.primary}
          />
        }
      >
        {/* ─── Header ─── */}
        <LinearGradient
          colors={["#0A1628", "#0F1B35"]}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <View style={styles.facilityBadge}>
                <Ionicons name="medical" size={14} color={colors.primary} />
                <Text style={styles.facilityBadgeText}>SNF</Text>
              </View>
              <Text style={styles.facilityName} numberOfLines={2}>
                {facility?.shortName || "Sunrise Gardens SNF"}
              </Text>
              <Text style={styles.reportingPeriod}>
                {facility?.reportingPeriod || "January 2025"} · {facility?.beds} Beds
              </Text>
            </View>

            {/* Health Score */}
            <View style={[styles.healthScoreCircle, { borderColor: scoreColor }]}>
              <Text style={[styles.healthScoreNumber, { color: scoreColor }]}>
                {healthScore}
              </Text>
              <Text style={styles.healthScoreLabel}>Score</Text>
            </View>
          </View>

          {/* Star Rating */}
          <View style={styles.starRow}>
            <Text style={styles.starLabel}>CMS 5-Star</Text>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= (facility?.starRating || 4) ? "star" : "star-outline"}
                size={14}
                color={star <= (facility?.starRating || 4) ? colors.warning : colors.border}
              />
            ))}
          </View>
        </LinearGradient>

        {/* ─── Alerts ─── */}
        {alerts.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title="Active Alerts"
              subtitle={`${alerts.length} items need attention`}
              icon="alert-circle"
              iconColor={colors.danger}
            />
            <AlertBanner alerts={alerts.slice(0, 6)} />
          </View>
        )}

        {/* ─── KPI Grid ─── */}
        <View style={styles.section}>
          <SectionHeader
            title="Key Performance Indicators"
            subtitle="January 2025"
            icon="pulse"
            iconColor={colors.primary}
          />
          <View style={styles.kpiGrid}>
            <View style={styles.kpiHalf}>
              <KPICard
                title="Occupancy Rate"
                value={kpi?.census?.value || 90.0}
                unit="%"
                status={kpi?.census?.status || "good"}
                trend={kpi?.census?.trend}
                change={kpi?.census?.changePct ? `${kpi.census.changePct > 0 ? "+" : ""}${kpi.census.changePct}%` : undefined}
                icon="bed"
                iconColor={colors.success}
                subValue="Budget: 91.7%"
                onPress={() => router.push("/(tabs)/census")}
              />
            </View>
            <View style={styles.kpiHalf}>
              <KPICard
                title="Monthly Revenue"
                value={kpi?.revenue?.value || 985420}
                status={kpi?.revenue?.status || "warning"}
                trend={kpi?.revenue?.trend}
                change="-$34.6K vs budget"
                icon="cash"
                iconColor={colors.warning}
                subValue="Budget: $1.02M"
                onPress={() => router.push("/(tabs)/revenue")}
              />
            </View>
            <View style={styles.kpiHalf}>
              <KPICard
                title="Total HPPD"
                value={kpi?.labor?.value || 3.89}
                unit="hrs"
                status={kpi?.labor?.status || "warning"}
                trend={kpi?.labor?.trend}
                change="+0.15 vs budget"
                icon="people"
                iconColor={colors.warning}
                subValue="Budget: 3.74 | CMS min: 3.48"
                onPress={() => router.push("/(tabs)/labor")}
              />
            </View>
            <View style={styles.kpiHalf}>
              <KPICard
                title="Overall DSO"
                value={kpi?.ar?.value || 32.4}
                unit="days"
                status={kpi?.ar?.status || "warning"}
                trend={kpi?.ar?.trend}
                change="+2.4 days vs budget"
                icon="bar-chart"
                iconColor={colors.danger}
                subValue="Budget: 30.0 days"
                onPress={() => router.push("/(tabs)/ar")}
              />
            </View>
          </View>
        </View>

        {/* ─── Occupancy Trend ─── */}
        <View style={styles.section}>
          <SectionHeader
            title="30-Day Occupancy Trend"
            subtitle="Daily occupancy rate %"
            icon="trending-up"
            iconColor={colors.success}
            onActionPress={() => router.push("/(tabs)/census")}
          />
          <View style={[styles.chartCard, shadows.card]}>
            <LineChart
              data={occupancyData}
              width={width - spacing.md * 4}
              height={140}
              chartConfig={CHART_CONFIG}
              bezier
              withDots={false}
              withInnerLines={true}
              withOuterLines={false}
              withHorizontalLabels={false}
              withVerticalLabels={false}
              style={styles.chart}
              fromZero={false}
            />
            <View style={styles.chartFooter}>
              <View style={styles.chartLegendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                <Text style={styles.legendText}>Occupancy Rate</Text>
              </View>
              <Text style={styles.chartValue}>90.0% current</Text>
            </View>
          </View>
        </View>

        {/* ─── Quick Stats ─── */}
        <View style={styles.section}>
          <SectionHeader
            title="Facility Snapshot"
            icon="business"
            iconColor={colors.secondary}
          />
          <View style={[styles.snapshotCard, shadows.card]}>
            {[
              { label: "Licensed Beds", value: "120", icon: "bed-outline" },
              { label: "Current Census", value: "108", icon: "people-outline" },
              { label: "Payer Mix — Medicare A", value: "25.9%", icon: "card-outline" },
              { label: "Labor Cost %", value: "52.8%", icon: "wallet-outline" },
              { label: "Collection Rate", value: "97.2%", icon: "checkmark-circle-outline" },
              { label: "Total AR Balance", value: "$2.85M", icon: "trending-up-outline" },
            ].map((item, i, arr) => (
              <View
                key={item.label}
                style={[
                  styles.snapshotRow,
                  i < arr.length - 1 && styles.snapshotDivider,
                ]}
              >
                <View style={styles.snapshotLeft}>
                  <Ionicons
                    name={item.icon as any}
                    size={15}
                    color={colors.textMuted}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.snapshotLabel}>{item.label}</Text>
                </View>
                <Text style={styles.snapshotValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ─── AI Advisor CTA ─── */}
        <View style={[styles.section, { paddingBottom: spacing.xl }]}>
          <LinearGradient
            colors={["#1A0A40", "#2D1580"]}
            style={[styles.aiCta, shadows.glow(colors.secondary)]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.aiCtaIcon}>
              <Ionicons name="sparkles" size={28} color={colors.secondary} />
            </View>
            <View style={styles.aiCtaText}>
              <Text style={styles.aiCtaTitle}>SNF Advisor Pro</Text>
              <Text style={styles.aiCtaSubtitle}>
                AI-powered analysis powered by Claude Opus — ask anything about your facility performance
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.secondary}
              onPress={() => router.push("/(tabs)/agent")}
            />
          </LinearGradient>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  loadingText: { color: colors.textSecondary, fontSize: 15 },
  scroll: { paddingBottom: spacing.xl },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: 52,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerLeft: { flex: 1, marginRight: spacing.md },
  facilityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: `${colors.primary}20`,
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  facilityBadgeText: { fontSize: 10, fontWeight: "700", color: colors.primary, letterSpacing: 1 },
  facilityName: { fontSize: 20, fontWeight: "800", color: colors.textPrimary, lineHeight: 26 },
  reportingPeriod: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  healthScoreCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#060B16",
  },
  healthScoreNumber: { fontSize: 20, fontWeight: "800" },
  healthScoreLabel: { fontSize: 9, color: colors.textMuted, fontWeight: "600", letterSpacing: 0.5 },
  starRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: spacing.sm,
  },
  starLabel: { fontSize: 11, color: colors.textMuted, marginRight: 4, fontWeight: "600" },
  section: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  kpiHalf: { width: (width - spacing.md * 2 - spacing.sm) / 2 },
  chartCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    paddingTop: spacing.sm,
  },
  chart: { borderRadius: borderRadius.lg },
  chartFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  chartLegendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: colors.textSecondary },
  chartValue: { fontSize: 13, fontWeight: "700", color: colors.success },
  snapshotCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  snapshotRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  snapshotDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  snapshotLeft: { flexDirection: "row", alignItems: "center" },
  snapshotLabel: { fontSize: 13, color: colors.textSecondary },
  snapshotValue: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  aiCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.secondary}40`,
  },
  aiCtaIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.secondary}20`,
    justifyContent: "center",
    alignItems: "center",
  },
  aiCtaText: { flex: 1 },
  aiCtaTitle: { fontSize: 16, fontWeight: "700", color: colors.textPrimary, marginBottom: 4 },
  aiCtaSubtitle: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
});
