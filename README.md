# Dad's Workout Health Magazine

A multi-agent AI system that generates a weekly fitness and wellness digest for dads aged 35-60.

## Features

- **5 AI Writer Personas**: Each with unique expertise and voice
  - Dr. Marcus Chen (Sports Psychiatrist)
  - Dr. Angela Okafor (Orthopedic Surgeon)
  - Coach DT Thompson (Personal Trainer)
  - Maya Santana, RD (Nutritionist)
  - Rotating Wildcard Guest Columnists

- **Automated Weekly Digest**: Generates ~4,000-5,000 words of quality content
- **Multi-Channel Publishing**: Email, Web, and PDF outputs
- **Smart Topic Rotation**: 8-week cooldown to avoid repetition

## Architecture

```
GitHub Actions (Weekly Cron)
    ├── Topic Planner
    ├── Writer Agents (parallel)
    ├── Editor Agent
    └── Publisher Agent
        ├── Email (Resend)
        ├── Web (Vercel)
        └── PDF
```

## Setup

1. **Clone and install:**
   ```bash
   git clone https://github.com/YOUEARNEDIT53/dads-workout-magazine.git
   cd dads-workout-magazine
   pnpm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Run database migrations:**
   - Go to your Supabase dashboard
   - Run the SQL from `packages/database/migrations/001_initial_schema.sql`

4. **Build:**
   ```bash
   pnpm build
   ```

5. **Generate a test digest:**
   ```bash
   cd apps/runner
   pnpm generate-digest
   ```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Claude API key |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `RESEND_API_KEY` | Resend email API key |
| `DIGEST_EMAIL_FROM` | Sender email address |
| `SITE_URL` | Base URL for web links |

## GitHub Actions Secrets

Configure these in your GitHub repository settings:
- `ANTHROPIC_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `RESEND_API_KEY`
- `DIGEST_EMAIL_FROM`
- `SITE_URL`

## Manual Trigger

You can manually trigger a digest generation from the GitHub Actions tab:
1. Go to Actions
2. Select "Weekly Digest Generation"
3. Click "Run workflow"
4. Optionally enable "dry run" to skip email sending

## License

Private - All rights reserved
