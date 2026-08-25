# Lexora

Lexora is a production-oriented English learning platform for Taiwan high-school students. It combines verified CEEC reference vocabulary with MongoDB-backed learning records, spaced repetition, grammar, reading, listening, morphology, dictionary search, practice, games, exams, wrong-answer review, XP/streaks, daily tasks, analytics, and an admin content workflow.

## Data integrity

Lexora does **not** hardcode or pretend that exactly 7,000 words are loaded. The public vocabulary count is read from MongoDB. The official baseline is 大學入學考試中心（CEEC）《高中英文參考詞彙表－111學年度起適用－》.

The CEEC pipeline is validation-first:

1. Obtain the official CEEC source and normalize it into `data/ceec/normalized.json`.
2. Preserve CEEC levels, spelling and POS; do not invent rows to reach a round number.
3. Add only legally usable or original educational enrichment.
4. Run `npm run import:ceec [-- data/ceec/normalized.json]`.
5. Run `npm run validate:data`.
6. Check `/admin/data-status`; publish only records that pass validation.

Each import creates an `ImportRun` record so the source edition, input rows, published count, validation errors and enrichment gaps remain auditable.

## Main product features

- Register, login, logout, secure sessions, forgot/reset password
- CEEC vocabulary browser with server-side pagination and personal filters
- Word detail pages with definitions, examples, collocations, word families and verified morphology
- Persistent SRS with Again / Hard / Good / Easy
- Grammar library and persistent lesson completion
- Reading library, target-word highlighting, inline definitions, vocabulary actions and reading progress
- Dictionary exact/prefix search plus typo suggestions
- Prefix / root / suffix library and verified Word Builder
- US/UK TTS preferences, long-text controls and provider-to-browser fallback
- Listening practice
- Question bank, practice grading and automatic wrong-answer book
- Ten vocabulary game modes using real published vocabulary
- Vocabulary, grammar, reading, listening, mixed and mock exams with timers, navigation, flags, analysis and review recommendations
- XP, levels, streaks, achievements and daily tasks
- Dashboard and analytics generated from actual user records
- Admin search/edit/validation/publish tools for vocabulary, grammar, articles, questions and morphology
- Responsive desktop/tablet/mobile UI, mobile bottom navigation, accessible focus states and reduced-motion support

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Required environment variables:

- `MONGODB_URI` — MongoDB Atlas or MongoDB connection URI
- `AUTH_SECRET` — long random authentication secret
- `APP_URL` — application base URL
- `NEXTAUTH_URL` — same production base URL for Auth.js
- `ADMIN_EMAIL` — email that receives admin role when registered

Optional integrations:

- `RESEND_API_KEY` and `RESET_EMAIL_FROM` — password-reset email
- `TTS_PROVIDER_URL` and `TTS_API_KEY` — natural/neural TTS proxy. The endpoint must accept `{ text, locale, speed }` and return `audio/*`. Without it, Lexora automatically falls back to browser Speech Synthesis.

## Vercel deployment

1. Import this GitHub repository into Vercel.
2. Framework preset: **Next.js**.
3. Add the required environment variables in Production and Preview environments.
4. Use `npm install` as Install Command and `npm run build` as Build Command (already declared in `vercel.json`).
5. Ensure MongoDB Atlas network access permits Vercel connections and the database user has only the required permissions.
6. Set `APP_URL` and `NEXTAUTH_URL` to the deployed HTTPS origin.
7. Deploy, then verify `/api/health`, registration/login, one persisted learning action and `/admin/data-status`.

GitHub Actions also runs strict TypeScript checking and a production `next build` on pull requests.

## Security

Passwords are bcrypt-hashed server-side. Production sessions use secure HTTP-only cookies. Admin authorization happens server-side. Sensitive secrets remain in environment variables. Mutation endpoints use authentication/input validation; sensitive unauthenticated flows use MongoDB-backed rate limiting and origin checks. Security headers include HSTS, frame denial, nosniff, referrer policy and permissions policy.

## Quality policy

Published content must be real educational content. No Lorem Ipsum, `Word 1`, `Sample Question`, fabricated CEEC rows or mass template sentences are used to fake completeness. If data is missing, the product shows an honest empty state or admin missing-data report instead of inventing content.
