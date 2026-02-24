import { Schema } from "../types";

interface SQLResult {
  intent: string;
  query: string;
  suggestedChart: "line" | "bar" | "pie" | "table";
  error?: string;
}

export async function generateSQL(prompt: string, schema: Schema): Promise<SQLResult> {
  const response = await fetch("/api/ai/sql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, schema }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to generate SQL" }));
    throw new Error(error.error || "Failed to generate SQL");
  }

  return response.json();
}

export async function generateInsight(prompt: string, data: any[], query: string): Promise<string> {
  const response = await fetch("/api/ai/insight", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, data, query }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to generate insight" }));
    throw new Error(error.error || "Failed to generate insight");
  }

  const result = await response.json();
  return result.insight;
}
