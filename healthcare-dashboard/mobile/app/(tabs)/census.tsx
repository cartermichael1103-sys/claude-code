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
import { LineChart, PieChart } from "react-native-chart-kit";
import SectionHeader from "../../components/SectionHeader";
import MetricRow from "../../components/MetricRow";
import AlertBanner from "../../components/AlertBanner";
import { fetchCensus } from "../../services/api";
import { colors, spacing, borderRadius, shadows } from "../../constants/theme";

const { width } = Dimensions.get("window");
const CHART_W = width - spacing.md * 2;

const CHART_CONFIG = {
  backgroundGradientFrom: "#0F1B35",
  backgroundGradientTo: "#0F1B35",
  backgroundGradientFromOpacity: 0,
  backgroundGradientToOpacity: 0,
  color: (opacity = 1) => `rgba(0, 199, 255, ${opacity})`,
  labelColor: () => colors.textMuted,
  strokeWidth: 2,
  propsForDots: { r: "2", strokeWidth: "1", stroke: colors.primary },
  propsForBackgroundLines: { stroke: colors.border, strokeDasharray: "3,3" },
  decimalPlaces: 1,
};

export default function CensusScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const d = await fetchCensus();
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

  const { summary, payerMix, adcTrend, admissions, alerts } = data;

  const pieData = [
    { name: "Medicare A", population: payerMix.medicarePartA.census, color: colors.medicare, legendFontColor: colors.textSecondary, legendFontSize: 11 },
    { name: "Medicaid", population: payerMix.medicaid.census, color: colors.medicaid, legendFontColor: colors.textSecondary, legendFontSize: 11 },
    { name: "Private Pay", population: payerMix.privatePay.census, color: colors.privatePay, legendFontColor: colors.textSecondary, legendFontSize: 11 },
    { name: "Managed Care", population: payerMix.managedCare.census, color: colors.managedCare, legendFontColor: colors.textSecondary, legendFontSize: 11 },
  ];

  const trendLabels = adcTrend
    .map((_: number, i: number) => (i % 7 === 0 ? `Day ${i + 1}` : ""))
    .filter(Boolean);

  const trendDataset = {
    labels: adcTrend.map((_: number, i: number) => (i % 10 === 0 ? `${i + 1}` : "")),
    datasets: [{ data: adcTrend, strokeWidth: 2 }],
  };

  return (
    <LinearGradient colors={["#060B16", "#0A0F1E"]} style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
      >
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Census</Text>
          <Text style={styles.pageSubtitle}>Occupancy & Payer Mix</Text>
        </View>

        {/* Alerts */}
        {alerts?.length > 0 && (
          <View style={styles.alertsSection}>
            <AlertBanner alerts={alerts} />
          </View>
        )}

        {/* Occupancy Hero */}
        <View style={styles.section}>
          <LinearGradient
            colors={["#003D2A", "#00966A"]}
            style={[styles.heroCard, shadows.glow(colors.success)]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.heroContent}>
              <View>
                <Text style={styles.heroLabel}>OCCUPANCY RATE</Text>
                <Text style={styles.heroValue}>{summary.occupancyRate.toFixed(1)}%</Text>
                <Text style={styles.heroSub}>
                  {summary.occupiedBeds} / {summary.licensedBeds} beds occupied
                </Text>
              </View>
              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>{summary.actualADC.toFixed(1)}</Text>
                  <Text style={styles.heroStatLabel}>Actual ADC</Text>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>{summary.budgetADC.toFixed(1)}</Text>
                  <Text style={styles.heroStatLabel}>Budget ADC</Text>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroStat}>
                  <Text style={[styles.heroStatValue, { color: summary.variancePct < 0 ? "#FFD580" : colors.success }]}>
                    {summary.variancePct > 0 ? "+" : ""}{summary.variancePct.toFixed(1)}%
                  </Text>
                  <Text style={styles.heroStatLabel}>vs Budget</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* 30-Day ADC Trend */}
        <View style={styles.section}>
          <SectionHeader title="30-Day ADC Trend" subtitle="Average Daily Census" icon="trending-up" iconColor={colors.primary} />
          <View style={[styles.chartCard, shadows.card]}>
            <LineChart
              data={trendDataset}
              width={CHART_W - 16}
              height={160}
              chartConfig={CHART_CONFIG}
              bezier
              withDots={false}
              withInnerLines
              withOuterLines={false}
              style={styles.chart}
              fromZero={false}
            />
            <View style={styles.chartMeta}>
              <Text style={styles.chartMetaText}>Budget ADC: {summary.budgetADC}</Text>
              <Text style={[styles.chartMetaText, { color: colors.primary }]}>
                Current: {summary.actualADC.toFixed(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Payer Mix Pie Chart */}
        <View style={styles.section}>
          <SectionHeader title="Payer Mix" subtitle={`${summary.occupiedBeds} total census`} icon="pie-chart" iconColor={colors.secondary} />
          <View style={[styles.chartCard, shadows.card]}>
            <PieChart
              data={pieData}
              width={CHART_W - 16}
              height={180}
              chartConfig={CHART_CONFIG}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="0"
              absolute
            />
          </View>
        </View>

        {/* Payer Detail Breakdown */}
        <View style={styles.section}>
          <SectionHeader title="Payer Breakdown" icon="list" iconColor={colors.textSecondary} />
          <View style={[styles.card, shadows.card]}>
            {[
              {
                label: "Medicare Part A",
                value: `${payerMix.medicarePartA.census} beds`,
                benchmark: `${payerMix.medicarePartA.budgetPct}% budget`,
                sublabel: `${payerMix.medicarePartA.pct.toFixed(1)}% of census`,
                status: payerMix.medicarePartA.pct < payerMix.medicarePartA.budgetPct ? "warning" : "good",
                color: colors.medicare,
              },
              {
                label: "Medicaid",
                value: `${payerMix.medicaid.census} beds`,
                benchmark: `${payerMix.medicaid.budgetPct}% budget`,
                sublabel: `${payerMix.medicaid.pct.toFixed(1)}% of census`,
                status: "neutral",
                color: colors.medicaid,
              },
              {
                label: "Private Pay",
                value: `${payerMix.privatePay.census} beds`,
                benchmark: `${payerMix.privatePay.budgetPct}% budget`,
                sublabel: `${payerMix.privatePay.pct.toFixed(1)}% of census`,
                status: payerMix.privatePay.pct < payerMix.privatePay.budgetPct ? "warning" : "good",
                color: colors.privatePay,
              },
              {
                label: "Managed Care",
                value: `${payerMix.managedCare.census} beds`,
                benchmark: `${payerMix.managedCare.budgetPct}% budget`,
                sublabel: `${payerMix.managedCare.pct.toFixed(1)}% of census`,
                status: "neutral",
                color: colors.managedCare,
              },
            ].map((item, i, arr) => (
              <MetricRow
                key={item.label}
                label={item.label}
                value={item.value}
                benchmark={item.benchmark}
                sublabel={item.sublabel}
                status={item.status as any}
                showDivider={i < arr.length - 1}
              />
            ))}
          </View>
        </View>

        {/* Admissions */}
        <View style={[styles.section, { paddingBottom: spacing.xxl }]}>
          <SectionHeader title="Admissions & Discharges" subtitle="Month to date" icon="enter" iconColor={colors.info} />
          <View style={[styles.card, shadows.card]}>
            <MetricRow label="Total Admissions" value={admissions.totalThisMonth.toString()} sublabel="MTD" status="neutral" />
            <MetricRow label="From Hospital" value={admissions.fromHospital.toString()} sublabel={`${Math.round((admissions.fromHospital / admissions.totalThisMonth) * 100)}% of admits`} status="neutral" />
            <MetricRow label="Total Discharges" value={admissions.dischargesThisMonth.toString()} sublabel="MTD" status="neutral" />
            <MetricRow label="Discharged to Home/Community" value={admissions.dischargedToHome.toString()} sublabel="Goal: maximize" status="good" />
            <MetricRow label="Medicare Avg LOS" value={`${admissions.medicareAvgLOS} days`} benchmark="21-25 days" status="good" />
            <MetricRow label="Overall Avg LOS" value={`${admissions.averageLOS} days`} status="neutral" showDivider={false} />
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
  pageHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: 52,
    paddingBottom: spacing.sm,
  },
  pageTitle: { fontSize: 28, fontWeight: "800", color: colors.textPrimary },
  pageSubtitle: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  alertsSection: { paddingTop: spacing.sm },
  section: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },
  heroCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: `${colors.success}30`,
    overflow: "hidden",
  },
  heroContent: { gap: spacing.lg },
  heroLabel: { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.7)", letterSpacing: 1.5, marginBottom: 4 },
  heroValue: { fontSize: 56, fontWeight: "900", color: "#FFFFFF", letterSpacing: -2 },
  heroSub: { fontSize: 14, color: "rgba(255,255,255,0.7)", marginTop: 4 },
  heroStats: { flexDirection: "row", alignItems: "center" },
  heroStat: { flex: 1, alignItems: "center" },
  heroStatValue: { fontSize: 20, fontWeight: "800", color: "#FFFFFF" },
  heroStatLabel: { fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 2, fontWeight: "600" },
  heroDivider: { width: 1, height: 36, backgroundColor: "rgba(255,255,255,0.2)" },
  chartCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    padding: spacing.sm,
  },
  chart: { borderRadius: borderRadius.md },
  chartMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.xs,
  },
  chartMetaText: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    overflow: "hidden",
  },
});
