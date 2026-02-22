import Anthropic from "@anthropic-ai/sdk";
import {
  censusData,
  revenueData,
  laborData,
  arData,
  benchmarks,
  facilityInfo,
  dashboardSummary,
} from "../data/mockData.js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SNF_SYSTEM_PROMPT = `You are SNF Advisor Pro — a masterclass AI consultant specializing exclusively in Skilled Nursing Facility (SNF) operations. You combine the expertise of a seasoned Administrator, Director of Nursing, Revenue Cycle Director, and CFO — with 20+ years of SNF-specific experience.

## Your Deep Expertise Spans:

### Census & Admissions:
- Payer mix optimization (Medicare Part A, Part B, Medicaid, Managed Care, Private Pay, Hospice)
- PDPM case mix index tracking and census-to-revenue correlation
- Hospital referral source development and liaison strategy
- Length of stay optimization by payer (short-stay Medicare vs. long-stay Medicaid)
- Occupancy benchmarking: state, national, and top-quartile comparisons
- Managed care authorization management and concurrent review
- Marketing ROI and census census-building action plans

### Revenue Cycle (Medicare/Medicaid):
- PDPM (Patient Driven Payment Model) — all 5 components: PT, OT, SLP, Nursing, NTA
- MDS accuracy, coding, and CAA documentation impact on reimbursement
- RUG-IV historical knowledge and transition to PDPM
- Medicare Value-Based Purchasing (VBP) — rehospitalization metric
- Medicaid rate structures: state plan, case mix, and supplemental payments
- Managed care contract analysis, rate negotiation, and stop-loss provisions
- Private pay rate-setting, room rate escalation, and deposits
- Revenue per patient day (RPPD) optimization strategies

### Labor & Staffing:
- CMS minimum staffing requirements (3.48 total HPPD; 0.55 RN HPPD effective 2025)
- Payroll-Based Journal (PBJ) submission accuracy and STAR rating impact
- HPPD benchmarking (national: 3.65; top quartile: 4.10+)
- Agency vs. permanent staff cost-benefit analysis
- Nursing staff scheduling: 8hr vs 12hr shifts, self-scheduling, float pools
- CNA, LPN, RN skill mix and overtime management (<6% target)
- Staff retention, turnover root cause analysis (national avg: 50%)
- Therapy productivity standards under PDPM (minutes per visit, group/concurrent)
- Labor cost as % of revenue benchmarks (target: <52% skilled, <55% traditional)

### AR & Collections:
- Days Sales Outstanding (DSO) by payer type:
  * Medicare Part A target: ≤18 days
  * Medicaid target: ≤45 days
  * Private Pay target: ≤45 days
  * Managed Care target: ≤35 days
- UB-04 billing accuracy and claim scrubbing
- Medicare denial management: medical necessity, NCD/LCD compliance, ADRs
- Medicaid prior authorization and retroactive eligibility
- Managed care concurrent review and appeal processes
- Aging bucket action protocols: 30/60/90/120+ day strategies
- RAC (Recovery Audit Contractor) and ZPIC audit preparedness
- Credit balance resolution and CMS timely filing rules
- Bad debt write-off policies and collection agency partnerships

### Quality & Regulatory:
- CMS 5-Star Quality Rating System (Health Inspection, Staffing, Quality Measures)
- CASPER reports, MDS-based quality measures, and QAPI
- State survey cycles and deficiency citation management
- Infection control, antipsychotic reduction, pressure ulcer prevention
- Emergency preparedness (PHASR, EOC drills)

## Analysis Framework:
When analyzing KPI data, always:
1. **Benchmark**: Compare to facility budget, state average, national average, and top quartile
2. **Root cause**: Identify the 1-3 primary drivers behind variances
3. **Financial impact**: Quantify issues in dollars (per month / per year)
4. **Action plan**: Provide 3-5 prioritized, specific, implementable recommendations
5. **Timeline**: Suggest 30/60/90-day milestones for each action
6. **Accountability**: Name which role is responsible (Administrator, DON, Business Office, etc.)

## Communication Style:
- Lead with the most financially significant finding
- Use SNF industry terminology accurately and precisely
- Provide specific numbers, not vague suggestions
- Acknowledge trade-offs (e.g., increasing Medicare census vs. managing HPPD)
- Flag regulatory risks clearly
- Be direct and action-oriented — executives need clarity, not caveats

The current facility data will be provided in each query. Always ground your analysis in the specific numbers provided.`;

// ─── Tool Definitions ──────────────────────────────────────────────────────────

const tools: Anthropic.Tool[] = [
  {
    name: "get_census_analysis",
    description:
      "Retrieves detailed census data and calculates census KPI metrics including occupancy rate, payer mix percentages, ADC trends, and comparison to benchmarks.",
    input_schema: {
      type: "object" as const,
      properties: {
        focus: {
          type: "string",
          enum: ["overall", "payer_mix", "admissions", "trends"],
          description: "The specific census area to analyze",
        },
      },
      required: ["focus"],
    },
  },
  {
    name: "get_revenue_analysis",
    description:
      "Retrieves revenue data including per diem rates, PDPM components, revenue by payer, monthly trends, and budget variances.",
    input_schema: {
      type: "object" as const,
      properties: {
        focus: {
          type: "string",
          enum: ["overall", "per_diem", "pdpm", "budget_variance", "trends"],
          description: "The specific revenue area to analyze",
        },
      },
      required: ["focus"],
    },
  },
  {
    name: "get_labor_analysis",
    description:
      "Retrieves labor/staffing data including HPPD by staff type, FTEs, agency utilization, overtime, turnover, and labor cost analysis.",
    input_schema: {
      type: "object" as const,
      properties: {
        focus: {
          type: "string",
          enum: ["overall", "hppd", "agency", "overtime", "cost", "compliance"],
          description: "The specific labor area to analyze",
        },
      },
      required: ["focus"],
    },
  },
  {
    name: "get_ar_analysis",
    description:
      "Retrieves accounts receivable and collections data including DSO by payer, aging buckets, denial management, and collection rates.",
    input_schema: {
      type: "object" as const,
      properties: {
        focus: {
          type: "string",
          enum: ["overall", "dso", "aging", "denials", "collections"],
          description: "The specific AR/collections area to analyze",
        },
      },
      required: ["focus"],
    },
  },
  {
    name: "get_benchmarks",
    description:
      "Retrieves national and state benchmark data to compare the facility's performance against industry standards.",
    input_schema: {
      type: "object" as const,
      properties: {
        category: {
          type: "string",
          enum: ["all", "census", "revenue", "labor", "ar"],
          description: "The category of benchmarks to retrieve",
        },
      },
      required: ["category"],
    },
  },
  {
    name: "get_dashboard_overview",
    description:
      "Retrieves the high-level dashboard summary with all KPI statuses, overall health score, and active alerts.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];

// ─── Tool Execution ─────────────────────────────────────────────────────────────

function executeTool(name: string, input: Record<string, string>): string {
  switch (name) {
    case "get_census_analysis": {
      const data = { facility: facilityInfo.name, ...censusData };
      return JSON.stringify(data, null, 2);
    }
    case "get_revenue_analysis": {
      const data = { facility: facilityInfo.name, ...revenueData };
      return JSON.stringify(data, null, 2);
    }
    case "get_labor_analysis": {
      const data = { facility: facilityInfo.name, ...laborData };
      return JSON.stringify(data, null, 2);
    }
    case "get_ar_analysis": {
      const data = { facility: facilityInfo.name, ...arData };
      return JSON.stringify(data, null, 2);
    }
    case "get_benchmarks": {
      const category = input.category || "all";
      if (category === "all") return JSON.stringify(benchmarks, null, 2);
      const categoryMap: Record<string, object> = {
        census: {
          occupancyRate: { national: benchmarks.national.occupancyRate, state: benchmarks.stateAZ.occupancyRate },
          medicareAdcPct: { national: benchmarks.national.medicareAdcPct, state: benchmarks.stateAZ.medicareAdcPct },
        },
        revenue: {
          medicarePerDiem: { national: benchmarks.national.medicarePerDiem, state: benchmarks.stateAZ.medicarePerDiem },
          laborCostPct: { national: benchmarks.national.laborCostPct, state: benchmarks.stateAZ.laborCostPct },
        },
        labor: {
          totalHPPD: { national: benchmarks.national.totalHPPD, state: benchmarks.stateAZ.totalHPPD },
          rnHPPD: { national: benchmarks.national.rnHPPD, state: benchmarks.stateAZ.rnHPPD },
          turnoverRate: { national: benchmarks.national.turnoverRate, state: benchmarks.stateAZ.turnoverRate },
        },
        ar: {
          overallDSO: { national: benchmarks.national.overallDSO, state: benchmarks.stateAZ.overallDSO },
          collectionRate: { national: benchmarks.national.collectionRate, state: benchmarks.stateAZ.collectionRate },
        },
      };
      return JSON.stringify(categoryMap[category] || benchmarks, null, 2);
    }
    case "get_dashboard_overview": {
      return JSON.stringify(
        { facility: facilityInfo, summary: dashboardSummary },
        null,
        2
      );
    }
    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

// ─── Main Agent Function ───────────────────────────────────────────────────────

export interface AgentRequest {
  message: string;
  conversationHistory?: Anthropic.MessageParam[];
}

export interface AgentResponse {
  response: string;
  thinking?: string;
  toolsUsed: string[];
  conversationHistory: Anthropic.MessageParam[];
}

export async function runSNFAgent(request: AgentRequest): Promise<AgentResponse> {
  const messages: Anthropic.MessageParam[] = [
    ...(request.conversationHistory || []),
    { role: "user", content: request.message },
  ];

  const toolsUsed: string[] = [];
  let finalText = "";
  let thinkingText = "";

  // Agentic loop
  while (true) {
    const response = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 8192,
      thinking: { type: "adaptive" },
      system: SNF_SYSTEM_PROMPT,
      tools,
      messages,
    });

    // Collect thinking and text blocks
    for (const block of response.content) {
      if (block.type === "thinking") {
        thinkingText += block.thinking;
      } else if (block.type === "text") {
        finalText += block.text;
      }
    }

    // If done, break
    if (response.stop_reason === "end_turn") {
      messages.push({ role: "assistant", content: response.content });
      break;
    }

    // Handle tool calls
    if (response.stop_reason === "tool_use") {
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );

      messages.push({ role: "assistant", content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = toolUseBlocks.map((tool) => {
        toolsUsed.push(tool.name);
        const result = executeTool(tool.name, tool.input as Record<string, string>);
        return {
          type: "tool_result",
          tool_use_id: tool.id,
          content: result,
        };
      });

      messages.push({ role: "user", content: toolResults });
    } else {
      // Unexpected stop reason
      break;
    }
  }

  return {
    response: finalText,
    thinking: thinkingText || undefined,
    toolsUsed,
    conversationHistory: messages,
  };
}
