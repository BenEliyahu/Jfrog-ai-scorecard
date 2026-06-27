import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { ALL_COMPANIES } from "../dimensions";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CompanyAnalysis = z.object({
  mentioned: z.boolean(),
  mention_rank: z.number().nullable(),
  sentiment: z.enum(["positive", "neutral", "negative", "not_mentioned"]),
  features: z.array(z.string()),
  framing: z.enum(["leader", "strong", "competitive", "behind", "not_mentioned"]),
});

const AnalysisSchema = z.object({
  JFrog: CompanyAnalysis,
  Sonatype: CompanyAnalysis,
  Snyk: CompanyAnalysis,
});

export type AnalysisResult = z.infer<typeof AnalysisSchema>;
export type SingleCompanyAnalysis = z.infer<typeof CompanyAnalysis>;

const SYSTEM_PROMPT = `You are a competitive intelligence analyst specializing in DevSecOps and software supply chain security.

Analyze the given LLM response and for each company (JFrog, Sonatype, Snyk) determine:
- mentioned: was the company referenced?
- mention_rank: order of first mention (1=first, 2=second, null=not mentioned)
- sentiment: how the response frames the company (positive/neutral/negative/not_mentioned)
- features: specific products or capabilities mentioned (e.g. "Xray", "Artifactory", "supply chain", "Nexus", "vulnerability scanning")
- framing: competitive positioning (leader/strong/competitive/behind/not_mentioned)

Be precise. Only mark sentiment as "positive" if the response explicitly praises or recommends. "neutral" if mentioned factually. "negative" if criticized or described as lacking.`;

export async function analyzeResponse(answer: string): Promise<AnalysisResult | null> {
  if (!answer || answer.startsWith("[ERROR") || answer.length < 20) return null;

  try {
    const completion = await client.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Analyze this response:\n\n${answer}` },
      ],
      response_format: zodResponseFormat(AnalysisSchema, "analysis"),
      max_tokens: 400,
      temperature: 0,
    });
    return completion.choices[0]?.message.parsed ?? null;
  } catch {
    return null;
  }
}
