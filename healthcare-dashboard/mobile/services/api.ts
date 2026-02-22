import axios from "axios";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";

// Update this to your machine's IP when running on a physical device
// For emulator: http://10.0.2.2:3001 (Android) | http://localhost:3001 (iOS sim)
const BASE_URL = "http://localhost:3001";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 90000, // 90s for AI responses
  headers: { "Content-Type": "application/json" },
});

// ─── KPI Endpoints ─────────────────────────────────────────────────────────────

export const fetchDashboard = async () => {
  const { data } = await api.get("/api/kpi/dashboard");
  return data;
};

export const fetchCensus = async () => {
  const { data } = await api.get("/api/kpi/census");
  return data.data;
};

export const fetchRevenue = async () => {
  const { data } = await api.get("/api/kpi/revenue");
  return data.data;
};

export const fetchLabor = async () => {
  const { data } = await api.get("/api/kpi/labor");
  return data.data;
};

export const fetchAR = async () => {
  const { data } = await api.get("/api/kpi/ar");
  return data.data;
};

export const fetchBenchmarks = async () => {
  const { data } = await api.get("/api/kpi/benchmarks");
  return data.data;
};

// ─── Agent Endpoints ──────────────────────────────────────────────────────────

export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  toolsUsed?: string[];
}

export const askAgent = async (
  message: string,
  conversationHistory: MessageParam[] = []
): Promise<{ response: string; toolsUsed: string[]; conversationHistory: MessageParam[] }> => {
  const { data } = await api.post("/api/agent/analyze", {
    message,
    conversationHistory,
  });
  return data;
};

export const fetchSuggestions = async () => {
  const { data } = await api.get("/api/agent/suggestions");
  return data.suggestions;
};
