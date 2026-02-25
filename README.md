# Sales Intelligence AI (Ollama + deepseek-r1:1.5b)

# Sales Intelligence AI (GapGPT OpenAI-compatible API)

This app uses a hosted OpenAI-compatible API endpoint (`https://api.gapgpt.app/v1`) for SQL generation and insights.

## Prerequisites

- Node.js 20+
- A GapGPT API key

## Windows setup (PowerShell)

1. Install dependencies:
   ```powershell
   npm install
   ```

2. Create local env file:
   ```powershell
   Copy-Item .env.example .env.local
   ```

3. Edit `.env.local` and set your real API key:
   ```powershell
   notepad .env.local
   ```

4. The server auto-loads `.env.local` and `.env` via `dotenv`.

5. Start the app:
   ```powershell
   npm run dev
   ```

6. Open:
   - http://localhost:3000

## Optional configuration

Defaults are:
- `GAPGPT_BASE_URL=https://api.gapgpt.app/v1`
- `GAPGPT_MODEL=gpt-4o`

## Troubleshooting

- If you keep getting `I couldn't generate a valid SQL query...`, confirm `GAPGPT_API_KEY` is set in `.env.local` and restart the dev server.

## Security note

- Keep `GAPGPT_API_KEY` only in `.env.local` (or environment variables in your host).
- Never commit real API keys to git.


## Run with Docker Compose

1. Create local env file and add your real key:
   ```powershell
   Copy-Item .env.example .env.local
   notepad .env.local
   ```

2. Build and start everything:
   ```powershell
   docker compose up -d --build
   ```

3. Open:
   - http://localhost:3000

4. Stop services:
   ```powershell
   docker compose down
   ```
