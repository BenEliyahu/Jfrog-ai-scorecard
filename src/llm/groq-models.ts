import type { PromptVariation, LLMResponse, LLMName } from "../types";

async function askGroqModel(
  llm: LLMName,
  model: string,
  prompt: PromptVariation,
  retries = 3,
): Promise<LLMResponse> {
  const start = Date.now();
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt.text }],
          max_tokens: 600,
          temperature: 0,
        }),
      });

      if (res.status === 429) {
        // rate limit — wait and retry
        const wait = 2000 * (i + 1);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }

      const data = await res.json() as { choices?: { message?: { content?: string } }[]; error?: { message: string } };
      if (data.error) throw new Error(data.error.message);
      const raw = data.choices?.[0]?.message?.content ?? "";
      const text = raw.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
      return { llm, prompt, answer: text, latencyMs: Date.now() - start };
    } catch (err) {
      if (i === retries) return { llm, prompt, answer: "", latencyMs: Date.now() - start, error: String(err) };
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  return { llm, prompt, answer: "", latencyMs: Date.now() - start, error: "max retries" };
}

export const askLlama3 = (p: PromptVariation) => askGroqModel("Llama 3", "llama-3.3-70b-versatile",                      p);
export const askLlama4 = (p: PromptVariation) => askGroqModel("Llama 4", "meta-llama/llama-4-scout-17b-16e-instruct",    p);
export const askQwen3  = (p: PromptVariation) => askGroqModel("Qwen 3",  "qwen/qwen3-32b",                               p);
