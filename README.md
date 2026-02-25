<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

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
