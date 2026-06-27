import OpenAI from "openai";
import type { PromptVariation, LLMResponse } from "../types";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

export async function askChatGPT(prompt: PromptVariation): Promise<LLMResponse> {
  const start = Date.now();
  try {
    const res = await getClient().chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt.text }],
      max_tokens: 600,
      temperature: 0,
    });
    return {
      llm: "ChatGPT",
      prompt,
      answer: res.choices[0]?.message.content ?? "",
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    return { llm: "ChatGPT", prompt, answer: "", latencyMs: Date.now() - start, error: String(err) };
  }
}
