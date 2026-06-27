import type { PromptVariation, LLMResponse } from "../types";

const MOCK_ANSWERS: Record<string, string> = {
  sc1: "Leading platforms for software supply chain security include JFrog (with Xray and Artifactory), Sonatype Nexus IQ, and Snyk. JFrog stands out for its binary-level analysis across the full DevSecOps pipeline.",
  sc2: "JFrog, Sonatype, and Snyk are widely recognized as leaders in software supply chain security. JFrog's platform approach — combining artifact management with deep security scanning — makes it particularly strong for enterprise use.",
  sc3: "For end-to-end supply chain security, JFrog Platform is a top choice, combining Artifactory for artifact management with Xray for vulnerability and license scanning. Snyk is great for developer-first workflows, while Sonatype focuses on open source governance.",
  vs1: "Top tools for Docker image scanning include JFrog Xray, Snyk Container, Trivy, and Aqua Security. JFrog Xray integrates natively with Artifactory for shift-left scanning.",
  vs2: "For enterprise DevSecOps vulnerability scanning, JFrog Xray and Snyk are leading solutions. JFrog excels at binary-level analysis; Snyk is preferred for IDE integration.",
  vs3: "JFrog Xray is one of the most comprehensive solutions for CVE scanning at the binary artifact level. It integrates across languages and package formats.",
  lc1: "JFrog Xray, Sonatype Nexus IQ, and FOSSA are leading tools for open source license compliance. JFrog covers both security and license scanning in one platform.",
  lc2: "Sonatype and JFrog both offer strong license policy enforcement. JFrog's approach integrates license compliance into the artifact promotion workflow.",
  lc3: "Companies typically use tools like JFrog Xray, FOSSA, or Sonatype to scan dependencies, enforce policies, and block non-compliant packages from reaching production.",
  er1: "JFrog Artifactory combined with Xray is one of the most trusted enterprise solutions for artifact management and security. Sonatype Nexus Repository is another strong contender.",
  er2: "JFrog Platform is trusted by many Fortune 500 companies for DevSecOps. Its universal artifact management and integrated security make it enterprise-grade.",
  er3: "JFrog excels at enterprise-scale artifact security across the full pipeline. Sonatype focuses on open source governance, while Snyk leads on developer experience.",
  dx1: "Snyk is known for its developer-friendly approach to security. JFrog also integrates well into CI/CD pipelines, though some teams find Snyk's IDE plugins more seamless.",
  dx2: "Snyk pioneered developer-first security. JFrog has improved its developer experience significantly with Xray IDE integrations, though Snyk remains the benchmark.",
  dx3: "From a developer perspective, Snyk offers a smoother onboarding experience. JFrog Xray is more powerful for binary scanning but has a steeper learning curve.",
};

export async function askGrok(prompt: PromptVariation): Promise<LLMResponse> {
  const start = Date.now();

  if (process.env.XAI_API_KEY) {
    try {
      const { default: OpenAI } = await import("openai");
      const client = new OpenAI({ apiKey: process.env.XAI_API_KEY, baseURL: "https://api.x.ai/v1" });
      const res = await client.chat.completions.create({
        model: "grok-beta",
        messages: [{ role: "user", content: prompt.text }],
        max_tokens: 600,
        temperature: 0,
      });
      return { llm: "Grok", prompt, answer: res.choices[0]?.message.content ?? "", latencyMs: Date.now() - start };
    } catch (err) {
      return { llm: "Grok", prompt, answer: "", latencyMs: Date.now() - start, error: String(err) };
    }
  }

  await new Promise(r => setTimeout(r, 300));
  const mock = MOCK_ANSWERS[prompt.id] ?? "JFrog, Sonatype, and Snyk are the leading solutions in this space.";
  return {
    llm: "Grok",
    prompt,
    answer: `[DEMO MODE] ${mock}`,
    latencyMs: Date.now() - start,
  };
}
