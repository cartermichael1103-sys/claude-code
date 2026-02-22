export const colors = {
  // Backgrounds
  bg: "#0A0F1E",
  bgCard: "#0F1B35",
  bgCardAlt: "#131E3A",
  bgInput: "#162040",
  border: "#1E3055",
  borderLight: "#253A65",

  // Accents
  primary: "#00C7FF",       // Bright cyan
  primaryDim: "#0085AA",
  secondary: "#7B61FF",     // Purple
  secondaryDim: "#4E3EA8",

  // Status
  success: "#00E5A0",       // Teal green
  successDim: "#00966A",
  warning: "#FFB547",       // Amber
  warningDim: "#B07820",
  danger: "#FF5F7E",        // Salmon red
  dangerDim: "#A83050",
  info: "#4F9BF5",          // Blue

  // Payer colors
  medicare: "#4F9BF5",
  medicaid: "#A78BFA",
  privatePay: "#34D399",
  managedCare: "#FB923C",
  hospice: "#F472B6",

  // Text
  textPrimary: "#FFFFFF",
  textSecondary: "#8899BB",
  textMuted: "#4A5A80",
  textDisabled: "#2A3A5A",

  // Chart colors
  chartLine: "#00C7FF",
  chartLine2: "#7B61FF",
  chartGradientFrom: "#0A1628",
  chartGradientTo: "#0A1628",
};

export const gradients = {
  primary: ["#0085AA", "#00C7FF"] as const,
  secondary: ["#4E3EA8", "#7B61FF"] as const,
  success: ["#00966A", "#00E5A0"] as const,
  warning: ["#B07820", "#FFB547"] as const,
  danger: ["#A83050", "#FF5F7E"] as const,
  card: ["#0F1B35", "#162040"] as const,
  header: ["#0A0F1E", "#0F1B35"] as const,
  midnight: ["#060B16", "#0A0F1E"] as const,
  blueCard: ["#091428", "#0F2040"] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  displayLarge: { fontSize: 36, fontWeight: "700" as const, letterSpacing: -1 },
  displayMedium: { fontSize: 28, fontWeight: "700" as const, letterSpacing: -0.5 },
  headingLarge: { fontSize: 22, fontWeight: "700" as const },
  headingMedium: { fontSize: 18, fontWeight: "600" as const },
  headingSmall: { fontSize: 15, fontWeight: "600" as const },
  bodyLarge: { fontSize: 16, fontWeight: "400" as const },
  bodyMedium: { fontSize: 14, fontWeight: "400" as const },
  bodySmall: { fontSize: 12, fontWeight: "400" as const },
  caption: { fontSize: 11, fontWeight: "400" as const },
  label: { fontSize: 11, fontWeight: "600" as const, letterSpacing: 0.8, textTransform: "uppercase" as const },
};

export const shadows = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  }),
};
