import Anthropic from "@anthropic-ai/sdk";
import type { PromptVariation, LLMResponse } from "../types";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export async function askClaude(prompt: PromptVariation): Promise<LLMResponse> {
  const start = Date.now();
  try {
    const res = await getClient().messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt.text }],
    });
    const text = res.content[0]?.type === "text" ? res.content[0].text : "";
    return { llm: "Claude", prompt, answer: text, latencyMs: Date.now() - start };
  } catch (err) {
    return { llm: "Claude", prompt, answer: "", latencyMs: Date.now() - start, error: String(err) };
  }
}
