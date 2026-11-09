# NewsPortal — Architecture & Tech Stack

Goal for this phase: fastest path to a working MVP on free tooling, with every piece swappable later (S3, SMTP, custom domain) without a rewrite. Matches your plan: Neon for data, no email verification yet, image storage solved for free, local/Render now → real domain + S3 + SMTP/SMS later.

**Status: implemented as planned below**, deployed on Vercel against a live Neon database. Schema additions since this doc was written — no architectural change, just new columns/migrations: `User.phone`, `User.avatarUrl` (now actively used — self-service avatar upload via Cloudinary, see `docs/UIDesign.md`), and `News.status` gaining `DELETED`/`HIDDEN` plus `News.archivedAt`/`archivedById` for the Admin Archive feature (`docs/BRD-SRS-UserStories.md` FR-8). One operational note: Next.js Server Actions cap request bodies at 1MB by default, which silently broke avatar uploads until `next.config.ts` raised `experimental.serverActions.bodySizeLimit` to `"10mb"` to match Cloudinary's own 10MB check — see `docs/RULES.md`.

## Recommended stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 14 (App Router) + TypeScript | One framework for all 5 pages (Dashboard, Details, Profile, Post Form, Approval List) and the server/API logic; SSR gives the SEO the SRS calls for, out of the box |
| Database | Neon (Postgres) free tier — already chosen | Serverless Postgres; identical connection from local dev and from the deployed app since it's always cloud-hosted — no local DB to install |
| ORM | Prisma | Typed queries, easy migrations against Neon, maps directly to the User/News/Category/Comment/Bookmark/ApprovalLog model in the SRS |
| Auth | Auth.js (NextAuth) — Credentials provider + bcrypt | Email/password login, no email verification required for now; `role` column on the User row drives Guest/Registered/Moderator/Admin access; verification can be added later with zero schema rework |
| Long article/comment text | A Postgres `TEXT` column in the same Neon database | Postgres has no practical size limit on `TEXT` — no separate "text database" needed. Store the body as Markdown (simplest, safest) or sanitized HTML |
| Rich text editing | Markdown (textarea + live preview, or a lightweight editor) | Render with `remark`/`rehype`, sanitize with `rehype-sanitize` — covers FR-4 authoring and the comment/body XSS non-functional requirement in one move |
| Images | Cloudinary free tier (25 GB storage/bandwidth) | You store only the returned image **URL** in Neon (`News.image_url`, `User.avatar_url`); the file itself never touches your server or database |
| Hosting (app) | Vercel free tier (recommended) or Render free web service | Vercel is purpose-built for Next.js — no config, no sleep/cold-start, first-class Neon integration in its dashboard. Render works too, but its free web services sleep after inactivity |
| Local dev | `next dev` pointed at the same Neon `DATABASE_URL` | Local machine and hosted app use the identical cloud database — nothing to seed or sync |

## Your two open problems, solved

**"Long text keeper" for news body** — no separate service needed. Add a `body` column of type `TEXT` to the `News` table already in Neon. Postgres handles megabytes of text per row without issue; same for `Comment.body`.

**Free image storage** — Cloudinary. Flow:
1. Moderator/Admin picks an image in the Post Form.
2. The browser uploads it directly to Cloudinary (unsigned upload preset, or signed if you want more control) — it never passes through Render/Vercel's free-tier filesystem, which is ephemeral and would lose files on every redeploy anyway.
3. Cloudinary returns a URL; you save only that URL string into `News.image_url` in Neon.
4. Pages just render `<img src={image_url}>`; Cloudinary also resizes/optimizes on the fly via URL parameters — useful for Dashboard thumbnails.

## User creation without email verification (your current plan)

- Signup form → hash password (bcrypt) → `INSERT` into Neon's `User` table with `role = 'user'`.
- Verify it worked by opening Neon's console → your project → the `User` table. Fine for this stage; no admin UI needed yet.
- Add a nullable `email_verified_at` column now anyway (costs nothing) so wiring up real verification later needs no migration surprise.

## Migration path to production (later, per your plan)

| Now (free) | Later | Change required |
| --- | --- | --- |
| Neon free tier | Neon paid tier (or stays free if traffic is light) | None — same connection string |
| Cloudinary free tier | AWS S3 + CloudFront | Swap the upload function; `image_url` stays a URL column either way |
| No email | SMTP via Resend / Amazon SES | Add email calls at the signup/reset points already stubbed by `email_verified_at` |
| Vercel/Render free | Custom domain, same host | DNS change only, in most cases |
| No SMS | Twilio / Amazon SNS | New integration, doesn't touch anything above |

## Environment variables you'll need

```
DATABASE_URL=            # from Neon
NEXTAUTH_SECRET=         # random string, for Auth.js session signing
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Confirmed decisions

- **Framework:** Next.js (App Router) + TypeScript — one framework for all 5 pages plus backend logic, SSR for SEO.
- **Content authoring:** Markdown, not WYSIWYG — far smaller XSS surface, less setup, still covers bold/italics/links/images/headings.
- **Hosting:** Vercel free tier — no cold-sleep on inactivity (unlike Render's free web service), built-in Neon integration, deploys via `git push`.
- **Images:** confirmed — browser uploads directly to Cloudinary (never touches Vercel's server/disk), Cloudinary returns a URL, that URL is saved in Neon's `News.image_url` / `User.avatar_url`, and pages render it with a plain `<img src>`. Works cleanly on Vercel's free tier specifically because no file is ever written to the app server's filesystem.
