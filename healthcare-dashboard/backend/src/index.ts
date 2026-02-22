import "dotenv/config";
import express from "express";
import cors from "cors";
import { kpiRouter } from "./routes/kpi.js";
import { agentRouter } from "./routes/agent.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "SNF Healthcare Dashboard API", timestamp: new Date().toISOString() });
});

app.use("/api/kpi", kpiRouter);
app.use("/api/agent", agentRouter);

app.listen(PORT, () => {
  console.log(`\n🏥 SNF Healthcare Dashboard API`);
  console.log(`   Listening on http://localhost:${PORT}`);
  console.log(`   Anthropic key: ${process.env.ANTHROPIC_API_KEY ? "✓ loaded" : "✗ MISSING"}\n`);
});
