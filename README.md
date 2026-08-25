# Lexora

Lexora is a Taiwan high-school English learning platform built around verified CEEC reference vocabulary, persistent MongoDB learning records, spaced repetition, grammar, reading, dictionary, listening, questions, exams, games, and progress tracking.

## Status

This repository intentionally does **not** claim that the full CEEC vocabulary dataset is loaded until the validated database count confirms it. The application reads published counts dynamically from MongoDB.

## Official vocabulary baseline

Primary baseline: 大學入學考試中心《高中英文參考詞彙表－111學年度起適用－》.

The import path is deliberately validation-first:

1. Obtain the official CEEC vocabulary source.
2. Normalize it into `data/ceec/normalized.json`.
3. Enrich only with legally usable or original educational content.
4. Run `npm run import:ceec`.
5. Run `npm run validate:data`.
6. Publish only records that pass validation.

No placeholder vocabulary is included to fake completion.

## Environment

Copy `.env.example` to `.env.local` and configure:

- `MONGODB_URI`
- `AUTH_SECRET`
- `APP_URL`
- `ADMIN_EMAIL`
- optional TTS provider settings

## Run

```bash
npm install
npm run dev
```

## Data requirements

A published vocabulary record must contain a valid CEEC level, POS, Traditional Chinese definition, English definition, and official source metadata. Duplicate word+level records are rejected. Morphology is optional and should remain absent when a reliable breakdown is unavailable.

## Security

Passwords are bcrypt hashed server-side. Authentication uses secure HTTP-only session cookies in production. Admin role checks occur on the server. Secrets remain in environment variables.
