# JFrog AI Perception Scorecard

A dynamic web dashboard that measures **how major AI assistants perceive JFrog** in the software security domain, benchmarked against **Sonatype** and **Snyk**.

## Live Demo

**[https://jfrog-ai-scorecard.onrender.com](https://jfrog-ai-scorecard.onrender.com)**

> First load may take ~30 seconds (free tier cold start). Click **Run New Scan** to trigger a live scan across all 4 LLMs.

Each scan sends **25 security-focused prompts** to **4 real LLMs** (ChatGPT, Llama 3, Llama 4, Qwen 3), uses a second AI layer (GPT-4o-mini) to analyze every response with structured output, and surfaces the results as live scores, radar charts, trend lines, and competitive insights.

---

## Screenshots

### Hero — overall score, Share of Voice, competitor comparison, per-LLM gauges
![Dashboard overview](screenshots/dashboard.png)

### Radar chart (5 dimensions) + Score Trend over time
![Radar and trend](screenshots/radar.png)

### Dimension Scores with Confidence Intervals
![Confidence intervals](screenshots/confidence.png)

### Q&A — question-by-question scores with expandable raw LLM answers
![Q&A section](screenshots/qa.png)

---

## Proposed Solution

The core problem: how do you objectively measure what AI assistants "think" about JFrog relative to competitors? Keyword matching fails — LLMs write sentences like *"JFrog has established itself as a formidable force in enterprise artifact security"* that no regex captures correctly.

**The approach: LLM-as-judge.**

A second LLM (GPT-4o-mini) reads each response and returns a structured verdict — mention rank, sentiment, framing, and attributed features — per company. This gives natural language understanding without hand-coded rules.

| Design choice | Rationale |
|---|---|
| 5 prompt variations per dimension | Single prompts are noisy — minor phrasing shifts LLM answers. Averaging 5 reduces variance. |
| 5 security dimensions | Collapses a complex market into measurable axes rather than a single generic score. |
| Server-Sent Events for progress | A scan takes 2–3 min. SSE streams live per-LLM status without polling or WebSocket overhead. |
| Confidence intervals (±std dev) | Reveals whether a score is stable across models or model-dependent — critical for trustworthiness. |
| PROMPTED badge | 2 of 25 prompts name JFrog explicitly. Flagged and separated from the unprompted baseline. |
| MongoDB Atlas for history | Persistent scan history across restarts. Trend chart populates after 2+ scans. |

---

## Architecture

```
Browser (Chart.js UI)
       │  SSE stream — live progress per LLM and prompt
       ▼
Express Server  ──► POST /api/scan
       │
       ├── Phase 1: LLM Responses
       │     25 prompts × 4 LLMs = 100 API calls
       │     ChatGPT (OpenAI) · Llama 3, Llama 4, Qwen 3 (Groq — free)
       │     Groq: sequential per prompt + 500ms gap (free-tier rate limits)
       │     ↓ SSE: llm_start / llm_done after each call
       │
       └── Phase 2: Analysis
             GPT-4o-mini reads each of the 100 responses
             Zod schema enforces typed JSON output:
             { mention_rank, sentiment, framing, features[] }
             ↓ SSE: analyzing N/100
             ↓ append result to MongoDB Atlas (jfrog-scorecard.scans)
```

### Key files

| File | Role |
|---|---|
| `src/dimensions.ts` | 25 prompt variations (5 per dimension), company list, JFrog feature vocabulary |
| `src/llm/openai.ts` | ChatGPT connector |
| `src/llm/groq-models.ts` | Llama 3, Llama 4, Qwen 3 via Groq; strips Qwen 3 `<think>` tags |
| `src/llm/analyzer.ts` | GPT-4o-mini with Zod structured output — returns verdict per company |
| `src/scorer.ts` | Converts verdict → numeric score (0–100) |
| `src/scanner.ts` | Orchestrates phases 1–2, emits SSE events throughout |
| `src/server.ts` | Express: serves dashboard, handles `/api/scan`, persists history |
| `public/index.html` | Single-page dashboard — Chart.js, no framework |

---

## Setup

### Prerequisites

- Node.js 18+
- OpenAI API key — ChatGPT responses + GPT-4o-mini analysis layer
- Groq API key (free) — Llama 3, Llama 4, Qwen 3 · [console.groq.com](https://console.groq.com)

### Install

```bash
git clone https://github.com/BenEliyahu/Jfrog-ai-scorecard.git
cd Jfrog-ai-scorecard
npm install
```

### Configure

Create `.env` in the project root:

```env
OPENAI_API_KEY=sk-...
GROQ_API_KEY=gsk_...
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/
```

### Run

```bash
npm run dev
```

Open **http://localhost:3000** and click **Run New Scan**. A full scan takes approximately 2–3 minutes. Run a second scan to populate the trend chart.

---

## Scoring model

GPT-4o-mini analyzes each LLM response and returns a structured verdict per company:

```
mention_rank    1st / 2nd / 3rd / not mentioned
sentiment       positive / neutral / negative
framing         leader / strong / competitive / behind
features        list of attributed product capabilities
```

Mapped to a 0–100 score:

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
| Each JFrog feature attributed (max 5) | +4 |

Scores across 5 prompt variations per dimension are averaged, then averaged across all 4 LLMs to produce the overall score. **Score 0 = company not mentioned** — a perception gap, not a data error.

---

## Sample results

Two real scans — 4 LLMs × 25 prompts = **100 responses per scan**:

| Dimension | JFrog | Snyk | Sonatype |
|---|---|---|---|
| Enterprise Readiness | **69** ±12 | 12 ±3 | 32 ±4 |
| License Compliance | **26** ±3 | 19 ±9 | 13 ±4 |
| Supply Chain | 30 ±6 | **37** ±9 | 20 ±5 |
| Vulnerability Scanning | 20 ±11 | **33** ±10 | 13 ±6 |
| Developer UX | 27 ±3 | **36** ±7 | 14 ±1 |

**Overall: JFrog 34 · Snyk 27 · Sonatype 18**
**Share of Voice (rank-1 mentions): JFrog 41% · Snyk 34% · Sonatype 7%**

JFrog dominates Enterprise Readiness (69 vs Snyk 12) but trails on Vulnerability Scanning and Developer UX — a perception gap, not a product gap. JFrog Xray and Frogbot cover these areas; the gap reflects LLM training data, not product capability.

---

## What's built

- 25 security prompts × 4 LLMs = 100 real responses per scan — no mock data
- LLM-as-judge: GPT-4o-mini + Zod structured output — no regex, no keyword matching
- Live SSE progress panel — per-LLM, per-prompt status in real time
- Overall score with Δ vs. previous scan
- Share of Voice — % of responses where each company is named first
- Radar chart — 5 dimensions × 3 companies
- Score Trend — tracks perception across consecutive scans
- Confidence intervals — mean ± std dev across 4 LLMs per dimension
- Competitive insights — auto-generated win/loss/neutral per dimension
- PROMPTED badge — separates biased prompts from unprompted baseline
- Unprompted score — bias-free baseline shown separately per dimension
- Recommendations — color-coded action cards generated from dimension scores
- PDF export — single-click dashboard download
- Collapsible raw LLM responses — full audit trail per question and per model

---

## Challenges

**LLM non-determinism** — Even at `temperature: 0`, outputs vary across runs. The 5-variation averaging reduces variance; confidence intervals make remaining uncertainty visible.

**Groq rate limits** — 100 API calls per scan on a free tier. Fixed by running Groq models sequentially per prompt with a 500ms gap and a `withRetry` wrapper with exponential backoff.

**Model deprecations mid-development** — Groq deprecated Mixtral and Gemma2 during development. Replaced with Llama 4 Scout and Qwen 3. Each LLM connector is a self-contained file — swapping is a one-line change.

**Qwen 3 thinking tokens** — Qwen 3 prefixes answers with `<think>...</think>` reasoning blocks. Stripped via regex in `groq-models.ts` before analysis.

**PROMPTED bias** — Two prompts name JFrog explicitly, guaranteeing a mention and inflating scores. Flagged with a PROMPTED badge; unprompted averages shown separately per dimension.

**Analyzer self-reference** — GPT-4o-mini (the analyzer) and ChatGPT (one subject) are both OpenAI models. Documented as a known bias; production mitigation would rotate the analyzer across vendors.

---

## Future steps

The current build is a fully functional Stage 1 baseline. Given more time and resources, the following would be prioritised in order of business impact:

**High impact, low effort**
- **Score breakdown drill-down** — clicking any score shows the exact rank/sentiment/framing/features split that produced it. Currently the score is opaque.
- **CSV / JSON export** — one-click export of raw per-response data for analysts who prefer Excel pivot tables over charts.
- **Scheduled scans + Slack alerts** — cron-triggered weekly scans with a webhook notification when any dimension score shifts by more than a configurable threshold.

**High impact, higher effort**
- **Add Claude, Gemini, Grok** — the LLMs named in the brief. Each requires a new connector file (~30 lines). Withheld here due to API access and cost; architecture supports it with a one-line addition.
- **Rotating the analyzer** — GPT-4o-mini currently analyzes all responses including ChatGPT's. Rotating the judge (e.g. Claude analyzes OpenAI responses, GPT-4o-mini analyzes Groq responses) eliminates same-vendor bias.
- **Phrase extraction / word cloud** — which exact words and phrases do LLMs associate with JFrog vs Snyk? Surfaces content gaps more precisely than dimension scores alone.
- **Multi-domain coverage** — extend prompts beyond Security into DevOps, CI/CD pipelines, and container management where JFrog also competes.

**Longer term**
- **Ground truth validation** — pair perception scores with actual capability benchmarks (e.g. run Xray against a known CVE dataset) to quantify the perception gap vs. product reality.
- **Competitive event detection** — flag scan-over-scan drops in competitor scores that correlate with press releases, blog posts, or conference talks, turning the scoreboard into a signal tracker.
- **Self-service prompt editor** — let the CI team add or modify prompts without touching code, backed by a simple admin UI and versioned prompt history.

---

## References

- [OpenAI Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)
- [Groq API documentation](https://console.groq.com/docs)
- [Zod schema validation](https://zod.dev)
- [Chart.js documentation](https://www.chartjs.org/docs/)
- [Server-Sent Events — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [html2canvas](https://html2canvas.hertzen.com/) + [jsPDF](https://github.com/parallax/jsPDF)
