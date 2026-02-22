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
import { fetchRevenue } from "../../services/api";
import { colors, spacing, borderRadius, shadows } from "../../constants/theme";

const { width } = Dimensions.get("window");
const CHART_W = width - spacing.md * 2;

const LINE_CONFIG = {
  backgroundGradientFrom: "#0F1B35",
  backgroundGradientTo: "#0F1B35",
  backgroundGradientFromOpacity: 0,
  backgroundGradientToOpacity: 0,
  color: (opacity = 1) => `rgba(255, 181, 71, ${opacity})`,
  labelColor: () => colors.textMuted,
  strokeWidth: 2,
  propsForDots: { r: "2", strokeWidth: "1", stroke: colors.warning },
  propsForBackgroundLines: { stroke: colors.border, strokeDasharray: "3,3" },
  decimalPlaces: 0,
};

const BAR_CONFIG = {
  ...LINE_CONFIG,
  color: (opacity = 1) => `rgba(0, 199, 255, ${opacity})`,
  fillShadowGradient: colors.primary,
  fillShadowGradientOpacity: 0.8,
};

export default function RevenueScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const d = await fetchRevenue();
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

  const { summary, perDiemRates, revenueByPayer, monthlyRevenueTrend, monthLabels, pdpmComponents, alerts } = data;

  const trendDataset = {
    labels: monthLabels,
    datasets: [{ data: monthlyRevenueTrend.map((v: number) => v / 1000), strokeWidth: 2 }],
  };

  const barData = {
    labels: ["Med A", "Medicaid", "Private", "MC"],
    datasets: [{
      data: [
        perDiemRates.medicarePartA.rate,
        perDiemRates.medicaid.rate,
        perDiemRates.privatePay.rate,
        perDiemRates.managedCare.rate,
      ],
    }],
  };

  const formatMoney = (v: number) =>
    v >= 1000000 ? `$${(v / 1000000).toFixed(2)}M` : `$${(v / 1000).toFixed(0)}K`;

  return (
    <LinearGradient colors={["#060B16", "#0A0F1E"]} style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
      >
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Revenue</Text>
          <Text style={styles.pageSubtitle}>Rates & Revenue Cycle</Text>
        </View>

        {alerts?.length > 0 && (
          <View style={styles.alertsSection}>
            <AlertBanner alerts={alerts} />
          </View>
        )}

        {/* Revenue Hero */}
        <View style={styles.section}>
          <LinearGradient
            colors={["#3D2A00", "#B07820"]}
            style={[styles.heroCard, shadows.glow(colors.warning)]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.heroLabel}>MONTHLY GROSS REVENUE</Text>
            <Text style={styles.heroValue}>{formatMoney(summary.totalMonthlyRevenue)}</Text>
            <View style={styles.heroRow}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatLabel}>Budget</Text>
                <Text style={styles.heroStatValue}>{formatMoney(summary.budgetRevenue)}</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatLabel}>Variance</Text>
                <Text style={[styles.heroStatValue, { color: summary.variancePct < 0 ? "#FFD580" : "#A8FFD8" }]}>
                  {summary.variancePct > 0 ? "+" : ""}{summary.variancePct.toFixed(1)}%
                </Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatLabel}>RPPD</Text>
                <Text style={styles.heroStatValue}>${summary.revenuePerPatientDay.toFixed(0)}</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatLabel}>Collection%</Text>
                <Text style={styles.heroStatValue}>{summary.collectionsRate}%</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Monthly Revenue Trend */}
        <View style={styles.section}>
          <SectionHeader title="12-Month Revenue Trend" subtitle="In thousands ($K)" icon="trending-up" iconColor={colors.warning} />
          <View style={[styles.chartCard, shadows.card]}>
            <LineChart
              data={trendDataset}
              width={CHART_W - 16}
              height={160}
              chartConfig={LINE_CONFIG}
              bezier
              withDots={false}
              withInnerLines
              withOuterLines={false}
              style={styles.chart}
              fromZero={false}
              formatYLabel={(y) => `$${parseInt(y)}K`}
            />
          </View>
        </View>

        {/* Per Diem Rates Bar Chart */}
        <View style={styles.section}>
          <SectionHeader title="Per Diem Rates by Payer" subtitle="Daily rate ($/day)" icon="cash" iconColor={colors.primary} />
          <View style={[styles.chartCard, shadows.card]}>
            <BarChart
              data={barData}
              width={CHART_W - 16}
              height={180}
              chartConfig={BAR_CONFIG}
              style={styles.chart}
              fromZero
              showValuesOnTopOfBars
              yAxisLabel="$"
              yAxisSuffix=""
            />
          </View>
        </View>

        {/* Per Diem Detail */}
        <View style={styles.section}>
          <SectionHeader title="Rate Detail" subtitle="Actual vs Budget" icon="document-text" iconColor={colors.textSecondary} />
          <View style={[styles.card, shadows.card]}>
            {[
              {
                label: "Medicare Part A (PDPM)",
                value: `$${perDiemRates.medicarePartA.rate.toFixed(2)}/day`,
                benchmark: `$${perDiemRates.medicarePartA.budget}/day budget`,
                sublabel: `AZ benchmark: $810 | National: $795`,
                status: perDiemRates.medicarePartA.variance < 0 ? "warning" : "good",
              },
              {
                label: "Medicaid (AHCCCS)",
                value: `$${perDiemRates.medicaid.rate.toFixed(2)}/day`,
                benchmark: `$${perDiemRates.medicaid.budget}/day budget`,
                sublabel: "AZ state plan rate",
                status: "good",
              },
              {
                label: "Private Pay",
                value: `$${perDiemRates.privatePay.rate.toFixed(2)}/day`,
                benchmark: `$${perDiemRates.privatePay.budget}/day budget`,
                sublabel: "Semi-private room",
                status: perDiemRates.privatePay.variance < 0 ? "warning" : "good",
              },
              {
                label: "Managed Care (Avg)",
                value: `$${perDiemRates.managedCare.rate.toFixed(2)}/day`,
                benchmark: `$${perDiemRates.managedCare.budget}/day budget`,
                sublabel: "Avg across 4 contracts",
                status: "warning",
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

        {/* PDPM Component Breakdown */}
        <View style={styles.section}>
          <SectionHeader title="PDPM Component Breakdown" subtitle="Medicare Part A per diem components" icon="layers" iconColor={colors.medicare} />
          <View style={[styles.card, shadows.card]}>
            {Object.entries(pdpmComponents).map(([key, val]: any, i, arr) => (
              <View key={key} style={[styles.pdpmRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <View style={styles.pdpmBar}>
                  <View style={[styles.pdpmFill, { width: `${val.pct}%`, backgroundColor: colors.medicare }]} />
                </View>
                <Text style={styles.pdpmLabel}>{key.toUpperCase()}</Text>
                <Text style={styles.pdpmValue}>${val.rate.toFixed(2)}</Text>
                <Text style={styles.pdpmPct}>{val.pct.toFixed(1)}%</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Revenue by Payer */}
        <View style={[styles.section, { paddingBottom: spacing.xxl }]}>
          <SectionHeader title="Revenue by Payer" subtitle="MTD contributions" icon="pie-chart" iconColor={colors.success} />
          <View style={[styles.card, shadows.card]}>
            {[
              { label: "Medicare Part A", ...revenueByPayer.medicarePartA, color: colors.medicare },
              { label: "Medicaid", ...revenueByPayer.medicaid, color: colors.medicaid },
              { label: "Private Pay", ...revenueByPayer.privatePay, color: colors.privatePay },
              { label: "Managed Care", ...revenueByPayer.managedCare, color: colors.managedCare },
            ].map((item, i, arr) => (
              <View key={item.label} style={[styles.revenueRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                <Text style={styles.revenueLabel}>{item.label}</Text>
                <View style={styles.revenueRight}>
                  <Text style={styles.revenueAmt}>{formatMoney(item.amount)}</Text>
                  <Text style={styles.revenuePct}>{item.pct}%</Text>
                </View>
              </View>
            ))}
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
  heroCard: { borderRadius: borderRadius.xl, padding: spacing.lg, borderWidth: 1, borderColor: `${colors.warning}30` },
  heroLabel: { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.7)", letterSpacing: 1.5, marginBottom: 4 },
  heroValue: { fontSize: 42, fontWeight: "900", color: "#FFFFFF", letterSpacing: -1.5, marginBottom: spacing.md },
  heroRow: { flexDirection: "row", alignItems: "center" },
  heroStat: { flex: 1, alignItems: "center" },
  heroStatLabel: { fontSize: 9, color: "rgba(255,255,255,0.6)", fontWeight: "600", letterSpacing: 0.5, marginBottom: 2 },
  heroStatValue: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
  heroDivider: { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.2)" },
  chartCard: { backgroundColor: colors.bgCard, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, overflow: "hidden", padding: spacing.sm },
  chart: { borderRadius: borderRadius.md },
  card: { backgroundColor: colors.bgCard, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, overflow: "hidden" },
  pdpmRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: spacing.sm },
  pdpmBar: { width: 60, height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: "hidden" },
  pdpmFill: { height: "100%", borderRadius: 3 },
  pdpmLabel: { flex: 1, fontSize: 12, color: colors.textSecondary, fontWeight: "600" },
  pdpmValue: { fontSize: 13, color: colors.textPrimary, fontWeight: "700", minWidth: 55, textAlign: "right" },
  pdpmPct: { fontSize: 11, color: colors.textMuted, minWidth: 38, textAlign: "right" },
  revenueRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: spacing.sm },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  revenueLabel: { flex: 1, fontSize: 13, color: colors.textSecondary },
  revenueRight: { alignItems: "flex-end" },
  revenueAmt: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  revenuePct: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
});
