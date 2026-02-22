// Sunrise Gardens Skilled Nursing & Rehabilitation — Mock Data
// Realistic SNF operational data for dashboard demonstration

export const facilityInfo = {
  name: "Sunrise Gardens Skilled Nursing & Rehabilitation",
  shortName: "Sunrise Gardens SNF",
  npi: "1234567890",
  ccn: "345678",
  beds: 120,
  address: "4821 Sunrise Boulevard, Phoenix, AZ 85032",
  administrator: "Patricia M. Holloway, NHA",
  dons: "Rebecca Torres, RN, DNS",
  medicareProvider: "45-3678",
  medicaidProvider: "AZ-SNF-003421",
  starRating: 4,
  healthInspectionRating: 4,
  staffingRating: 3,
  qualityMeasureRating: 5,
  reportingPeriod: "January 2025",
  lastUpdated: new Date().toISOString(),
};

// ─── Census Data ───────────────────────────────────────────────────────────────

export const censusData = {
  summary: {
    licensedBeds: 120,
    certifiedBeds: 120,
    occupiedBeds: 108,
    occupancyRate: 90.0,
    availableBeds: 12,
    budgetADC: 110.0,
    actualADC: 108.3,
    varianceFromBudget: -1.7,
    variancePct: -1.5,
  },
  payerMix: {
    medicarePartA: { census: 28, pct: 25.9, budgetPct: 27.0, color: "#4F9BF5" },
    medicaid: { census: 52, pct: 48.1, budgetPct: 46.0, color: "#A78BFA" },
    privatePay: { census: 13, pct: 12.0, budgetPct: 13.0, color: "#34D399" },
    managedCare: { census: 15, pct: 13.9, budgetPct: 14.0, color: "#FB923C" },
    medicarePartB: { census: 0, pct: 0.0, budgetPct: 0.0, color: "#60A5FA" },
    hospice: { census: 0, pct: 0.0, budgetPct: 0.0, color: "#F472B6" },
  },
  admissions: {
    totalThisMonth: 22,
    fromHospital: 18,
    fromCommunity: 4,
    dischargesThisMonth: 19,
    dischargedToHome: 12,
    dischargedToHospital: 5,
    dischargedToALF: 2,
    averageLOS: 28.4,
    medicareAvgLOS: 21.6,
    medicaidAvgLOS: 412.0,
  },
  // 30-day ADC trend (last 30 days)
  adcTrend: [
    107.2, 108.1, 109.0, 108.5, 107.8, 108.9, 109.2, 110.1, 109.5, 108.7,
    107.9, 108.3, 109.1, 108.8, 107.5, 108.0, 108.6, 109.3, 110.0, 109.7,
    108.4, 107.6, 108.2, 108.9, 109.4, 110.2, 109.8, 108.1, 107.9, 108.3,
  ],
  occupancyTrend: [
    89.3, 90.1, 90.8, 90.4, 89.8, 90.8, 91.0, 91.8, 91.3, 90.6,
    89.9, 90.3, 90.9, 90.7, 89.6, 90.0, 90.5, 91.1, 91.7, 91.4,
    90.3, 89.7, 90.2, 90.8, 91.2, 91.8, 91.5, 90.1, 89.9, 90.3,
  ],
  alerts: [
    { type: "warning", message: "Medicare Part A census 2.6% below budget target", kpi: "Census" },
    { type: "info", message: "3 pending admissions from St. Luke's Hospital", kpi: "Census" },
  ],
};

// ─── Revenue Rate Data ─────────────────────────────────────────────────────────

export const revenueData = {
  summary: {
    totalMonthlyRevenue: 985420,
    budgetRevenue: 1020000,
    varianceAmount: -34580,
    variancePct: -3.4,
    revenuePerPatientDay: 304.8,
    budgetRPPD: 315.2,
    netRevenue: 942300,
    collectionsRate: 97.2,
  },
  perDiemRates: {
    medicarePartA: {
      rate: 825.00,
      budget: 840.00,
      variance: -15.00,
      description: "PDPM blended rate",
      benchmarkLow: 780,
      benchmarkHigh: 920,
    },
    medicaid: {
      rate: 265.50,
      budget: 262.00,
      variance: 3.50,
      description: "AZ AHCCCS per diem",
      benchmarkLow: 230,
      benchmarkHigh: 290,
    },
    privatePay: {
      rate: 395.00,
      budget: 400.00,
      variance: -5.00,
      description: "Semi-private room rate",
      benchmarkLow: 350,
      benchmarkHigh: 450,
    },
    managedCare: {
      rate: 490.00,
      budget: 495.00,
      variance: -5.00,
      description: "Avg across 4 contracts",
      benchmarkLow: 420,
      benchmarkHigh: 550,
    },
  },
  // PDPM component breakdown (Medicare only)
  pdpmComponents: {
    nursing: { rate: 285.40, pct: 34.6 },
    pt: { rate: 165.20, pct: 20.0 },
    ot: { rate: 142.80, pct: 17.3 },
    slp: { rate: 68.50, pct: 8.3 },
    nta: { rate: 98.10, pct: 11.9 },
    nonCaseMix: { rate: 65.00, pct: 7.9 },
  },
  revenueByPayer: {
    medicarePartA: { amount: 208950, pct: 21.2 },
    medicaid: { amount: 417240, pct: 42.3 },
    privatePay: { amount: 155610, pct: 15.8 },
    managedCare: { amount: 220500, pct: 22.4 },
    other: { amount: 8120, pct: 0.8 },
  },
  // Monthly revenue trend (12 months)
  monthlyRevenueTrend: [
    948200, 961500, 972800, 965400, 978300, 991200,
    985700, 1002100, 997400, 988600, 979300, 985420,
  ],
  monthLabels: ["Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan"],
  alerts: [
    { type: "warning", message: "Medicare PDPM rate $15 below budget — review MDS coding accuracy", kpi: "Revenue" },
    { type: "danger", message: "Monthly revenue $34,580 below budget (-3.4%)", kpi: "Revenue" },
  ],
};

// ─── Labor Data ────────────────────────────────────────────────────────────────

export const laborData = {
  summary: {
    totalMonthlyLaborCost: 519800,
    laborCostPct: 52.8,
    budgetLaborCost: 498000,
    varianceAmount: 21800,
    variancePct: 4.4,
    totalFTEs: 86.4,
    budgetFTEs: 83.0,
    agencyFTEs: 6.2,
    agencySpend: 38400,
    overtimePct: 8.5,
    turnoverRateAnnualized: 42.0,
  },
  hppd: {
    // Hours Per Patient Day
    actual: {
      rn: 0.62,
      lpn: 0.78,
      cna: 2.17,
      therapy: 0.92,
      other: 0.40,
      total: 3.89,
    },
    budget: {
      rn: 0.60,
      lpn: 0.76,
      cna: 2.10,
      therapy: 0.90,
      other: 0.38,
      total: 3.74,
    },
    cmsMinimum: {
      rn: 0.55,
      lpn: 0.00,
      cna: 0.00,
      therapy: 0.00,
      other: 0.00,
      total: 3.48,
    },
    benchmark: {
      rn: 0.58,
      lpn: 0.74,
      cna: 2.08,
      therapy: 0.88,
      other: 0.36,
      total: 3.64,
    },
  },
  staffingByType: {
    rn: { ftes: 11.2, laborCost: 96800, costPerFTE: 8642, agencyPct: 8.9 },
    lpn: { ftes: 14.1, laborCost: 98700, costPerFTE: 6999, agencyPct: 5.7 },
    cna: { ftes: 39.3, laborCost: 176850, costPerFTE: 4500, agencyPct: 12.2 },
    therapy: { ftes: 11.8, laborCost: 94400, costPerFTE: 8000, agencyPct: 3.4 },
    dietary: { ftes: 4.2, laborCost: 21000, costPerFTE: 5000, agencyPct: 0.0 },
    housekeeping: { ftes: 3.4, laborCost: 15300, costPerFTE: 4500, agencyPct: 0.0 },
    admin: { ftes: 2.4, laborCost: 17150, costPerFTE: 7146, agencyPct: 0.0 },
  },
  // 30-day HPPD trend
  hppdTrend: [
    3.72, 3.85, 3.91, 3.88, 3.79, 3.94, 4.01, 3.87, 3.82, 3.76,
    3.90, 3.95, 3.88, 3.83, 3.74, 3.89, 3.92, 3.97, 4.02, 3.93,
    3.86, 3.78, 3.91, 3.94, 3.88, 3.82, 3.89, 3.93, 3.87, 3.89,
  ],
  // Monthly labor cost trend (12 months)
  monthlyCostTrend: [
    488000, 492000, 498500, 495200, 501800, 508400,
    512100, 521300, 515800, 509200, 514600, 519800,
  ],
  staffingCompliance: {
    cmsMinimumMet: true,
    rnsOnEveryShift: true,
    pbj_submittedCurrentQuarter: true,
    averageRNHours: 0.62,
    daysAboveMinimum: 28,
    daysAtMinimum: 3,
    daysBelowMinimum: 0,
  },
  alerts: [
    { type: "danger", message: "Labor over budget by $21,800 (4.4%) — CNA agency utilization 12.2%", kpi: "Labor" },
    { type: "warning", message: "Overtime at 8.5% — target <6%; review scheduling efficiency", kpi: "Labor" },
    { type: "warning", message: "Annual turnover 42% — industry average 50%; implement retention programs", kpi: "Labor" },
  ],
};

// ─── AR & Collections Data ─────────────────────────────────────────────────────

export const arData = {
  summary: {
    totalARBalance: 2847300,
    netCollectableAR: 2698600,
    overallDSO: 32.4,
    budgetDSO: 30.0,
    collectionRate: 97.2,
    budgetCollectionRate: 98.0,
    badDebtPct: 1.8,
    creditBalances: 42800,
    monthlyBilled: 985420,
  },
  dsoPayer: {
    medicarePartA: { dso: 18.2, budget: 18.0, balance: 380200, pct: 13.4, status: "good" },
    medicaid: { dso: 44.8, budget: 42.0, balance: 1124600, pct: 39.5, status: "warning" },
    privatePay: { dso: 62.1, budget: 55.0, balance: 456800, pct: 16.0, status: "danger" },
    managedCare: { dso: 38.4, budget: 35.0, balance: 885700, pct: 31.1, status: "warning" },
  },
  aging: {
    current: { amount: 1420800, pct: 49.9, label: "0–30 days" },
    thirtyToSixty: { amount: 680400, pct: 23.9, label: "31–60 days" },
    sixtyToNinety: { amount: 382500, pct: 13.4, label: "61–90 days" },
    ninetyToOneTwenty: { amount: 220100, pct: 7.7, label: "91–120 days" },
    overOneTwenty: { amount: 143500, pct: 5.0, label: "120+ days" },
  },
  denials: {
    totalDeniedThisMonth: 12,
    totalDeniedAmount: 48600,
    denialRate: 4.9,
    overturnedRate: 67.0,
    topDenialReasons: [
      { reason: "Medical Necessity", count: 5, amount: 22100 },
      { reason: "Authorization Missing", count: 3, amount: 14800 },
      { reason: "Timely Filing", count: 2, amount: 8200 },
      { reason: "Duplicate Claim", count: 1, amount: 2900 },
      { reason: "Other", count: 1, amount: 600 },
    ],
  },
  // 12-month DSO trend
  dsoTrend: [
    30.2, 29.8, 31.4, 32.1, 30.9, 31.8,
    33.2, 32.6, 31.9, 32.8, 33.1, 32.4,
  ],
  monthLabels: ["Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan"],
  // Monthly collections trend
  collectionsTrend: [
    921000, 935200, 948800, 942100, 958600, 971400,
    965200, 981800, 974500, 968300, 972100, 985420,
  ],
  alerts: [
    { type: "danger", message: "Private Pay DSO 62 days — 13% above target; escalate collection calls", kpi: "AR" },
    { type: "warning", message: "Medicaid AR $1.12M — review timely filing compliance", kpi: "AR" },
    { type: "warning", message: "$143,500 in 120+ day AR — schedule write-off review", kpi: "AR" },
  ],
};

// ─── Benchmarks ────────────────────────────────────────────────────────────────

export const benchmarks = {
  national: {
    occupancyRate: 82.5,
    medicareAdcPct: 21.0,
    medicarePerDiem: 795,
    totalHPPD: 3.65,
    rnHPPD: 0.56,
    overallDSO: 35.0,
    collectionRate: 96.5,
    laborCostPct: 54.0,
    turnoverRate: 50.0,
  },
  stateAZ: {
    occupancyRate: 85.2,
    medicareAdcPct: 22.5,
    medicarePerDiem: 810,
    totalHPPD: 3.71,
    rnHPPD: 0.58,
    overallDSO: 33.5,
    collectionRate: 96.8,
    laborCostPct: 53.2,
    turnoverRate: 47.0,
  },
};

// ─── Consolidated Dashboard Summary ───────────────────────────────────────────

export const dashboardSummary = {
  overallHealthScore: 74, // 0-100 composite score
  lastRefreshed: new Date().toISOString(),
  kpiSummary: {
    census: {
      value: 90.0,
      label: "Occupancy Rate",
      unit: "%",
      status: "good",       // good / warning / danger
      change: +0.8,
      changePct: +0.9,
      trend: "up",
    },
    revenue: {
      value: 985420,
      label: "Monthly Revenue",
      unit: "$",
      status: "warning",
      change: -34580,
      changePct: -3.4,
      trend: "down",
    },
    labor: {
      value: 3.89,
      label: "Total HPPD",
      unit: "hrs",
      status: "warning",
      change: +0.15,
      changePct: +4.0,
      trend: "up",
    },
    ar: {
      value: 32.4,
      label: "Overall DSO",
      unit: "days",
      status: "warning",
      change: +2.4,
      changePct: +8.0,
      trend: "up",
    },
  },
  allAlerts: [
    ...censusData.alerts,
    ...revenueData.alerts,
    ...laborData.alerts,
    ...arData.alerts,
  ],
};

export type FacilityInfo = typeof facilityInfo;
export type CensusData = typeof censusData;
export type RevenueData = typeof revenueData;
export type LaborData = typeof laborData;
export type ARData = typeof arData;
export type Benchmarks = typeof benchmarks;
export type DashboardSummary = typeof dashboardSummary;
