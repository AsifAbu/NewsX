# NewsPortal — Development Rules

Read this before writing any code. It's the checklist a coding agent (or you) should follow so every part of the app stays consistent with the confirmed stack and scope. Background/why lives in [`Architecture.md`](Architecture.md), [`BRD-SRS-UserStories.md`](BRD-SRS-UserStories.md), and [`TestCases.md`](TestCases.md) — this file is the condensed "do this, not that."

## Stack (confirmed — do not substitute without updating `Architecture.md`)

| Piece | Choice |
| --- | --- |
| Framework | Next.js 14+, App Router, TypeScript (strict mode) |
| Database | Neon (Postgres) |
| ORM | Prisma |
| Auth | Auth.js (NextAuth), Credentials provider, bcrypt for password hashing |
| Content | Markdown (not WYSIWYG/HTML) |
| Images | Cloudinary (browser → Cloudinary direct upload; app stores only the URL) |
| Hosting | Vercel (free tier) |
| Styling | Tailwind CSS (confirmed) |
| Font | One font site-wide (Geist Sans, via `next/font`) for headings and body — see [`UIDesign.md`](UIDesign.md) |
| UI design | See [`UIDesign.md`](UIDesign.md) — navbar, Dashboard, and News Details layout spec |

## Installed versions & gotchas (found while scaffolding — read before touching these areas)

- **Next.js 16.4.5**: `middleware.ts` is renamed to `proxy.ts` (same behavior, new name/export). Don't create a `middleware.ts` file.
- **`cacheComponents` is OFF** (`next.config.ts`) — it was on by default in the scaffold but requires wrapping every dynamic data access in `<Suspense>`; this whole app is personalized/dynamic (auth, roles, view counts), so it's deferred to a Phase 2 performance pass. Don't re-enable it without adding Suspense boundaries everywhere data is fetched.
- **Prisma 7.10.1** (pinned, not the 8.0 release-candidate default): requires an explicit driver adapter. `lib/db.ts` uses `@prisma/adapter-pg` + `pg` — do not call `new PrismaClient()` without the `adapter` option, it will fail.
- Prisma Client is generated to `app/generated/prisma` (not `node_modules/@prisma/client`) — import from `@/app/generated/prisma/client`. Re-run `npx prisma generate` after any `schema.prisma` change, and `npx prisma migrate dev` once `DATABASE_URL` points at a real Neon database.
- **next-auth is v5 (`5.0.0-beta.32`, Auth.js)**, not v4 — uses the `NextAuth(config)` → `{ handlers, auth, signIn, signOut }` export pattern in `lib/auth.ts`, not the old `[...nextauth]` options-object style.
- Server Actions used as a `<button formAction={...}>` override take a plain `(formData)` signature; actions driven through `useActionState` take `(prevState, formData)`. Don't mix the two on the same function — see `lib/actions/news.ts` vs `lib/actions/auth.ts` for the split.

## Project structure

```
app/
  (public)/            # Dashboard (incl. the "All" tab), News Details, Search, Bookmarks,
                        # and the footer-linked static pages (about, contact, sitemap,
                        # advertisement, privacy-policy, comment-policy) — accessible to Guests
  (auth)/              # Profile: register, login, logout
  (editorial)/         # News Post Form, My Submissions — Moderator + Admin
  (admin)/             # Approval List, Users, Reports — Admin only
  api/                 # Only for things that truly need a REST endpoint (webhooks, etc.)
  */loading.tsx         # one per route segment — skeleton fallback, see Patterns below
components/            # shared UI: Navbar, Footer, icons.tsx, Skeletons.tsx, NewsRow.tsx,
                        # AllNewsList.tsx, forms, modals — see Patterns below
lib/
  db.ts                # single Prisma client instance (see Patterns below)
  auth.ts              # Auth.js config (NextAuth(config) → handlers/auth/signIn/signOut)
  require-role.ts       # requireRole()/requireSession() helpers — see Patterns below
  actions/              # Server Actions, one file per entity (auth.ts, news.ts, engagement.ts, ...)
  validation/          # Zod schemas, one file per entity (user.ts, news.ts, comment.ts)
prisma/
  schema.prisma        # matches the data model in BRD-SRS-UserStories.md §SRS 4
docs/                  # this folder — keep it updated as decisions change
```

Route groups `(public)`, `(auth)`, `(editorial)`, `(admin)` are Next.js route groups (parens = no effect on the URL) — they exist to keep role-gated pages visually separated in the file tree.

## Design patterns to use

- **Server Components by default.** Only add `"use client"` to a component that needs interactivity (form state, onClick, hooks). Data fetching happens in Server Components or Server Actions, not in `useEffect`.
- **Server Actions for mutations, and for client-triggered reads too** (register, post a comment, submit/approve/reject news, bookmark, the AI summarize/rephrase/pull-article actions, and `loadMoreNewsAction` for the "All" tab's pagination). A Client Component may call a `"use server"` action directly to fetch more data on an interaction (e.g. `components/AllNewsList.tsx`'s "More" button) — this is an accepted pattern here, not just for mutations. Use `app/api/*` route handlers only when something external needs to call it (e.g. a future webhook) — not as the default way to handle a form or an in-page fetch.
- **One Prisma client singleton** in `lib/db.ts`, imported everywhere else. Never instantiate `new PrismaClient()` elsewhere (exhausts Neon's connection limit on serverless).
- **No separate service layer exists today** — Server Actions (`lib/actions/*`) and Server Components (`app/**/page.tsx`) call `prisma` directly via the `lib/db.ts` singleton. This differs from an earlier plan to add a `lib/services/*` layer; that layer was never built, and this doc now describes the app as it actually is. Authorization still goes through `requireRole()`/`requireSession()` first (next bullet) and Zod validation second — keep that part centralized even without a service layer.
- **`requireRole()` / `requireSession()` helpers** live in `lib/require-role.ts` (not `lib/auth.ts`) and are the first call in every Moderator/Admin action or page: `await requireRole(["ADMIN"])`, throws/redirects if it fails; `requireSession()` is the lighter "must be logged in, any role" check. Don't re-implement role checks ad hoc per route — that's how FR-6-style gaps happen.
- **Zod schema per entity**, used to validate both Server Action input and any form data client-side (`lib/validation/*`). Never trust client-side validation alone. On a validation failure, return the field-level errors (and the non-sensitive submitted values) from the action so the form can highlight the failing field(s) and keep what the user typed — see `lib/actions/auth.ts`'s `registerAction`/`RegisterActionState` for the pattern. Never echo a password back.
- **`loading.tsx` per route segment** for skeleton-loading UI (Next.js's built-in Suspense convention) — compose it from the shared primitives in `components/Skeletons.tsx` (`DashboardSkeleton`, `ArticleSkeleton`, `ListSkeleton`, `TableSkeleton`, `FormSkeleton`, `PostFormSkeleton`, `DetailSkeleton`) rather than writing an ad hoc spinner. Every route segment has one; add one for any new route too.
- **Markdown pipeline**: `remark` → `rehype` → `rehype-sanitize` for every piece of user-authored content (news body, comments) before it's rendered. No raw `dangerouslySetInnerHTML` without sanitization.

## What to do

- Check the [Roles & Permissions Matrix](BRD-SRS-UserStories.md) before adding any new action — confirm which roles can do it.
- Store all secrets (`DATABASE_URL`, `NEXTAUTH_SECRET`, Cloudinary keys) in environment variables, never hardcoded or committed.
- Hash passwords with bcrypt (cost factor ≥ 10) before storing.
- Use Prisma's query builder for all DB access (parameterized by default) — never hand-build SQL strings.
- Upload images straight from the browser to Cloudinary; save only the returned URL to Neon.
- Add/extend a test case in [`TestCases.md`](TestCases.md) (or flag one as affected) whenever you implement a user story — that file is the coverage source of truth.
- Keep functions and components single-purpose; prefer composition over large multi-role components.
- Use the `TEXT` Postgres column type for `News.body` and `Comment.body` — no size-limited `VARCHAR`.
- Flag placeholder/dummy content as such in a code comment (e.g. the footer's email/WhatsApp/social links, and the About/Contact/Sitemap/Advertisement/Privacy Policy/Comment Policy pages) so it's easy to find and swap for real copy later — don't silently ship a fake value as if it were real data.

## What NOT to do (current MVP constraints — see `Architecture.md` / `CLAUDE.md` for why)

- **No email/SMTP code.** No email verification, no password-reset emails, no approval/rejection email notifications. That status is shown in-app (My Submissions view) only. Don't add a "send email" call anywhere yet — Phase 2.
- **No Admin Management UI (FR-6) yet.** Don't build a user-list or promote/suspend page. Role changes and user deletion happen manually in the Neon console at this stage.
- **No writing files to local/server disk.** Vercel's filesystem is ephemeral — any uploaded file saved locally is lost on the next deploy. Images go to Cloudinary only.
- **No WYSIWYG/rich-HTML editor.** Content authoring is Markdown only — don't pull in a rich text editor library.
- **No new paid/non-free service** without checking it fits the "free tier only, for now" constraint in `Architecture.md`.
- **No scope creep**: SMS, multi-language, monetization/ads, native apps, RSS/newsletter, social login, analytics dashboards — all explicitly out of MVP scope per the BRD. Flag them, don't build them, unless the user asks to pull one forward.
- **No class components, no Redux/MobX/other global state library** — React Server Components plus local `useState`/`useContext` is enough for this app's scope.
- **No new global state library to work around the missing service layer** — the direct-Prisma-call pattern is fine as-is; don't "fix" it by introducing Redux/Zustand/etc. instead of just calling `prisma` through `lib/db.ts` with `requireRole()`/Zod in front of it.

## Security checklist (apply to every new endpoint/action)

- [ ] Role check via `requireRole()` before any read/write that isn't public
- [ ] Input validated with a Zod schema
- [ ] User-authored content (comments, news body) sanitized before render
- [ ] No secrets in code or client bundle
- [ ] Rate limiting considered for login and comment-posting endpoints (see SRS non-functional requirements)

## Open items to resolve before they block code

These are the still-open decisions from `CLAUDE.md` — don't silently assume an answer; ask, or implement the simplest reversible option and flag it in the PR/commit message:
1. Single-owner vs. concurrent editing of a Moderator's draft
2. Comment moderation: manual only, or also automated filtering
3. Monetization — assume none unless told otherwise
4. Target scale — assume "light/hobby traffic" defaults (no extra caching layer) unless told otherwise

*(Resolved, not open: Admin's Post Form always shows both buttons — Publish and Submit for Approval — same form as Moderator's, role-gated. See `components/NewsForm.tsx`.)*
