<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run locally with Ollama (deepseek-r1:1.5b)

This app now uses **Ollama** instead of Gemini for SQL generation and insights.

## Run Locally

**Prerequisites:**
- Node.js
- Ollama installed and running

1. Install dependencies:
   `npm install`
2. Pull the required model:
   `ollama pull deepseek-r1:1.5b`
3. (Optional) Configure `.env.local` from `.env.example` if your Ollama host/model differs.
4. Run the app:
   `npm run dev`

By default, the backend calls Ollama at `http://127.0.0.1:11434` with model `deepseek-r1:1.5b`.
