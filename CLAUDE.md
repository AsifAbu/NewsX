# NewsX (NewsPortal) — Project Context

One-line: a web news portal with 4 user roles and a moderation-gated publishing workflow (Moderators submit, Admin approves or publishes directly). Brand name: **NewsX**.

## Roles
- **Guest** — read news only, no account
- **Registered User** — Guest + bookmark/save news, set interested categories, manage profile, comment, report comments
- **Moderator** — Registered User + write news, submit for Admin approval, track own submission status
- **Admin** — Registered User + approve/reject submissions (with reason), publish directly, delete news/users/comments, promote users to Moderator

## Pages (MVP)
1. **Dashboard** — hero cards ranked by today's most-viewed (falls back to all-time most-viewed if fewer than 5 published today), "Most Viewed" sidebar (last 30 days), "Latest Updates" (fixed 8, site-wide, newest-first, everywhere it appears), search + category filter, plus an **All** tab (`/?category=all`) listing every published article newest-first with "More"-button pagination (15 on load, +10 per click)
2. **News Details** — full article, comments, bookmark; an **Update** control opens a dropdown — Admin sees Edit/Delete/Hide (any article), a Moderator sees Edit only (also any article, not just their own — see "Key business rules")
3. **Profile** — register (email, name, phone, password entered twice to confirm; no email verify), login, forgot/reset password; a self-service `/profile` page (avatar upload via Cloudinary, shown circular in the navbar; Role/News-authored/Status rows hidden for a plain Registered User, shown for Moderator/Admin), view bookmarks/submissions
4. **News Post Form** — author/edit news; Moderator → "Submit for approval", Admin → "Publish" or "Submit for approval" (confirmed: same form, role-gated button — see FR-4.4)
5. **Approval List** — Admin reviews pending submissions, opens page 2 to approve/reject with reason
6. *(recommended, not in original scope)* **Admin Management** — user list (suspend/delete/promote) and reported-comments queue
7. **Footer-linked info pages** — About Us, Contact Us, Sitemap, Advertisement, Privacy Policy, Comment Policy (Guest-accessible, placeholder content for now — see "Status" below)
8. **Archive** (Admin-only, linked from the profile dropdown) — table of every Deleted/Hidden news item: title, date of operation, current status, who did it (linked to their `/users/[id]` profile), and one-click controls to move it to Active/Delete/Hide

## Key business rules
- Moderator-submitted news always needs Admin approval before going live.
- Admin can publish directly, bypassing approval.
- Any Moderator can edit **any** news article (not just their own) — editing always resubmits it for Admin approval (status → Pending); a Moderator never bypasses approval, even on someone else's piece.
- "Delete" a news article is a reversible status (Deleted), not a permanent removal — same for "Hide". Only Admin can set/clear these (via the Update dropdown or the Archive page); Deleted/Hidden is never visible to Guests, Users, or Moderators, including the original author.
- Only Admin can delete users or comments (permanent), and delete/hide/restore news (reversible).
- Registered User → Moderator promotion is Admin-only (no self-signup as Moderator).
- Rejected submissions return to the Moderator with a reason and can be edited + resubmitted.

## Status
- **Stage:** Live and deployed — Next.js app on Vercel, Prisma on Neon, Auth.js, all core routes plus the additions below, working Server Actions, build/lint/typecheck pass. See `docs/RULES.md` "Installed versions & gotchas" for Next.js 16/Prisma 7 specifics found while building this.
- **Registration:** collects name, email, phone, and password (entered twice to confirm) — no email verification. A failed submission keeps the previously typed name/email/phone and highlights only the field(s) that failed validation in red with an inline message; passwords are never echoed back. See FR-3.1.
- **Dashboard "All" tab:** a nav link after "Latest" shows every published article, newest first, 15 on load with a "More" button (+10 per click, greyed out once nothing's left). The "Latest Updates" section (both the default-dashboard and category-page variants) has its own red "More" button linking to this tab. See FR-1.7.
- **Skeleton loading states:** every route segment has a `loading.tsx` (shaped placeholder via `components/Skeletons.tsx`) shown automatically during navigation/data fetch, instead of a blank page.
- **Footer + info pages:** a site-wide footer (email/social/WhatsApp strip + bottom bar with logo, links, copyright) links to six new pages — About Us, Contact Us, Sitemap, Advertisement, Privacy Policy, Comment Policy — all with placeholder/dummy content pending real copy.
- **UI pass:** one unified font site-wide (Geist Sans, replacing the earlier serif-headline/sans-body split), outline SVG icons replacing emoji (search, notification bell, user-menu — logged-in users now see a user icon, or their uploaded avatar, instead of their name), a pill-shaped search bar, red/accent styling on key section headings and the Edit/Summarize/Bookmark buttons, and a "Most Viewed" box that no longer stretches to match a long news list.
- **News ordering (decoupled):** the hero's 5 cards rank by today's most-viewed published articles (falls back to all-time most-viewed if fewer than 5 published today — `News.viewCount` has no per-view timestamp, so both of these are approximated via `publishedAt`, a known limitation); "Most Viewed" ranks by views among articles published in the last 30 days; "Latest Updates" is a fixed 8, site-wide, newest-first, independent of the other two and of any category/All filter.
- **Self-service Profile (`/profile`):** any logged-in user can view their own info (same fields as the Admin user-detail view, minus Deactivate/Delete) and upload a circular avatar (Cloudinary, `newsx/avatars` folder) that then replaces their navbar icon everywhere. Role/News authored/Status are hidden for a plain Registered User (not meaningful for them) and shown for Moderator/Admin.
- **Admin news archive:** News can be **Deleted** or **Hidden** (reversible `NewsStatus` values, not a permanent delete — the old hard-delete action was dead code, never wired to a button) via an "Update" dropdown on News Details (Admin: Edit/Delete/Hide; Moderator: Edit only, for any article, always resubmitting it for approval). `News.archivedAt`/`archivedById` track when and by whom. The new Admin-only `/archive` page lists every archived item with one-click restore/re-archive controls. Deleted/Hidden is never shown to Guests, Users, or Moderators — not even the original author, not even in their own My Submissions.
- **Double-submit prevention (site-wide):** a new `SubmitButton` (wraps `useFormStatus()`) disables itself and shows a spinner while its form is submitting, and — since it tracks the whole form — disables every other button in a multi-submit form too (fixes a real bug: double-clicking Publish before the slow redirect/DB-write finished posted the article twice). Rolled out to every plain form-button site-wide.
- **Notification fix:** marking a notification read now actually clears the navbar's unread dot/badge immediately (it was writing to the DB correctly but never revalidating the layout that renders the bell).
- **MVP simplification (confirmed):** no email/SMTP at all for now — no verification, no password-reset emails. New accounts are active immediately and validated directly via Neon's `User` table in the console; role promotion (Registered User → Moderator) is done the same way until the Admin Management UI (FR-6) is built. Login/Logout user stories were added to the SRS (previously implied but not written down).
- **Full spec:** see [`docs/BRD-SRS-UserStories.md`](docs/BRD-SRS-UserStories.md) for the complete BRD, SRS (roles/permissions matrix, functional & non-functional requirements, data model), and user stories.
- **Test cases:** see [`docs/TestCases.md`](docs/TestCases.md) — one test per user story per role, plus negative/edge cases and cross-cutting non-functional checks (XSS, injection, rate-limiting, responsive layout).
- **Tech stack:** confirmed — see [`docs/Architecture.md`](docs/Architecture.md): Next.js (App Router) + TypeScript + Prisma on Neon (Postgres), Markdown content (not WYSIWYG), Cloudinary for images, Auth.js (no email verification yet), Tailwind CSS, hosted free on Vercel.
- **UI design:** see [`docs/UIDesign.md`](docs/UIDesign.md) — navbar/Dashboard/Details layout originally modeled on Prothom Alo/"Times", since revised per the UI pass above (one font, icon-based nav, red accent theme, real footer spec).

## Open decisions (unresolved — check with user before assuming)
1. Concurrent editing: any Moderator can now edit any article (confirmed, not open), but there's still no locking — if two people save an edit to the same article at the same time, the second write silently overwrites the first with no conflict warning. Worth a "someone else edited this since you opened it" check later?
2. Is comment moderation manual-only, or also automated (spam/profanity filtering)?
3. Any monetization (ads) planned, or content-only?
4. Target scale — hobby traffic, or real news-spike traffic (affects caching/CDN choices)?

*(Admin's Post Form flow is confirmed, not open: same form as Moderator, with an extra role-gated "Publish" button — see FR-4.4 and `components/NewsForm.tsx`.)*

## Working conventions
- This project folder (`/Users/abuasif/Official Work/AI Try Out/NewsPortal`) is the local home for all project files — save docs/code here, not just in cloud artifacts.
- **Before writing any code, read [`docs/RULES.md`](docs/RULES.md).** It has the confirmed stack, folder structure, required design patterns (Server Actions calling Prisma directly — no separate service layer, `requireRole()`/`requireSession()`, Zod validation with field-level error feedback, Markdown sanitization, the `loading.tsx` skeleton convention), and an explicit do/don't list (e.g. no email/SMTP code yet, no Admin Management UI yet, no local file storage).
