import { GoogleGenAI, Type } from "@google/genai";
import { Schema } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateSQL(prompt: string, schema: Schema) {
  const schemaStr = schema.columns
    .map((c) => `${c.name} (${c.type})${c.description ? `: ${c.description}` : ""}`)
    .join(", ");

  const systemInstruction = `
    You are a SQL expert for a sales database.
    Table name: ${schema.table}
    Columns: ${schemaStr}

    Current date: ${new Date().toISOString().split('T')[0]}

    Convert the user's natural language request into a valid, safe SQLite SELECT query.
    Rules:
    1. ONLY return a JSON object.
    2. Do NOT include any explanations or markdown formatting outside the JSON.
    3. Use standard SQLite syntax.
    4. Suggest a chart type based on the data: 'line' for trends, 'bar' for comparisons, 'pie' for distributions, or 'table' for lists.
    5. If the request is not related to sales data, return an error message in the 'error' field.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          intent: { type: Type.STRING, description: "Brief description of what the query does" },
          query: { type: Type.STRING, description: "The SQL SELECT query" },
          suggestedChart: { type: Type.STRING, enum: ["line", "bar", "pie", "table"] },
          error: { type: Type.STRING, description: "Error message if query cannot be generated" }
        },
        required: ["intent", "query", "suggestedChart"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function generateInsight(prompt: string, data: any[], query: string) {
  const systemInstruction = `
    You are a senior revenue analyst. 
    Analyze the provided sales data results from a SQL query and provide a concise, executive-ready insight.
    
    Rules:
    1. Be deterministic based on the data provided.
    2. Highlight trends, anomalies, top performers, or percentage changes if applicable.
    3. If there is insufficient data, say "Insufficient data for a detailed insight."
    4. Keep it under 3 sentences.
    5. Use Markdown for formatting if needed.
  `;

  const dataStr = JSON.stringify(data.slice(0, 50)); // Limit data sent to model

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `User Prompt: ${prompt}\nSQL Query: ${query}\nData Results: ${dataStr}`,
    config: {
      systemInstruction,
    }
  });

  return response.text;
}
