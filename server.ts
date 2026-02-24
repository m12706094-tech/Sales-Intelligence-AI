import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

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

  // API Routes
  app.get("/api/schema", (req, res) => {
    res.json({
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
    });
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
