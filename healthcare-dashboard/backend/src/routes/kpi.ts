import { Router } from "express";
import {
  facilityInfo,
  censusData,
  revenueData,
  laborData,
  arData,
  benchmarks,
  dashboardSummary,
} from "../data/mockData.js";

export const kpiRouter = Router();

kpiRouter.get("/dashboard", (_req, res) => {
  res.json({
    facility: facilityInfo,
    summary: dashboardSummary,
    alerts: dashboardSummary.allAlerts,
  });
});

kpiRouter.get("/census", (_req, res) => {
  res.json({ facility: facilityInfo.shortName, data: censusData });
});

kpiRouter.get("/revenue", (_req, res) => {
  res.json({ facility: facilityInfo.shortName, data: revenueData });
});

kpiRouter.get("/labor", (_req, res) => {
  res.json({ facility: facilityInfo.shortName, data: laborData });
});

kpiRouter.get("/ar", (_req, res) => {
  res.json({ facility: facilityInfo.shortName, data: arData });
});

kpiRouter.get("/benchmarks", (_req, res) => {
  res.json({ data: benchmarks });
});

kpiRouter.get("/facility", (_req, res) => {
  res.json({ data: facilityInfo });
});
