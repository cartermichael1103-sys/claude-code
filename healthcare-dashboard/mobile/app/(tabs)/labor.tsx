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
import { Ionicons } from "@expo/vector-icons";
import SectionHeader from "../../components/SectionHeader";
import MetricRow from "../../components/MetricRow";
import AlertBanner from "../../components/AlertBanner";
import { fetchLabor } from "../../services/api";
import { colors, spacing, borderRadius, shadows } from "../../constants/theme";

const { width } = Dimensions.get("window");
const CHART_W = width - spacing.md * 2;

const CHART_CONFIG = {
  backgroundGradientFrom: "#0F1B35",
  backgroundGradientTo: "#0F1B35",
  backgroundGradientFromOpacity: 0,
  backgroundGradientToOpacity: 0,
  color: (opacity = 1) => `rgba(255, 95, 126, ${opacity})`,
  labelColor: () => colors.textMuted,
  strokeWidth: 2,
  propsForDots: { r: "2", strokeWidth: "1", stroke: colors.danger },
  propsForBackgroundLines: { stroke: colors.border, strokeDasharray: "3,3" },
  decimalPlaces: 2,
};

const BAR_CONFIG = {
  ...CHART_CONFIG,
  color: (opacity = 1) => `rgba(0, 199, 255, ${opacity})`,
};

export default function LaborScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const d = await fetchLabor();
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

  const { summary, hppd, staffingByType, hppdTrend, monthlyCostTrend, staffingCompliance, alerts } = data;

  const hppdBarData = {
    labels: ["RN", "LPN", "CNA", "Therapy", "Other"],
    datasets: [{
      data: [
        hppd.actual.rn,
        hppd.actual.lpn,
        hppd.actual.cna,
        hppd.actual.therapy,
        hppd.actual.other,
      ],
    }],
  };

  const trendDataset = {
    labels: hppdTrend.map((_: number, i: number) => i % 10 === 0 ? `${i + 1}` : ""),
    datasets: [{ data: hppdTrend, strokeWidth: 2 }],
  };

  const formatCost = (v: number) =>
    v >= 1000000 ? `$${(v / 1000000).toFixed(2)}M` : `$${(v / 1000).toFixed(0)}K`;

  const overBudget = summary.variancePct > 0;

  return (
    <LinearGradient colors={["#060B16", "#0A0F1E"]} style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
      >
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Labor</Text>
          <Text style={styles.pageSubtitle}>Staffing & Workforce</Text>
        </View>

        {alerts?.length > 0 && (
          <View style={styles.alertsSection}>
            <AlertBanner alerts={alerts} />
          </View>
        )}

        {/* Labor Hero */}
        <View style={styles.section}>
          <LinearGradient
            colors={overBudget ? ["#3D0015", "#A83050"] : ["#003D2A", "#00966A"]}
            style={[styles.heroCard, shadows.glow(overBudget ? colors.danger : colors.success)]}
          >
            <Text style={styles.heroLabel}>TOTAL MONTHLY LABOR COST</Text>
            <Text style={styles.heroValue}>{formatCost(summary.totalMonthlyLaborCost)}</Text>
            <View style={styles.heroRow}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatLabel}>Budget</Text>
                <Text style={styles.heroStatValue}>{formatCost(summary.budgetLaborCost)}</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatLabel}>Variance</Text>
                <Text style={[styles.heroStatValue, { color: overBudget ? "#FFD580" : "#A8FFD8" }]}>
                  +{summary.variancePct.toFixed(1)}%
                </Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatLabel}>Labor %</Text>
                <Text style={[styles.heroStatValue, { color: summary.laborCostPct > 54 ? "#FFD580" : "#A8FFD8" }]}>
                  {summary.laborCostPct}%
                </Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatLabel}>FTEs</Text>
                <Text style={styles.heroStatValue}>{summary.totalFTEs}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Compliance Status */}
        <View style={styles.section}>
          <SectionHeader title="CMS Staffing Compliance" icon="shield-checkmark" iconColor={colors.success} />
          <View style={[styles.complianceCard, shadows.card]}>
            {[
              { label: "Total HPPD ≥ 3.48", met: staffingCompliance.cmsMinimumMet, value: `${hppd.actual.total} hrs` },
              { label: "RN HPPD ≥ 0.55", met: hppd.actual.rn >= 0.55, value: `${hppd.actual.rn} hrs` },
              { label: "RN on Every Shift", met: staffingCompliance.rnsOnEveryShift, value: "Yes" },
              { label: "PBJ Submitted", met: staffingCompliance.pbj_submittedCurrentQuarter, value: "Current" },
            ].map((item) => (
              <View key={item.label} style={styles.complianceRow}>
                <Ionicons
                  name={item.met ? "checkmark-circle" : "close-circle"}
                  size={20}
                  color={item.met ? colors.success : colors.danger}
                />
                <Text style={styles.complianceLabel}>{item.label}</Text>
                <Text style={[styles.complianceValue, { color: item.met ? colors.success : colors.danger }]}>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* HPPD by Staff Type */}
        <View style={styles.section}>
          <SectionHeader title="HPPD by Staff Type" subtitle="Hours Per Patient Day" icon="bar-chart" iconColor={colors.primary} />
          <View style={[styles.chartCard, shadows.card]}>
            <BarChart
              data={hppdBarData}
              width={CHART_W - 16}
              height={180}
              chartConfig={BAR_CONFIG}
              style={styles.chart}
              fromZero
              showValuesOnTopOfBars
              yAxisLabel=""
              yAxisSuffix="h"
            />
          </View>
        </View>

        {/* HPPD Comparison Table */}
        <View style={styles.section}>
          <SectionHeader title="HPPD Detail" subtitle="Actual vs Budget vs CMS Minimum" icon="list" iconColor={colors.textSecondary} />
          <View style={[styles.tableCard, shadows.card]}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHead, { flex: 2 }]}>Category</Text>
              <Text style={styles.tableHead}>Actual</Text>
              <Text style={styles.tableHead}>Budget</Text>
              <Text style={styles.tableHead}>CMS Min</Text>
            </View>
            {[
              { label: "RN", actual: hppd.actual.rn, budget: hppd.budget.rn, cms: hppd.cmsMinimum.rn },
              { label: "LPN", actual: hppd.actual.lpn, budget: hppd.budget.lpn, cms: null },
              { label: "CNA", actual: hppd.actual.cna, budget: hppd.budget.cna, cms: null },
              { label: "Therapy", actual: hppd.actual.therapy, budget: hppd.budget.therapy, cms: null },
              { label: "Other", actual: hppd.actual.other, budget: hppd.budget.other, cms: null },
              { label: "TOTAL", actual: hppd.actual.total, budget: hppd.budget.total, cms: hppd.cmsMinimum.total, bold: true },
            ].map((row) => (
              <View key={row.label} style={[styles.tableRow, row.bold && styles.tableRowBold]}>
                <Text style={[styles.tableCell, styles.tableLabelCell, row.bold && styles.tableCellBold]}>{row.label}</Text>
                <Text style={[styles.tableCell, { color: row.actual > (row.budget || 0) ? colors.danger : colors.success }, row.bold && styles.tableCellBold]}>
                  {row.actual.toFixed(2)}
                </Text>
                <Text style={[styles.tableCell, { color: colors.textSecondary }]}>{row.budget.toFixed(2)}</Text>
                <Text style={[styles.tableCell, { color: colors.textMuted }]}>
                  {row.cms != null ? row.cms.toFixed(2) : "—"}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 30-Day HPPD Trend */}
        <View style={styles.section}>
          <SectionHeader title="30-Day HPPD Trend" icon="trending-up" iconColor={colors.danger} />
          <View style={[styles.chartCard, shadows.card]}>
            <LineChart
              data={trendDataset}
              width={CHART_W - 16}
              height={150}
              chartConfig={CHART_CONFIG}
              bezier
              withDots={false}
              withInnerLines
              withOuterLines={false}
              style={styles.chart}
              fromZero={false}
            />
          </View>
        </View>

        {/* Agency & Overtime */}
        <View style={styles.section}>
          <SectionHeader title="Agency & Overtime" icon="alert" iconColor={colors.warning} />
          <View style={[styles.card, shadows.card]}>
            <MetricRow label="Agency Spend MTD" value={`$${(summary.agencySpend / 1000).toFixed(1)}K`} benchmark="<$15K target" status="danger" sublabel={`${summary.agencyFTEs} agency FTEs`} />
            <MetricRow label="CNA Agency Usage" value={`${staffingByType.cna.agencyPct}%`} benchmark="<5% target" status="danger" sublabel="Highest driver of overage" />
            <MetricRow label="RN Agency Usage" value={`${staffingByType.rn.agencyPct}%`} benchmark="<5% target" status="warning" />
            <MetricRow label="Overtime Rate" value={`${summary.overtimePct}%`} benchmark="<6% target" status="warning" sublabel="All staff categories" />
            <MetricRow label="Annual Turnover" value={`${summary.turnoverRateAnnualized}%`} benchmark="<40% target" status="warning" sublabel="National avg: 50%" showDivider={false} />
          </View>
        </View>

        {/* Staffing by Role */}
        <View style={[styles.section, { paddingBottom: spacing.xxl }]}>
          <SectionHeader title="Staffing by Role" subtitle="FTEs & monthly cost" icon="people" iconColor={colors.secondary} />
          <View style={[styles.card, shadows.card]}>
            {[
              { label: "Registered Nurses (RN)", ftes: staffingByType.rn.ftes, cost: staffingByType.rn.laborCost },
              { label: "Licensed Practical Nurses", ftes: staffingByType.lpn.ftes, cost: staffingByType.lpn.laborCost },
              { label: "Certified Nursing Assistants", ftes: staffingByType.cna.ftes, cost: staffingByType.cna.laborCost },
              { label: "Therapy Staff", ftes: staffingByType.therapy.ftes, cost: staffingByType.therapy.laborCost },
              { label: "Dietary", ftes: staffingByType.dietary.ftes, cost: staffingByType.dietary.laborCost },
              { label: "Housekeeping", ftes: staffingByType.housekeeping.ftes, cost: staffingByType.housekeeping.laborCost },
              { label: "Administration", ftes: staffingByType.admin.ftes, cost: staffingByType.admin.laborCost },
            ].map((item, i, arr) => (
              <MetricRow
                key={item.label}
                label={item.label}
                value={`${formatCost(item.cost)}`}
                sublabel={`${item.ftes} FTEs`}
                status="neutral"
                showDivider={i < arr.length - 1}
              />
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
  heroCard: { borderRadius: borderRadius.xl, padding: spacing.lg, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  heroLabel: { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.7)", letterSpacing: 1.5, marginBottom: 4 },
  heroValue: { fontSize: 40, fontWeight: "900", color: "#FFFFFF", letterSpacing: -1.5, marginBottom: spacing.md },
  heroRow: { flexDirection: "row", alignItems: "center" },
  heroStat: { flex: 1, alignItems: "center" },
  heroStatLabel: { fontSize: 9, color: "rgba(255,255,255,0.6)", fontWeight: "600", letterSpacing: 0.5, marginBottom: 2 },
  heroStatValue: { fontSize: 14, fontWeight: "800", color: "#FFFFFF" },
  heroDivider: { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.2)" },
  complianceCard: { backgroundColor: colors.bgCard, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, overflow: "hidden" },
  complianceRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  complianceLabel: { flex: 1, fontSize: 13, color: colors.textSecondary },
  complianceValue: { fontSize: 13, fontWeight: "700" },
  chartCard: { backgroundColor: colors.bgCard, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, overflow: "hidden", padding: spacing.sm },
  chart: { borderRadius: borderRadius.md },
  tableCard: { backgroundColor: colors.bgCard, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  tableHeader: { flexDirection: "row", paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.bgCardAlt },
  tableHead: { flex: 1, fontSize: 10, fontWeight: "700", color: colors.textMuted, letterSpacing: 0.8, textTransform: "uppercase", textAlign: "right" },
  tableRow: { flexDirection: "row", paddingHorizontal: spacing.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  tableRowBold: { backgroundColor: `${colors.primary}08` },
  tableCell: { flex: 1, fontSize: 13, textAlign: "right", color: colors.textPrimary },
  tableLabelCell: { textAlign: "left", color: colors.textSecondary },
  tableCellBold: { fontWeight: "800" },
  card: { backgroundColor: colors.bgCard, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, overflow: "hidden" },
});
