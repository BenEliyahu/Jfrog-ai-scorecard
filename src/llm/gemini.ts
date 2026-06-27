import { GoogleGenerativeAI } from "@google/generative-ai";
import type { PromptVariation, LLMResponse } from "../types";

let client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!client) client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");
  return client;
}

export async function askGemini(prompt: PromptVariation): Promise<LLMResponse> {
  const start = Date.now();
  try {
    const model = getClient().getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt.text);
    const text = result.response.text();
    return { llm: "Gemini", prompt, answer: text, latencyMs: Date.now() - start };
  } catch (err) {
    return { llm: "Gemini", prompt, answer: "", latencyMs: Date.now() - start, error: String(err) };
  }
}
