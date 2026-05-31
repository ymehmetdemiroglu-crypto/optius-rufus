import type { Agent, AgentRole, CleanedText, RawListingData } from "../types.js";

export class PreprocessorAgent implements Agent {
  role: AgentRole = "preprocessor";

  async execute(input: unknown): Promise<CleanedText> {
    const data = input as RawListingData;

    const rawText = [
      data.title,
      ...data.bullets,
      data.description,
      data.brand,
      data.category,
      data.subcategory,
    ].join(" ");

    const noHtml = rawText.replace(/<[^>]+>/g, " ");
    const lowercased = noHtml.toLowerCase();
    const normalized = lowercased
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, "-");
    const cleaned = normalized.replace(/\s+/g, " ").trim();
    const truncated = cleaned.slice(0, 32000);

    return { text: truncated, source: data };
  }
}
