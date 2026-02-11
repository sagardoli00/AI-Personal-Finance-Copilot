/**
 * Use OpenAI (or compatible) API to answer from user's data in natural language.
 * Set OPENAI_API_KEY in .env. Optional: OPENAI_BASE_URL for other providers.
 */
import type { CopilotOutput } from "./agents/synthesizer";

const apiKey = process.env.OPENAI_API_KEY ?? "";
const baseURL = process.env.OPENAI_BASE_URL; // e.g. for Azure or other OpenAI-compatible API

function dataToText(output: CopilotOutput): string {
  const parts: string[] = [
    "FINANCIAL DATA (use these exact numbers):",
    ...output.keyInsights.map((i) => " - " + i),
    "\nSummary: " + output.summary,
    "\nRisks:",
    ...(output.risksWarnings.length ? output.risksWarnings.map((r) => " - " + r) : [" - None"]),
    "\nActionable suggestions:",
    ...output.actionableSuggestions.map((s) => " - " + s),
  ];
  return parts.join("\n");
}

export function isOpenAIAvailable(): boolean {
  return apiKey.length > 0;
}

export async function answerWithData(question: string, output: CopilotOutput): Promise<string> {
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set in .env");

  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ apiKey, baseURL: baseURL || undefined });

  const dataText = dataToText(output);

  const systemPrompt = `You are a personal finance copilot. Answer using ONLY the data below.
Rules:
- ALWAYS use the exact numbers from the data. Never say "income isn't provided" if the data contains "Total income: ₹X".
- When asked about income, expenses, or money in hand: state the exact figures (Total income: ₹X, Total expenses: ₹Y, Net: ₹Z).
- Be brief and natural.
- No generic advice, motivational quotes, or vague language.`;

  const userMessage = `Data about the user's finances:\n${dataText}\n\nUser question: ${question}`;

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    max_tokens: 500,
    temperature: 0.3,
  });

  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) throw new Error("No response from OpenAI");
  return content;
}
