# NewsX

A web news portal — Guest/Registered User/Moderator/Admin roles, a moderation-gated publishing workflow, URL-import and AI rephrase tools for writers, and admin tools for user management and comment reports.

Stack: Next.js (App Router) + TypeScript + Tailwind, Prisma on Neon (Postgres), Auth.js, Cloudinary for images. Full details in [`docs/Architecture.md`](docs/Architecture.md) and [`docs/RULES.md`](docs/RULES.md).

## Prerequisites

- **Node.js 20+** and npm
- A free **[Neon](https://neon.tech)** account (Postgres database)
- A free **[Cloudinary](https://cloudinary.com)** account (image uploads)
- *(Optional)* Python 3.12 — only needed if you ever have to regenerate the local AI models (see step 4)

## 1. Install dependencies

```bash
npm install
```

## 2. Set environment variables

Create `.env.local` in the project root:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require"
AUTH_SECRET="run: openssl rand -base64 32"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

- `DATABASE_URL` — from your Neon project dashboard; use the **pooled** connection string (hostname contains `-pooler`).
- `AUTH_SECRET` — generate your own with `openssl rand -base64 32`.
- `CLOUDINARY_*` — from your Cloudinary dashboard's "Product Environment Credentials" panel. Copy these with the dashboard's copy-icon buttons rather than retyping them — a single misread character (e.g. `0`/`O`, `l`/`I`) will break uploads with an "Invalid Signature" error.

Prisma's CLI only reads plain `.env` (not `.env.local`), so also copy the `DATABASE_URL` line into a `.env` file.

## 3. Set up the database

```bash
npx prisma migrate deploy   # creates all tables
npx prisma generate         # generates the typed client
npx tsx prisma/seed.ts      # optional: adds sample categories, users, and articles
```

Seeded test accounts (all use password `password123`):

| Role | Email |
| --- | --- |
| Admin | `admin@newsx.test` |
| Moderator | `moderator@newsx.test` |
| Registered User | `reader@newsx.test` |

## 4. Local AI models (optional — only for the "Rephrase" feature)

The Post Form's Rephrase button uses two small AI models that run locally (no external API, no cost) — but they're ~265MB each and not stored in this repo. Without them, the rest of the app works normally; only clicking Rephrase will show an error.

If you need them, they belong at `models/paraphrase-en/` and `models/paraphrase-bn/`. See [`docs/RULES.md`](docs/RULES.md) for the full regeneration steps (requires Python + the `optimum-onnx` exporter), or copy them from a machine that already has them.

## 5. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## More documentation

- [`docs/BRD-SRS-UserStories.md`](docs/BRD-SRS-UserStories.md) — requirements, roles, data model
- [`docs/Architecture.md`](docs/Architecture.md) — stack and hosting decisions
- [`docs/RULES.md`](docs/RULES.md) — coding conventions and known gotchas for this exact Next.js/Prisma version pair
- [`docs/UIDesign.md`](docs/UIDesign.md) — page layout reference
- [`docs/TestCases.md`](docs/TestCases.md) — manual QA test cases
- [`CLAUDE.md`](CLAUDE.md) — condensed project status, for picking this project back up quickly
