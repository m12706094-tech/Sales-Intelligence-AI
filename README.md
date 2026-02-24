<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Sales Intelligence AI (Ollama + deepseek-r1:1.5b)

This app uses **Ollama** (local LLM) instead of Gemini for SQL generation and insights.

## Prerequisites

- Node.js 20+
- Ollama installed

## Windows setup (PowerShell)

1. Install dependencies:
   ```powershell
   npm install
   ```

2. Start Ollama in a separate PowerShell window:
   ```powershell
   ollama serve
   ```

3. Pull the required model (first time only):
   ```powershell
   ollama pull deepseek-r1:1.5b
   ```

4. Create local env file:
   ```powershell
   Copy-Item .env.example .env.local
   ```

5. Start the app:
   ```powershell
   npm run dev
   ```

6. Open:
   - http://localhost:3000

## Optional configuration

Defaults are:
- `OLLAMA_BASE_URL=http://127.0.0.1:11434`
- `OLLAMA_MODEL=deepseek-r1:1.5b`

Change them in `.env.local` if your Ollama host/model differs.

## Troubleshooting (Windows)

- If `ollama` is not recognized, restart terminal after installing Ollama.
- If AI replies fail, verify Ollama is reachable:
  ```powershell
  Invoke-RestMethod http://127.0.0.1:11434/api/tags
  ```
- If port 3000 is busy, stop the conflicting app/process and rerun `npm run dev`.
