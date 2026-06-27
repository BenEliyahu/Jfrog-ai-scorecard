export type LLMName = "ChatGPT" | "Claude" | "Gemini" | "Grok";

export type Dimension =
  | "supply_chain"
  | "vulnerability_scanning"
  | "compliance"
  | "enterprise"
  | "developer_ux";

export const DIMENSION_LABELS: Record<Dimension, string> = {
  supply_chain: "Supply Chain Security",
  vulnerability_scanning: "Vulnerability Scanning",
  compliance: "License Compliance",
  enterprise: "Enterprise Readiness",
  developer_ux: "Developer Experience",
};

export interface PromptVariation {
  id: string;
  text: string;
  dimension: Dimension;
}

export interface LLMResponse {
  llm: LLMName;
  prompt: PromptVariation;
  answer: string;
  latencyMs: number;
  error?: string;
}

export interface CompanyScore {
  company: string;
  mentionRank: number | null;
  sentiment: "positive" | "neutral" | "negative" | "not_mentioned";
  featuresAttributed: string[];
  rawScore: number;
}

export interface VariationResult {
  prompt: PromptVariation;
  llm: LLMName;
  answer: string;
  latencyMs: number;
  scores: Record<string, CompanyScore>;
}

export interface DimensionScore {
  dimension: Dimension;
  score: number; // 0-100
  mentionRate: number; // 0-100
}

export interface LLMSummary {
  llm: LLMName;
  overallScore: number;
  dimensionScores: Record<Dimension, number>;
  mentionRate: number;
  delta?: number; // vs previous scan
  isDemo?: boolean;
}

export interface ShareOfVoice {
  company: string;
  percentage: number; // % of all responses that mention this company
  totalMentions: number;
  totalResponses: number;
}

export interface CompetitiveInsight {
  type: "win" | "loss" | "neutral";
  dimension: Dimension;
  message: string;
}

export interface ScanResult {
  id: string;
  timestamp: string;
  results: VariationResult[];
  summary: ScanSummary;
}

export interface ScanSummary {
  llmSummaries: Record<LLMName, LLMSummary>;
  overallScore: number;
  overallDelta?: number;
  dimensionScores: Record<Dimension, number>;
  competitorScores: Record<string, number>;
  shareOfVoice: ShareOfVoice[];
  insights: CompetitiveInsight[];
  totalResponses: number;
}
