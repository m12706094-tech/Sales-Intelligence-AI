import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

type Schema = {
  table: string;
  columns: Array<{ name: string; type: string; description?: string }>;
};

type SQLResponse = {
  intent: string;
  query: string;
  suggestedChart: "line" | "bar" | "pie" | "table";
  error?: string;
};

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "deepseek-r1:1.5b";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("sales.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone_number TEXT,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    amount INTEGER NOT NULL,
    product TEXT NOT NULL,
    per_price REAL NOT NULL,
    price REAL NOT NULL,
    date TEXT NOT NULL
  )
`);

// Seed Data if empty
const count = db.prepare("SELECT COUNT(*) as count FROM sales").get() as { count: number };
if (count.count === 0) {
  console.log("Seeding 1000 rows of sales data...");
  const products = [
    { name: "Enterprise SaaS", minPrice: 5000, maxPrice: 15000 },
    { name: "Pro Plan", minPrice: 1200, maxPrice: 2500 },
    { name: "Basic Subscription", minPrice: 400, maxPrice: 800 },
    { name: "API Access Add-on", minPrice: 200, maxPrice: 500 },
    { name: "Consulting Hours", minPrice: 1500, maxPrice: 3000 }
  ];

  const cities = [
    { city: "Berlin", country: "Germany" },
    { city: "Munich", country: "Germany" },
    { city: "Paris", country: "France" },
    { city: "Lyon", country: "France" },
    { city: "London", country: "UK" },
    { city: "Manchester", country: "UK" },
    { city: "New York", country: "USA" },
    { city: "San Francisco", country: "USA" },
    { city: "Tokyo", country: "Japan" },
    { city: "Osaka", country: "Japan" }
  ];

  const names = ["Acme Corp", "Globex", "Initech", "Umbrella Corp", "Soylent Corp", "Hooli", "Pied Piper", "Stark Ind", "Wayne Ent", "Cyberdyne"];

  const insert = db.prepare(`
    INSERT INTO sales (name, phone_number, city, country, amount, product, per_price, price, date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const startDate = new Date("2025-01-01").getTime();
  const endDate = new Date("2026-02-24").getTime();

  db.transaction(() => {
    for (let i = 0; i < 1000; i++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const location = cities[Math.floor(Math.random() * cities.length)];
      const name = names[Math.floor(Math.random() * names.length)] + " " + (Math.floor(Math.random() * 100));
      const amount = Math.floor(Math.random() * 10) + 1;
      const perPrice = Math.floor(Math.random() * (product.maxPrice - product.minPrice) + product.minPrice);
      const price = amount * perPrice;
      const randomDate = new Date(startDate + Math.random() * (endDate - startDate)).toISOString().split('T')[0];
      const phone = `+${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;

      insert.run(name, phone, location.city, location.country, amount, product.name, perPrice, price, randomDate);
    }
  })();
  console.log("Seeding complete.");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const schema: Schema = {
    table: "sales",
    columns: [
      { name: "id", type: "INTEGER" },
      { name: "name", type: "TEXT", description: "Customer name" },
      { name: "phone_number", type: "TEXT" },
      { name: "city", type: "TEXT" },
      { name: "country", type: "TEXT" },
      { name: "amount", type: "INTEGER", description: "Quantity of products sold" },
      { name: "product", type: "TEXT" },
      { name: "per_price", type: "REAL", description: "Price per unit" },
      { name: "price", type: "REAL", description: "Total price (amount * per_price)" },
      { name: "date", type: "TEXT", description: "Date of sale (YYYY-MM-DD)" }
    ]
  };

  const callOllama = async (
    prompt: string,
    system: string,
    temperature = 0.2,
    forceJson = false
  ) => {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        system,
        stream: false,
        format: forceJson ? "json" : undefined,
        options: {
          temperature
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.response as string;
  };

  const stripThinking = (text: string) => text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  const extractJsonObject = (text: string) => {
    const cleaned = stripThinking(text);
    const markdownFenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = (markdownFenceMatch ? markdownFenceMatch[1] : cleaned).trim();

    try {
      return JSON.parse(candidate);
    } catch {
      // Fall through to brace matching parser below
    }

    let start = -1;
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = 0; i < candidate.length; i++) {
      const ch = candidate[i];

      if (inString) {
        if (escaped) {
          escaped = false;
          continue;
        }
        if (ch === "\\") {
          escaped = true;
        } else if (ch === '"') {
          inString = false;
        }
        continue;
      }

      if (ch === '"') {
        inString = true;
        continue;
      }

      if (ch === "{") {
        if (depth === 0) start = i;
        depth += 1;
      } else if (ch === "}") {
        depth -= 1;
        if (depth === 0 && start !== -1) {
          return JSON.parse(candidate.slice(start, i + 1));
        }
      }
    }

    throw new Error("Model did not return valid JSON");
  };

  const normalizeSqlResponse = (payload: any): SQLResponse => {
    const intent = typeof payload?.intent === "string" ? payload.intent : "Generated sales query";
    const query = typeof payload?.query === "string" ? payload.query.trim() : "SELECT 1 WHERE 0";
    const chart = payload?.suggestedChart;
    const suggestedChart: SQLResponse["suggestedChart"] =
      chart === "line" || chart === "bar" || chart === "pie" || chart === "table" ? chart : "table";
    const error = typeof payload?.error === "string" && payload.error.trim().length > 0 ? payload.error : undefined;

    if (!query.toUpperCase().startsWith("SELECT")) {
      return {
        intent,
        query: "SELECT 1 WHERE 0",
        suggestedChart: "table",
        error: "Generated query was unsafe. Please rephrase your request."
      };
    }

    return { intent, query, suggestedChart, error };
  };

  // API Routes
  app.get("/api/schema", (req, res) => {
    res.json(schema);
  });

  app.post("/api/ai/sql", async (req, res) => {
    try {
      const { prompt, schema: requestSchema } = req.body || {};
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "No prompt provided" });
      }

      const hasValidRequestSchema =
        requestSchema &&
        typeof requestSchema.table === "string" &&
        Array.isArray(requestSchema.columns);
      const activeSchema: Schema = hasValidRequestSchema ? requestSchema : schema;

      const schemaStr = activeSchema.columns
        .map((c) => `${c.name} (${c.type})${c.description ? `: ${c.description}` : ""}`)
        .join(", ");

      const systemInstruction = `
You are a SQL expert for a sales database.
Table name: ${activeSchema.table}
Columns: ${schemaStr}

Current date: ${new Date().toISOString().split("T")[0]}

Convert the user's natural language request into a valid, safe SQLite SELECT query.
Rules:
1. Return ONLY a JSON object with keys: intent, query, suggestedChart, error.
2. query must always be a SELECT statement.
3. suggestedChart must be one of: line, bar, pie, table.
4. If the request is unrelated to sales data, set error and keep query as "SELECT 1 WHERE 0".
`;

      const raw = await callOllama(prompt, systemInstruction, 0.1, true);
      const parsed = extractJsonObject(raw);
      return res.json(normalizeSqlResponse(parsed));
    } catch {
      // Return a structured fallback instead of a 500 to avoid breaking chat flow.
      return res.json({
        intent: "Unable to parse model response",
        query: "SELECT 1 WHERE 0",
        suggestedChart: "table",
        error: "I couldn't generate a valid SQL query. Please rephrase your request."
      } as SQLResponse);
    }
  });

  app.post("/api/ai/insight", async (req, res) => {
    const { prompt, data, query } = req.body;
    if (!prompt || !query) {
      return res.status(400).json({ error: "Prompt and query are required" });
    }

    const systemInstruction = `
You are a senior revenue analyst.
Analyze the provided sales data results from a SQL query and provide a concise, executive-ready insight.

Rules:
1. Be deterministic based on the data provided.
2. Highlight trends, anomalies, top performers, or percentage changes if applicable.
3. If there is insufficient data, say "Insufficient data for a detailed insight."
4. Keep it under 3 sentences.
5. Do not include chain-of-thought.
`;

    try {
      const dataStr = JSON.stringify((data || []).slice(0, 50));
      const insight = await callOllama(`User Prompt: ${prompt}\nSQL Query: ${query}\nData Results: ${dataStr}`, systemInstruction, 0.2);
      res.json({ insight: stripThinking(insight).trim() });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to generate insight" });
    }
  });

  app.post("/api/query", (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "No query provided" });

    // Basic safety check: only SELECT allowed
    const normalizedQuery = query.trim().toUpperCase();
    if (!normalizedQuery.startsWith("SELECT")) {
      return res.status(403).json({ error: "Only SELECT queries are allowed" });
    }

    try {
      const results = db.prepare(query).all();
      res.json({ results, query });
    } catch (error: any) {
      res.status(500).json({ error: error.message, query });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
