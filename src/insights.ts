import type { VariationResult, CompetitiveInsight, Dimension } from "./types";
import { DIMENSION_LABELS } from "./types";
import { DIMENSIONS, COMPANIES } from "./dimensions";

function avgDimensionScore(results: VariationResult[], dimension: Dimension, company: string): number {
  const matching = results.filter(r => r.prompt.dimension === dimension);
  if (matching.length === 0) return 0;
  return Math.round(matching.reduce((s, r) => s + (r.scores[company]?.rawScore ?? 0), 0) / matching.length);
}

export function generateInsights(results: VariationResult[]): CompetitiveInsight[] {
  const insights: CompetitiveInsight[] = [];
  const target = COMPANIES.target;

  for (const dim of DIMENSIONS) {
    const jfrogScore = avgDimensionScore(results, dim, target);
    const label = DIMENSION_LABELS[dim];
    let bestCompetitor = "";
    let bestScore = 0;

    for (const comp of COMPANIES.competitors) {
      const s = avgDimensionScore(results, dim, comp);
      if (s > bestScore) { bestScore = s; bestCompetitor = comp; }
    }

    if (jfrogScore >= 60 && jfrogScore > bestScore + 10) {
      insights.push({ type: "win", dimension: dim, message: `JFrog leads on ${label} (score ${jfrogScore} vs ${bestCompetitor} ${bestScore})` });
    } else if (bestScore > jfrogScore + 10) {
      insights.push({ type: "loss", dimension: dim, message: `${bestCompetitor} outperforms JFrog on ${label} (${bestScore} vs ${jfrogScore}) — opportunity to improve AI positioning` });
    } else {
      insights.push({ type: "neutral", dimension: dim, message: `${label}: competitive — JFrog ${jfrogScore} vs ${bestCompetitor} ${bestScore}` });
    }
  }

  return insights;
}
