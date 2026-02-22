import { Router } from "express";
import { runSNFAgent } from "../agent/snfAgent.js";
import type { Anthropic } from "@anthropic-ai/sdk";

export const agentRouter = Router();

agentRouter.post("/analyze", async (req, res) => {
  try {
    const { message, conversationHistory } = req.body as {
      message: string;
      conversationHistory?: Anthropic.MessageParam[];
    };

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      res.status(400).json({ error: "message is required" });
      return;
    }

    const result = await runSNFAgent({
      message: message.trim(),
      conversationHistory: conversationHistory || [],
    });

    res.json({
      response: result.response,
      toolsUsed: result.toolsUsed,
      conversationHistory: result.conversationHistory,
    });
  } catch (err) {
    console.error("Agent error:", err);
    const message = err instanceof Error ? err.message : "Agent error";
    res.status(500).json({ error: message });
  }
});

// Suggested questions for quick access
agentRouter.get("/suggestions", (_req, res) => {
  res.json({
    suggestions: [
      {
        category: "Census",
        icon: "bed",
        questions: [
          "Analyze our census performance and give me a 30-day action plan to reach 95% occupancy",
          "What's driving our Medicare Part A census below budget and how do we fix it?",
          "How should we optimize our payer mix to maximize revenue per patient day?",
        ],
      },
      {
        category: "Revenue",
        icon: "dollar-sign",
        questions: [
          "Our PDPM rate is $15 below budget — what MDS coding improvements could close that gap?",
          "Analyze our revenue variance and identify the top 3 revenue recovery opportunities",
          "How do our per diem rates compare to competitors and what's our negotiation strategy?",
        ],
      },
      {
        category: "Labor",
        icon: "users",
        questions: [
          "Our CNA agency usage is at 12% — create a 60-day plan to reduce it to under 5%",
          "Analyze our labor spend vs. budget and recommend staffing optimizations",
          "With 42% turnover, what are the top retention strategies with the highest ROI?",
        ],
      },
      {
        category: "AR & Collections",
        icon: "trending-up",
        questions: [
          "Our Private Pay DSO is 62 days — provide a specific collections escalation protocol",
          "Analyze our 120+ day AR and recommend write-off vs. collection agency strategy",
          "What's causing our Medicaid DSO to creep up and what should we do?",
        ],
      },
      {
        category: "Overall",
        icon: "activity",
        questions: [
          "Give me a comprehensive executive summary of our facility performance with top 5 priorities",
          "If we could only fix 3 things this month, what would have the biggest financial impact?",
          "How do we compare to state and national benchmarks across all KPIs?",
        ],
      },
    ],
  });
});
