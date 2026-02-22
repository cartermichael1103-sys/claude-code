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
import { BarChart, LineChart } from "react-native-chart-kit";
import SectionHeader from "../../components/SectionHeader";
import MetricRow from "../../components/MetricRow";
import AlertBanner from "../../components/AlertBanner";
import { fetchAR } from "../../services/api";
import { colors, spacing, borderRadius, shadows } from "../../constants/theme";

const { width } = Dimensions.get("window");
const CHART_W = width - spacing.md * 2;

const LINE_CONFIG = {
  backgroundGradientFrom: "#0F1B35",
  backgroundGradientTo: "#0F1B35",
  backgroundGradientFromOpacity: 0,
  backgroundGradientToOpacity: 0,
  color: (opacity = 1) => `rgba(123, 97, 255, ${opacity})`,
  labelColor: () => colors.textMuted,
  strokeWidth: 2,
  propsForDots: { r: "2", strokeWidth: "1", stroke: colors.secondary },
  propsForBackgroundLines: { stroke: colors.border, strokeDasharray: "3,3" },
  decimalPlaces: 1,
};

const AGING_CONFIG = {
  ...LINE_CONFIG,
  color: (opacity = 1) => `rgba(0, 199, 255, ${opacity})`,
};

export default function ARScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const d = await fetchAR();
      setData(d);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  if (loading || !data) {
    return (
      <LinearGradient colors={["#060B16", "#0A0F1E"]} style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </LinearGradient>
    );
  }

  const { summary, dsoPayer, aging, denials, dsoTrend, monthLabels, collectionsTrend, alerts } = data;

  const dsoTrendDataset = {
    labels: monthLabels,
    datasets: [{ data: dsoTrend, strokeWidth: 2 }],
  };

  const agingBarData = {
    labels: ["0-30", "31-60", "61-90", "91-120", "120+"],
    datasets: [{
      data: [
        aging.current.amount / 1000,
        aging.thirtyToSixty.amount / 1000,
        aging.sixtyToNinety.amount / 1000,
        aging.ninetyToOneTwenty.amount / 1000,
        aging.overOneTwenty.amount / 1000,
      ],
    }],
  };

  const formatMoney = (v: number) =>
    v >= 1000000 ? `$${(v / 1000000).toFixed(2)}M` : `$${(v / 1000).toFixed(0)}K`;

  const dsoStatus = (payer: any) =>
    payer.dso > payer.budget * 1.1 ? "danger" : payer.dso > payer.budget ? "warning" : "good";

  return (
    <LinearGradient colors={["#060B16", "#0A0F1E"]} style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
      >
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>AR & Collections</Text>
          <Text style={styles.pageSubtitle}>Accounts Receivable</Text>
        </View>

        {alerts?.length > 0 && (
          <View style={styles.alertsSection}>
            <AlertBanner alerts={alerts} />
          </View>
        )}

        {/* AR Hero */}
        <View style={styles.section}>
          <LinearGradient
            colors={["#1A0A40", "#4E3EA8"]}
            style={[styles.heroCard, shadows.glow(colors.secondary)]}
          >
            <Text style={styles.heroLabel}>TOTAL AR BALANCE</Text>
            <Text style={styles.heroValue}>{formatMoney(summary.totalARBalance)}</Text>
            <View style={styles.heroRow}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatLabel}>DSO</Text>
                <Text style={[styles.heroStatValue, { color: summary.overallDSO > summary.budgetDSO ? "#FFD580" : "#A8FFD8" }]}>
                  {summary.overallDSO} days
                </Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatLabel}>Budget DSO</Text>
                <Text style={styles.heroStatValue}>{summary.budgetDSO} days</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatLabel}>Collection%</Text>
                <Text style={[styles.heroStatValue, { color: summary.collectionRate >= 97 ? "#A8FFD8" : "#FFD580" }]}>
                  {summary.collectionRate}%
                </Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatLabel}>Bad Debt%</Text>
                <Text style={[styles.heroStatValue, { color: summary.badDebtPct > 2 ? "#FFD580" : "#A8FFD8" }]}>
                  {summary.badDebtPct}%
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* DSO by Payer */}
        <View style={styles.section}>
          <SectionHeader title="DSO by Payer" subtitle="Days Sales Outstanding" icon="time" iconColor={colors.secondary} />
          <View style={[styles.card, shadows.card]}>
            {[
              { label: "Medicare Part A", data: dsoPayer.medicarePartA, target: 18 },
              { label: "Medicaid", data: dsoPayer.medicaid, target: 45 },
              { label: "Private Pay", data: dsoPayer.privatePay, target: 55 },
              { label: "Managed Care", data: dsoPayer.managedCare, target: 35 },
            ].map((item, i, arr) => (
              <View key={item.label} style={[styles.dsoRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <View style={styles.dsoLeft}>
                  <Text style={styles.dsoLabel}>{item.label}</Text>
                  <Text style={styles.dsoBalance}>{formatMoney(item.data.balance)}</Text>
                </View>
                <View style={styles.dsoRight}>
                  <Text style={[
                    styles.dsoValue,
                    { color: item.data.dso > item.target * 1.1 ? colors.danger : item.data.dso > item.target ? colors.warning : colors.success }
                  ]}>
                    {item.data.dso.toFixed(1)} days
                  </Text>
                  <Text style={styles.dsoTarget}>target: {item.target} days</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* DSO 12-Month Trend */}
        <View style={styles.section}>
          <SectionHeader title="DSO Trend" subtitle="12-month overall DSO" icon="trending-up" iconColor={colors.secondary} />
          <View style={[styles.chartCard, shadows.card]}>
            <LineChart
              data={dsoTrendDataset}
              width={CHART_W - 16}
              height={150}
              chartConfig={LINE_CONFIG}
              bezier
              withDots={false}
              withInnerLines
              withOuterLines={false}
              style={styles.chart}
              fromZero={false}
              formatYLabel={(v) => `${v}d`}
            />
          </View>
        </View>

        {/* Aging Buckets */}
        <View style={styles.section}>
          <SectionHeader title="AR Aging Buckets" subtitle="Balance in $K by age" icon="bar-chart" iconColor={colors.primary} />
          <View style={[styles.chartCard, shadows.card]}>
            <BarChart
              data={agingBarData}
              width={CHART_W - 16}
              height={180}
              chartConfig={AGING_CONFIG}
              style={styles.chart}
              fromZero
              showValuesOnTopOfBars
              yAxisLabel="$"
              yAxisSuffix="K"
            />
          </View>
        </View>

        {/* Aging Detail */}
        <View style={styles.section}>
          <SectionHeader title="Aging Detail" icon="list" iconColor={colors.textSecondary} />
          <View style={[styles.card, shadows.card]}>
            {[
              { bucket: aging.current, status: "good" as const },
              { bucket: aging.thirtyToSixty, status: "neutral" as const },
              { bucket: aging.sixtyToNinety, status: "warning" as const },
              { bucket: aging.ninetyToOneTwenty, status: "danger" as const },
              { bucket: aging.overOneTwenty, status: "danger" as const },
            ].map((item, i, arr) => (
              <View key={item.bucket.label} style={[styles.agingRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <View style={styles.agingBar}>
                  <View style={[styles.agingFill, {
                    width: `${item.bucket.pct}%`,
                    backgroundColor:
                      item.status === "good" ? colors.success :
                      item.status === "warning" ? colors.warning : colors.danger,
                  }]} />
                </View>
                <Text style={styles.agingLabel}>{item.bucket.label}</Text>
                <Text style={styles.agingAmt}>{formatMoney(item.bucket.amount)}</Text>
                <Text style={[styles.agingPct, {
                  color:
                    item.status === "good" ? colors.success :
                    item.status === "warning" ? colors.warning : colors.danger,
                }]}>
                  {item.bucket.pct.toFixed(1)}%
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Denials */}
        <View style={[styles.section, { paddingBottom: spacing.xxl }]}>
          <SectionHeader title="Denial Management" subtitle="MTD claim denials" icon="close-circle" iconColor={colors.danger} />
          <View style={[styles.card, shadows.card]}>
            <MetricRow label="Total Denials MTD" value={denials.totalDeniedThisMonth.toString()} sublabel={`$${(denials.totalDeniedAmount / 1000).toFixed(1)}K denied`} status="warning" />
            <MetricRow label="Denial Rate" value={`${denials.denialRate}%`} benchmark="<3% target" status={denials.denialRate > 5 ? "danger" : "warning"} />
            <MetricRow label="Overturn/Appeal Rate" value={`${denials.overturnedRate}%`} benchmark=">70% target" status={denials.overturnedRate >= 70 ? "good" : "warning"} />
            <View style={styles.denialReasons}>
              <Text style={styles.denialReasonsTitle}>Top Denial Reasons</Text>
              {denials.topDenialReasons.map((reason: any, i: number) => (
                <View key={reason.reason} style={styles.denialRow}>
                  <Text style={styles.denialRank}>{i + 1}.</Text>
                  <Text style={styles.denialReason}>{reason.reason}</Text>
                  <Text style={styles.denialCount}>{reason.count} claims</Text>
                  <Text style={styles.denialAmt}>${(reason.amount / 1000).toFixed(1)}K</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { paddingBottom: spacing.xl },
  pageHeader: { paddingHorizontal: spacing.md, paddingTop: 52, paddingBottom: spacing.sm },
  pageTitle: { fontSize: 28, fontWeight: "800", color: colors.textPrimary },
  pageSubtitle: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  alertsSection: { paddingTop: spacing.sm },
  section: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },
  heroCard: { borderRadius: borderRadius.xl, padding: spacing.lg, borderWidth: 1, borderColor: `${colors.secondary}30` },
  heroLabel: { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.7)", letterSpacing: 1.5, marginBottom: 4 },
  heroValue: { fontSize: 40, fontWeight: "900", color: "#FFFFFF", letterSpacing: -1.5, marginBottom: spacing.md },
  heroRow: { flexDirection: "row", alignItems: "center" },
  heroStat: { flex: 1, alignItems: "center" },
  heroStatLabel: { fontSize: 9, color: "rgba(255,255,255,0.6)", fontWeight: "600", letterSpacing: 0.5, marginBottom: 2 },
  heroStatValue: { fontSize: 13, fontWeight: "800", color: "#FFFFFF" },
  heroDivider: { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.2)" },
  card: { backgroundColor: colors.bgCard, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, overflow: "hidden" },
  chartCard: { backgroundColor: colors.bgCard, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, overflow: "hidden", padding: spacing.sm },
  chart: { borderRadius: borderRadius.md },
  dsoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 13 },
  dsoLeft: { flex: 1 },
  dsoLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: "500" },
  dsoBalance: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  dsoRight: { alignItems: "flex-end" },
  dsoValue: { fontSize: 15, fontWeight: "700" },
  dsoTarget: { fontSize: 10, color: colors.textMuted, marginTop: 1 },
  agingRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: spacing.sm },
  agingBar: { width: 48, height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: "hidden" },
  agingFill: { height: "100%", borderRadius: 3 },
  agingLabel: { flex: 1, fontSize: 12, color: colors.textSecondary },
  agingAmt: { fontSize: 13, fontWeight: "700", color: colors.textPrimary },
  agingPct: { fontSize: 12, fontWeight: "700", minWidth: 42, textAlign: "right" },
  denialReasons: { paddingTop: spacing.sm, paddingBottom: spacing.xs },
  denialReasonsTitle: { fontSize: 12, fontWeight: "700", color: colors.textMuted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: spacing.sm },
  denialRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.border },
  denialRank: { fontSize: 12, color: colors.textMuted, width: 16 },
  denialReason: { flex: 1, fontSize: 12, color: colors.textSecondary },
  denialCount: { fontSize: 11, color: colors.textMuted },
  denialAmt: { fontSize: 12, fontWeight: "700", color: colors.danger, minWidth: 40, textAlign: "right" },
});
