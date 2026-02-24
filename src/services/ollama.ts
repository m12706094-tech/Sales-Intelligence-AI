import { Schema } from "../types";

interface SQLResult {
  intent: string;
  query: string;
  suggestedChart: "line" | "bar" | "pie" | "table";
  error?: string;
}

const SQL_FALLBACK: SQLResult = {
  intent: "Unable to generate SQL",
  query: "SELECT 1 WHERE 0",
  suggestedChart: "table",
  error: "I couldn't generate a valid SQL query. Please rephrase your request.",
};

export async function generateSQL(prompt: string, schema: Schema): Promise<SQLResult> {
  try {
    const response = await fetch("/api/ai/sql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, schema }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        ...SQL_FALLBACK,
        error: payload?.error || SQL_FALLBACK.error,
      };
    }

    if (!payload || typeof payload.query !== "string") {
      return SQL_FALLBACK;
    }

    return {
      intent: typeof payload.intent === "string" ? payload.intent : SQL_FALLBACK.intent,
      query: payload.query,
      suggestedChart:
        payload.suggestedChart === "line" ||
        payload.suggestedChart === "bar" ||
        payload.suggestedChart === "pie" ||
        payload.suggestedChart === "table"
          ? payload.suggestedChart
          : "table",
      error: typeof payload.error === "string" ? payload.error : undefined,
    };
  } catch {
    return SQL_FALLBACK;
  }
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
