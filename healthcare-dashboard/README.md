# SNF Healthcare Dashboard — AI-Powered Mobile App

A visually stunning mobile dashboard for **Skilled Nursing Facility (SNF)** operations, featuring real-time KPI monitoring and a masterclass AI advisor powered by **Claude Opus 4.6**.

## Features

### Mobile Dashboard (React Native / Expo)
- **Dark, high-contrast design** with gradient cards and color-coded KPI status
- **4 KPI Modules**: Census, Revenue Rates, Labor/Staffing, AR & Collections
- **Interactive charts**: Line charts (trends), Bar charts (comparisons), Pie charts (payer mix)
- **Real-time alerts** with severity indicators across all KPI areas
- **Animated KPI cards** with trend indicators and budget variance

### KPI Coverage
| Module | KPIs |
|--------|------|
| **Census** | Occupancy Rate, ADC vs Budget, Payer Mix (Medicare A, Medicaid, Private Pay, MC), Admissions/Discharges, LOS |
| **Revenue** | Monthly Revenue, RPPD, Per Diem Rates (PDPM, Medicaid, Private, MC), PDPM Component Breakdown, Budget Variance |
| **Labor** | Total HPPD by staff type, RN/LPN/CNA hours, Agency Usage %, Overtime %, Turnover Rate, FTEs, CMS Compliance |
| **AR & Collections** | DSO by payer, Aging Buckets (0-120+), Denial Rate, Collection Rate, Bad Debt %, 12-month trends |

### AI Advisor (Claude Opus 4.6)
- **SNF domain expert** with 20+ years equivalent expertise in operations, revenue cycle, staffing, and AR
- **Tool use**: 6 specialized tools for pulling live facility data during analysis
- **Adaptive thinking**: Deep reasoning for complex operational questions
- **Pre-loaded quick questions** by category (Census, Revenue, Labor, AR, Overall)
- **Conversational memory**: Multi-turn conversation preserves context
- **Markdown responses** with tables, bullet points, headers rendered beautifully

## Tech Stack

```
mobile/          React Native + Expo SDK 51
  expo-router    Navigation & routing
  expo-linear-gradient  Gradient UI
  react-native-chart-kit  Charts (line, bar, pie)
  react-native-markdown-display  AI response rendering

backend/         Node.js + Express + TypeScript
  @anthropic-ai/sdk  Claude Opus 4.6 API
  tsx              Dev server
```

## Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
npm run dev
# Server starts on http://localhost:3001
```

### 2. Mobile App Setup

```bash
cd mobile
npm install
npx expo start
# Press 'i' for iOS simulator, 'a' for Android emulator
# Or scan QR code with Expo Go app on physical device
```

> **Physical device**: Update `BASE_URL` in `mobile/services/api.ts` to your machine's local IP (e.g., `http://192.168.1.x:3001`)

## Mock Facility: Sunrise Gardens SNF

Realistic mock data for a 120-bed facility in Phoenix, AZ:

| KPI | Value | Status |
|-----|-------|--------|
| Occupancy | 90.0% (108/120 beds) | ✅ Good |
| Monthly Revenue | $985,420 | ⚠️ -3.4% vs budget |
| Total HPPD | 3.89 hrs | ⚠️ Over budget (+4.4%) |
| Overall DSO | 32.4 days | ⚠️ +2.4 days vs target |
| CMS Star Rating | 4-Star | ✅ Good |

## Sample AI Questions

- *"Analyze our census performance and give me a 30-day action plan to reach 95% occupancy"*
- *"Our PDPM rate is $15 below budget — what MDS coding improvements could close that gap?"*
- *"Our CNA agency usage is at 12% — create a 60-day plan to reduce it to under 5%"*
- *"Our Private Pay DSO is 62 days — provide a specific collections escalation protocol"*
- *"Give me a comprehensive executive summary with the top 5 financial priorities"*

## Project Structure

```
healthcare-dashboard/
├── backend/
│   ├── src/
│   │   ├── index.ts              Express server
│   │   ├── data/mockData.ts      Comprehensive SNF mock data
│   │   ├── routes/kpi.ts         KPI data endpoints
│   │   ├── routes/agent.ts       Claude AI agent endpoint
│   │   └── agent/snfAgent.ts     Claude Opus 4.6 + tool use
│   └── package.json
└── mobile/
    ├── app/
    │   ├── _layout.tsx
    │   └── (tabs)/
    │       ├── index.tsx         Main dashboard
    │       ├── census.tsx        Census KPIs
    │       ├── revenue.tsx       Revenue KPIs
    │       ├── labor.tsx         Labor/Staffing KPIs
    │       ├── ar.tsx            AR & Collections KPIs
    │       └── agent.tsx         AI Advisor chat
    ├── components/               Reusable UI components
    ├── constants/theme.ts        Design system
    └── services/api.ts           Backend API client
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/kpi/dashboard` | Full dashboard summary + alerts |
| GET | `/api/kpi/census` | Census data |
| GET | `/api/kpi/revenue` | Revenue data |
| GET | `/api/kpi/labor` | Labor/staffing data |
| GET | `/api/kpi/ar` | AR & collections data |
| GET | `/api/kpi/benchmarks` | State & national benchmarks |
| POST | `/api/agent/analyze` | Claude AI analysis |
| GET | `/api/agent/suggestions` | Pre-loaded question categories |
