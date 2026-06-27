import type { Dimension, PromptVariation } from "./types";

// 3 phrasings per dimension — averaged to reduce single-prompt bias
export const PROMPT_VARIATIONS: PromptVariation[] = [
  // Supply Chain Security
  { id: "sc1", dimension: "supply_chain", text: "What are the leading platforms for software supply chain security today?" },
  { id: "sc2", dimension: "supply_chain", text: "Which companies are considered leaders in securing the software supply chain?" },
  { id: "sc3", dimension: "supply_chain", text: "If I need to secure my software supply chain end-to-end, what tools should I consider?" },

  // Vulnerability Scanning
  { id: "vs1", dimension: "vulnerability_scanning", text: "What are the best tools for scanning Docker container images for security vulnerabilities?" },
  { id: "vs2", dimension: "vulnerability_scanning", text: "Which vulnerability scanning solutions would you recommend for enterprise DevSecOps?" },
  { id: "vs3", dimension: "vulnerability_scanning", text: "How do I scan my binary artifacts and open source dependencies for CVEs at scale?" },

  // License Compliance
  { id: "lc1", dimension: "compliance", text: "What tools help manage open source license compliance in enterprise software development?" },
  { id: "lc2", dimension: "compliance", text: "Which platforms are best for tracking and enforcing open source license policies?" },
  { id: "lc3", dimension: "compliance", text: "How do companies manage license risk in their open source dependencies?" },

  // Enterprise Readiness
  { id: "er1", dimension: "enterprise", text: "What are the top enterprise-grade solutions for artifact management and security?" },
  { id: "er2", dimension: "enterprise", text: "Which DevSecOps platforms are most trusted by large enterprises for binary security?" },
  { id: "er3", dimension: "enterprise", text: "How does JFrog compare to Sonatype and Snyk for large-scale enterprise DevSecOps?" },

  // Developer UX
  { id: "dx1", dimension: "developer_ux", text: "Which security tools integrate best into developer workflows without slowing them down?" },
  { id: "dx2", dimension: "developer_ux", text: "What is the most developer-friendly approach to software supply chain security?" },
  { id: "dx3", dimension: "developer_ux", text: "How does JFrog's security experience compare to Snyk from a developer perspective?" },
];

export const COMPANIES = {
  target: "JFrog",
  competitors: ["Sonatype", "Snyk"],
};

export const JFROG_FEATURES = [
  "xray", "artifactory", "curation", "distribution",
  "supply chain", "binary", "artifact", "devsecops",
  "jfrog platform", "release bundle", "edge node",
];

export const ALL_COMPANIES = [COMPANIES.target, ...COMPANIES.competitors];

export const DIMENSIONS: Dimension[] = [
  "supply_chain", "vulnerability_scanning", "compliance", "enterprise", "developer_ux",
];
