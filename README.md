# JFrog AI Scorecard

A dynamic web dashboard that measures **how JFrog is perceived by major AI assistants** (ChatGPT, Claude, Gemini, Grok) in the software security domain, benchmarked against two direct competitors — **Sonatype** and **Snyk**.

Each scan sends 15 security-focused prompts to every LLM, uses a second AI layer (GPT-4o-mini) to analyze the responses with structured output, and surfaces the results as live scores, radar charts, trend lines, and competitive insights.

---

## Architecture

```
Browser (Chart.js UI)
       │  SSE stream (live progress)
       ▼
Express Server  ──► /api/scan  ──────────────────────────────────────┐
       │                                                              │
       │                      Phase 1: LLM Responses                 │
       │              ┌───────────────────────────────────┐           │
       │              │  15 prompts × 4 LLMs (parallel)   │           │
       │              │  ChatGPT · Claude · Gemini · Grok  │           │
       │              └───────────────────────────────────┘           │
       │                                                              │
       │                      Phase 2: Analysis                       │
       │              ┌───────────────────────────────────┐           │
       │              │  GPT-4o-mini analyzes each answer  │           │
       │              │  → mention rank, sentiment,        │           │
       │              │    features, framing (Zod schema)  │           │
       │              └───────────────────────────────────┘           │
       │                                                              │
       └──────────────── ScanResult ──► data/results.json ───────────┘
```

### Key files

| File | Role |
|---|---|
| `src/dimensions.ts` | 15 prompt variations (3 per security dimension) + company list |
| `src/llm/analyzer.ts` | GPT-4o-mini analysis with Zod structured output |
| `src/scorer.ts` | Converts analysis → numeric scores (rank + sentiment + framing + features) |
| `src/scanner.ts` | Orchestrates both phases, emits Server-Sent Events |
| `src/server.ts` | Express server: SSE endpoint + history persistence |
| `public/index.html` | Single-page dashboard (Chart.js, no framework) |

---

## Setup

### Prerequisites

- Node.js 18+
- API keys for the LLMs you want to include

### Install

```bash
npm install
```

### Environment variables

Create a `.env` file in the project root:

```env
# Required
OPENAI_API_KEY=sk-...

# Optional — without these the LLM is skipped or runs in demo mode
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
XAI_API_KEY=xai-...        # Grok — falls back to realistic mock data if absent
```

Free tiers:
- **Gemini** — free via [Google AI Studio](https://aistudio.google.com/app/apikey)
- **Grok** — requires X Premium or XAI developer access; the app runs in demo mode without it

### Run

```bash
npm run dev        # development (tsx, hot reload)
npm run build      # compile TypeScript
npm start          # run compiled output
```

Open `http://localhost:3000`, click **Run Scan**, and watch the live progress panel.

---

## Scoring model

Each LLM response is analyzed by GPT-4o-mini and returns a structured object per company:

```
mention_rank    1st / 2nd / 3rd / not mentioned
sentiment       positive / neutral / negative / not_mentioned
framing         leader / strong / competitive / behind / not_mentioned
features        list of attributed product features
```

These map to a 0–100 score:

| Signal | Points |
|---|---|
| Mentioned 1st | +40 |
| Mentioned 2nd | +25 |
| Mentioned 3rd | +15 |
| Mentioned later | +5 |
| Positive sentiment | +25 |
| Neutral sentiment | +5 |
| Negative sentiment | −10 |
| Framed as leader | +10 |
| Framed as strong | +5 |
| Framed as behind | −5 |
| Each feature attributed (JFrog only, max 5) | +4 |

Scores across 3 prompt variations per dimension are averaged, then averaged across all 4 LLMs to produce an overall score.

---

## Design decisions

**Why 3 prompts per dimension?**  
Single-prompt results are noisy — minor phrasing changes shift LLM answers significantly. Averaging 3 variations per dimension reduces this variance.

**Why GPT-4o-mini for analysis?**  
Structured output via `zodResponseFormat` gives deterministic JSON. It correctly handles nuanced language ("established itself as a formidable force") that keyword matching misses entirely. Cost is ~$0.01–0.02 per full scan.

**Why Server-Sent Events?**  
A full scan takes 2–3 minutes (60 LLM calls). SSE lets the browser show live per-LLM progress without polling, with no WebSocket overhead.

**Why in-memory JSON history?**  
Zero infrastructure dependency — runs with `npm run dev`. For production, a Postgres or Redis store would replace `data/results.json`.

**Known bias:** GPT-4o-mini (the analyzer) and ChatGPT (one of the subjects) are both OpenAI models. The analyzer may score ChatGPT-sourced answers more favorably. A production system would rotate analyzers or use a neutral third-party model.

---

## What's built now vs. future steps

### Stage 1 — Built ✅

- [x] 15 security prompts × 4 LLMs = 60 raw responses per scan
- [x] LLM-based analysis (GPT-4o-mini + Zod) replacing keyword/regex scoring
- [x] Live SSE progress panel per LLM (pending / running / done / demo / error)
- [x] Overall score with delta vs. previous scan
- [x] Share of Voice (% of responses mentioning each company)
- [x] Radar chart: 5 dimensions × 3 companies
- [x] Trend line chart from scan history
- [x] Competitive insights (win/loss/neutral per dimension)
- [x] Collapsible raw LLM responses for full transparency
- [x] Grok demo mode — 15 pre-written realistic answers when XAI key is absent

### Stage 2 — Planned (not yet implemented)

- [ ] **JFrog Free Trial integration** — scan a real artifact repository, run JFrog Xray against a CVE, capture actual scan output
- [ ] **GitHub Actions CI/CD pipeline** — push to GitHub → Actions → Docker build → push to JFrog Artifactory → Xray security gate
- [ ] **Artifactory Docker registry** — replace Docker Hub with a self-hosted Artifactory registry
- [ ] **Fork a public repo** — fork a vulnerable open source project, apply Xray policy, demonstrate block/allow behavior
- [ ] **Compare AI advice vs. JFrog reality** — show where LLM perception diverges from actual Xray scan results (ground truth validation)

### Further improvements

- Rotate the analyzer model to reduce OpenAI-vs-OpenAI bias
- Schedule daily scans via cron and track perception trends over time
- Expand to more LLMs (Llama, Mistral, Perplexity)
- Add Slack/email alerts when JFrog score drops below a threshold

---

## Challenges and pitfalls

**LLM non-determinism**  
Even with `temperature: 0`, LLMs produce different answers across runs. A single-run score is directional, not definitive. The 3-variation averaging helps but doesn't eliminate variance.

**Rate limits and latency**  
Phase 1 runs 15 prompts × 4 LLMs concurrently per prompt batch. Gemini's free tier (60 req/min) can throttle mid-scan. The `withRetry` wrapper handles transient failures with exponential backoff (800ms × attempt).

**Grok API availability**  
Grok (XAI) has limited free access. The demo mode with 15 pre-written responses ensures the dashboard is always presentable, but those answers don't reflect live model behavior.

**Analyzer self-reference**  
Prompts that explicitly mention JFrog (e.g., "How does JFrog compare to...") guarantee a mention and bias scores upward. These are included intentionally to test how LLMs frame JFrog when prompted directly, but should be weighted separately from unprompted mentions.

**Score gaming**  
Scores reflect AI perception, not product quality. A competitor could improve their score simply by publishing more SEO-optimized content that gets into LLM training data. This is a measurement tool, not a ground-truth benchmark.

---

## References

- [OpenAI Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)
- [Anthropic Claude API](https://docs.anthropic.com/en/api/getting-started)
- [Google Gemini API](https://ai.google.dev/gemini-api/docs)
- [XAI / Grok API](https://docs.x.ai/api)
- [Zod schema validation](https://zod.dev)
- [Chart.js documentation](https://www.chartjs.org/docs/)
- [Server-Sent Events (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
