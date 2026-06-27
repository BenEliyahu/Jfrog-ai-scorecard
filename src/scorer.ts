import type { LLMResponse, CompanyScore, VariationResult, ShareOfVoice } from "./types";
import { COMPANIES, ALL_COMPANIES } from "./dimensions";
import { analyzeResponse } from "./llm/analyzer";
import type { SingleCompanyAnalysis } from "./llm/analyzer";

function computeRawScore(analysis: SingleCompanyAnalysis, isTarget: boolean): number {
  if (!analysis.mentioned) return 0;

  const rankPts: Record<number, number> = { 1: 40, 2: 25, 3: 15 };
  let score = rankPts[analysis.mention_rank ?? 4] ?? 5;

  if (analysis.sentiment === "positive") score += 25;
  else if (analysis.sentiment === "neutral") score += 5;
  else if (analysis.sentiment === "negative") score -= 10;

  if (analysis.framing === "leader") score += 10;
  else if (analysis.framing === "strong") score += 5;
  else if (analysis.framing === "behind") score -= 5;

  if (isTarget) score += Math.min(analysis.features.length * 4, 20);

  return Math.max(0, Math.min(100, score));
}

function fallbackScore(answer: string, company: string): CompanyScore {
  const mentioned = answer.toLowerCase().includes(company.toLowerCase());
  return {
    company,
    mentionRank: mentioned ? 1 : null,
    sentiment: mentioned ? "neutral" : "not_mentioned",
    featuresAttributed: [],
    rawScore: mentioned ? 15 : 0,
  };
}

export async function scoreResponse(response: LLMResponse): Promise<VariationResult> {
  const analysis = await analyzeResponse(response.answer);
  const scores: Record<string, CompanyScore> = {};

  for (const company of ALL_COMPANIES) {
    const a = analysis?.[company as keyof typeof analysis];
    if (!a) {
      scores[company] = fallbackScore(response.answer, company);
      continue;
    }
    scores[company] = {
      company,
      mentionRank: a.mention_rank,
      sentiment: a.sentiment,
      featuresAttributed: a.features,
      rawScore: computeRawScore(a, company === COMPANIES.target),
    };
  }

  return {
    prompt: response.prompt,
    llm: response.llm,
    answer: response.answer,
    latencyMs: response.latencyMs,
    scores,
  };
}

export function computeShareOfVoice(results: VariationResult[]): ShareOfVoice[] {
  const total = results.filter(r => r.answer && !r.answer.startsWith("[ERROR")).length;
  return ALL_COMPANIES.map(company => {
    const mentions = results.filter(r => r.scores[company]?.mentionRank !== null).length;
    return {
      company,
      percentage: total > 0 ? Math.round((mentions / total) * 100) : 0,
      totalMentions: mentions,
      totalResponses: total,
    };
  });
}
