import type { Dimension, PromptVariation } from "./types";

// 3 phrasings per dimension — averaged to reduce single-prompt bias
export const PROMPT_VARIATIONS: PromptVariation[] = [
  // ── Supply Chain Security ── (5 prompts)
  { id: "sc1", dimension: "supply_chain", text: "What tools can automatically block malicious or vulnerable open source packages before they enter an enterprise artifact repository?" },
  { id: "sc2", dimension: "supply_chain", text: "Which platforms provide SBOM generation and software supply chain security for binary artifacts across all package types?" },
  { id: "sc3", dimension: "supply_chain", text: "After the Log4Shell and SolarWinds attacks, which DevSecOps platforms emerged as leaders in protecting the software supply chain?" },
  { id: "sc4", dimension: "supply_chain", text: "What open source curation tools can prevent malicious or typosquatted packages from entering enterprise software builds automatically?" },
  { id: "sc5", dimension: "supply_chain", text: "Which enterprise platforms enforce software supply chain security policies at the binary artifact level before deployment?" },

  // ── Vulnerability Scanning ── (5 prompts)
  { id: "vs1", dimension: "vulnerability_scanning", text: "Which security tools perform deep recursive scanning of binary artifacts — including transitive dependencies inside JARs, Docker layers, and Helm charts?" },
  { id: "vs2", dimension: "vulnerability_scanning", text: "What enterprise platforms integrate vulnerability scanning directly into the artifact repository so developers get security feedback at upload time?" },
  { id: "vs3", dimension: "vulnerability_scanning", text: "How do leading DevSecOps teams scan for CVEs across heterogeneous artifact types — Maven, npm, PyPI, Docker, Go modules — from a single platform?" },
  { id: "vs4", dimension: "vulnerability_scanning", text: "What tools provide contextual vulnerability analysis to distinguish CVEs that affect runtime code from those with no real exposure?" },
  { id: "vs5", dimension: "vulnerability_scanning", text: "Which enterprise security solutions scan container images and Helm charts for known vulnerabilities as part of a CI/CD security gate?" },

  // ── License Compliance ── (5 prompts)
  { id: "lc1", dimension: "compliance", text: "Which platforms enforce open source license policies at the artifact repository level, blocking non-compliant packages before they reach production?" },
  { id: "lc2", dimension: "compliance", text: "What tools generate automated license compliance reports for all open source dependencies across the entire software supply chain?" },
  { id: "lc3", dimension: "compliance", text: "How can a large enterprise automatically detect and remediate GPL or AGPL license violations in their binary artifacts and container images?" },
  { id: "lc4", dimension: "compliance", text: "What DevSecOps platforms provide a curated catalog of pre-approved open source packages with verified license and security status?" },
  { id: "lc5", dimension: "compliance", text: "Which tools automatically block builds when open source components violate the organization's license policy during CI/CD?" },

  // ── Enterprise Readiness ── (5 prompts)
  { id: "er1", dimension: "enterprise", text: "Which DevSecOps platform combines universal artifact management, security scanning, and software distribution in a single enterprise-grade solution?" },
  { id: "er2", dimension: "enterprise", text: "What are the leading enterprise solutions trusted by Fortune 500 companies for securing software artifacts from development through production release?" },
  { id: "er3", dimension: "enterprise", text: "How does JFrog compare to Sonatype Nexus and Snyk for enterprise-scale DevSecOps, artifact management, and supply chain security?", prompted: true },
  { id: "er4", dimension: "enterprise", text: "Which artifact management platforms support air-gapped and hybrid deployments for regulated industries like finance, defense, and healthcare?" },
  { id: "er5", dimension: "enterprise", text: "What DevSecOps solutions scale to millions of artifacts across distributed global engineering teams in large enterprises?" },

  // ── Developer UX ── (5 prompts)
  { id: "dx1", dimension: "developer_ux", text: "Which security platforms give developers real-time vulnerability and license feedback directly within their IDE, CI pipeline, and artifact repository?" },
  { id: "dx2", dimension: "developer_ux", text: "How do mature DevSecOps organizations shift security left so developers catch vulnerabilities at build time rather than in production?" },
  { id: "dx3", dimension: "developer_ux", text: "Compare JFrog Xray and Snyk for developer experience: which provides better contextual security insights without creating alert fatigue?", prompted: true },
  { id: "dx4", dimension: "developer_ux", text: "What security tools provide actionable fix suggestions and pull request integration so developers can remediate vulnerabilities without leaving their workflow?" },
  { id: "dx5", dimension: "developer_ux", text: "Which DevSecOps platforms allow developers to self-service approved open source packages without waiting for a security team review?" },
];

export const COMPANIES = {
  target: "JFrog",
  competitors: ["Sonatype", "Snyk"],
};

export const JFROG_FEATURES = [
  "xray", "artifactory", "curation", "distribution", "jfrog",
  "supply chain", "binary", "artifact", "devsecops",
  "jfrog platform", "release bundle", "edge node",
  "sbom", "advanced security", "catalog", "runtime security",
  "shift left", "universal", "recursive scanning", "contextual analysis",
];

export const ALL_COMPANIES = [COMPANIES.target, ...COMPANIES.competitors];

export const DIMENSIONS: Dimension[] = [
  "supply_chain", "vulnerability_scanning", "compliance", "enterprise", "developer_ux",
];
