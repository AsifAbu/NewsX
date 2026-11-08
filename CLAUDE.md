# NewsX (NewsPortal) — Project Context

One-line: a web news portal with 4 user roles and a moderation-gated publishing workflow (Moderators submit, Admin approves or publishes directly). Brand name: **NewsX**.

## Roles
- **Guest** — read news only, no account
- **Registered User** — Guest + bookmark/save news, set interested categories, manage profile, comment, report comments
- **Moderator** — Registered User + write news, submit for Admin approval, track own submission status
- **Admin** — Registered User + approve/reject submissions (with reason), publish directly, delete news/users/comments, promote users to Moderator

## Pages (MVP)
1. **Dashboard** — latest news, short form, search + category filter, plus an **All** tab (`/?category=all`) listing every published article newest-first with "More"-button pagination (15 on load, +10 per click)
2. **News Details** — full article, comments, bookmark; also used by Admin to preview a pending submission
3. **Profile** — register (email, name, phone, password entered twice to confirm; no email verify), login, forgot/reset password, edit profile, view bookmarks/submissions
4. **News Post Form** — author/edit news; Moderator → "Submit for approval", Admin → "Publish" or "Submit for approval" (confirmed: same form, role-gated button — see FR-4.4)
5. **Approval List** — Admin reviews pending submissions, opens page 2 to approve/reject with reason
6. *(recommended, not in original scope)* **Admin Management** — user list (suspend/delete/promote) and reported-comments queue
7. **Footer-linked info pages** — About Us, Contact Us, Sitemap, Advertisement, Privacy Policy, Comment Policy (Guest-accessible, placeholder content for now — see "Status" below)

## Key business rules
- Moderator-submitted news always needs Admin approval before going live.
- Admin can publish directly, bypassing approval.
- Only Admin can delete news, users, or comments.
- Registered User → Moderator promotion is Admin-only (no self-signup as Moderator).
- Rejected submissions return to the Moderator with a reason and can be edited + resubmitted.

## Status
- **Stage:** Live and deployed — Next.js app on Vercel, Prisma on Neon, Auth.js, all core routes plus the additions below, working Server Actions, build/lint/typecheck pass. See `docs/RULES.md` "Installed versions & gotchas" for Next.js 16/Prisma 7 specifics found while building this.
- **Registration:** collects name, email, phone, and password (entered twice to confirm) — no email verification. A failed submission keeps the previously typed name/email/phone and highlights only the field(s) that failed validation in red with an inline message; passwords are never echoed back. See FR-3.1.
- **Dashboard "All" tab:** a nav link after "Latest" shows every published article, newest first, 15 on load with a "More" button (+10 per click, greyed out once nothing's left). The "Latest Updates" section (both the default-dashboard and category-page variants) has its own red "More" button linking to this tab. See FR-1.7.
- **Skeleton loading states:** every route segment has a `loading.tsx` (shaped placeholder via `components/Skeletons.tsx`) shown automatically during navigation/data fetch, instead of a blank page.
- **Footer + info pages:** a site-wide footer (email/social/WhatsApp strip + bottom bar with logo, links, copyright) links to six new pages — About Us, Contact Us, Sitemap, Advertisement, Privacy Policy, Comment Policy — all with placeholder/dummy content pending real copy.
- **UI pass:** one unified font site-wide (Geist Sans, replacing the earlier serif-headline/sans-body split), outline SVG icons replacing emoji (search, notification bell, user-menu — logged-in users now see a user icon instead of their name), a pill-shaped search bar, red/accent styling on key section headings and the Edit/Summarize/Bookmark buttons, and a "Most Viewed" box that no longer stretches to match a long news list.
- **MVP simplification (confirmed):** no email/SMTP at all for now — no verification, no password-reset emails. New accounts are active immediately and validated directly via Neon's `User` table in the console; role promotion (Registered User → Moderator) is done the same way until the Admin Management UI (FR-6) is built. Login/Logout user stories were added to the SRS (previously implied but not written down).
- **Full spec:** see [`docs/BRD-SRS-UserStories.md`](docs/BRD-SRS-UserStories.md) for the complete BRD, SRS (roles/permissions matrix, functional & non-functional requirements, data model), and user stories.
- **Test cases:** see [`docs/TestCases.md`](docs/TestCases.md) — one test per user story per role, plus negative/edge cases and cross-cutting non-functional checks (XSS, injection, rate-limiting, responsive layout).
- **Tech stack:** confirmed — see [`docs/Architecture.md`](docs/Architecture.md): Next.js (App Router) + TypeScript + Prisma on Neon (Postgres), Markdown content (not WYSIWYG), Cloudinary for images, Auth.js (no email verification yet), Tailwind CSS, hosted free on Vercel.
- **UI design:** see [`docs/UIDesign.md`](docs/UIDesign.md) — navbar/Dashboard/Details layout originally modeled on Prothom Alo/"Times", since revised per the UI pass above (one font, icon-based nav, red accent theme, real footer spec).

## Open decisions (unresolved — check with user before assuming)
1. Can two Moderators edit the same draft at once, or is it single-owner?
2. Is comment moderation manual-only, or also automated (spam/profanity filtering)?
3. Any monetization (ads) planned, or content-only?
4. Target scale — hobby traffic, or real news-spike traffic (affects caching/CDN choices)?

*(Admin's Post Form flow is confirmed, not open: same form as Moderator, with an extra role-gated "Publish" button — see FR-4.4 and `components/NewsForm.tsx`.)*

## Working conventions
- This project folder (`/Users/abuasif/Official Work/AI Try Out/NewsPortal`) is the local home for all project files — save docs/code here, not just in cloud artifacts.
- **Before writing any code, read [`docs/RULES.md`](docs/RULES.md).** It has the confirmed stack, folder structure, required design patterns (Server Actions calling Prisma directly — no separate service layer, `requireRole()`/`requireSession()`, Zod validation with field-level error feedback, Markdown sanitization, the `loading.tsx` skeleton convention), and an explicit do/don't list (e.g. no email/SMTP code yet, no Admin Management UI yet, no local file storage).
