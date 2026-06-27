import "dotenv/config";
import { randomUUID } from "crypto";
import { askChatGPT } from "./llm/openai";
import { askClaude } from "./llm/anthropic";
import { askGemini } from "./llm/gemini";
import { askGrok } from "./llm/grok";
import { scoreResponse } from "./scorer";
import { generateInsights } from "./insights";
import { PROMPT_VARIATIONS, COMPANIES, DIMENSIONS } from "./dimensions";
import type {
  LLMName, VariationResult, ScanResult, ScanSummary,
  LLMSummary, Dimension, LLMResponse,
} from "./types";

const LLM_RUNNERS: Record<LLMName, (p: (typeof PROMPT_VARIATIONS)[0]) => Promise<LLMResponse>> = {
  ChatGPT: askChatGPT,
  Claude: askClaude,
  Gemini: askGemini,
  Grok: askGrok,
};

const LLMS: LLMName[] = ["ChatGPT", "Claude", "Gemini", "Grok"];

export type ScanEvent =
  | { type: "llm_start"; llm: LLMName; promptId: string }
  | { type: "llm_done"; llm: LLMName; promptId: string; ok: boolean; latencyMs: number; demo?: boolean }
  | { type: "analyzing"; count: number; total: number }
  | { type: "complete"; result: ScanResult };

async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try { return await fn(); }
    catch (err) {
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, 800 * (i + 1)));
    }
  }
  throw new Error("unreachable");
}

function avgScore(results: VariationResult[], llm: LLMName, company: string): number {
  const r = results.filter(x => x.llm === llm);
  if (!r.length) return 0;
  return Math.round(r.reduce((s, x) => s + (x.scores[company]?.rawScore ?? 0), 0) / r.length);
}

function dimAvg(results: VariationResult[], llm: LLMName, dim: Dimension): number {
  const r = results.filter(x => x.llm === llm && x.prompt.dimension === dim);
  if (!r.length) return 0;
  return Math.round(r.reduce((s, x) => s + (x.scores[COMPANIES.target]?.rawScore ?? 0), 0) / r.length);
}

function buildSummary(results: VariationResult[], prevScore?: number): ScanSummary {
  const llmSummaries: Record<LLMName, LLMSummary> = {} as any;

  for (const llm of LLMS) {
    const llmResults = results.filter(r => r.llm === llm);
    const overall = avgScore(results, llm, COMPANIES.target);
    const dimensionScores = Object.fromEntries(
      DIMENSIONS.map(d => [d, dimAvg(results, llm, d)])
    ) as Record<Dimension, number>;
    const mentioned = llmResults.filter(r => r.scores[COMPANIES.target]?.mentionRank !== null).length;
    const isDemo = llm === "Grok" && llmResults.some(r => r.answer.startsWith("[DEMO"));

    llmSummaries[llm] = {
      llm, overallScore: overall, dimensionScores,
      mentionRate: llmResults.length ? Math.round((mentioned / llmResults.length) * 100) : 0,
      isDemo,
    };
  }

  const overallScore = Math.round(
    LLMS.reduce((s, l) => s + llmSummaries[l].overallScore, 0) / LLMS.length
  );

  const dimensionScores = Object.fromEntries(
    DIMENSIONS.map(dim => {
      const r = results.filter(x => x.prompt.dimension === dim);
      return [dim, r.length
        ? Math.round(r.reduce((s, x) => s + (x.scores[COMPANIES.target]?.rawScore ?? 0), 0) / r.length)
        : 0];
    })
  ) as Record<Dimension, number>;

  const competitorScores = Object.fromEntries(
    COMPANIES.competitors.map(comp => [
      comp,
      Math.round(results.reduce((s, r) => s + (r.scores[comp]?.rawScore ?? 0), 0) / results.length),
    ])
  );

  return {
    llmSummaries, overallScore,
    overallDelta: prevScore !== undefined ? overallScore - prevScore : undefined,
    dimensionScores, competitorScores,
    shareOfVoice: computeSOV(results),
    insights: generateInsights(results),
    totalResponses: results.length,
  };
}

function computeSOV(results: VariationResult[]) {
  const total = results.filter(r => r.answer && !r.answer.startsWith("[ERROR")).length;
  return [COMPANIES.target, ...COMPANIES.competitors].map(company => ({
    company,
    percentage: total > 0 ? Math.round(results.filter(r => r.scores[company]?.mentionRank !== null).length / total * 100) : 0,
    totalMentions: results.filter(r => r.scores[company]?.mentionRank !== null).length,
    totalResponses: total,
  }));
}

export async function runScan(
  prevScore: number | undefined,
  emit: (event: ScanEvent) => void,
): Promise<ScanResult> {
  const rawResponses: LLMResponse[] = [];

  // Phase 1: collect all LLM responses
  for (const prompt of PROMPT_VARIATIONS) {
    await Promise.all(LLMS.map(async llm => {
      emit({ type: "llm_start", llm, promptId: prompt.id });
      try {
        const res = await withRetry(() => LLM_RUNNERS[llm](prompt));
        rawResponses.push(res);
        emit({
          type: "llm_done", llm, promptId: prompt.id,
          ok: !res.error, latencyMs: res.latencyMs,
          demo: res.answer.startsWith("[DEMO"),
        });
      } catch (err) {
        rawResponses.push({ llm, prompt, answer: `[ERROR] ${String(err)}`, latencyMs: 0, error: String(err) });
        emit({ type: "llm_done", llm, promptId: prompt.id, ok: false, latencyMs: 0 });
      }
    }));
  }

  // Phase 2: LLM-based analysis (scored one by one)
  const results: VariationResult[] = [];
  let analyzed = 0;
  for (const response of rawResponses) {
    results.push(await scoreResponse(response));
    analyzed++;
    emit({ type: "analyzing", count: analyzed, total: rawResponses.length });
  }

  const result: ScanResult = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    results,
    summary: buildSummary(results, prevScore),
  };

  emit({ type: "complete", result });
  return result;
}
