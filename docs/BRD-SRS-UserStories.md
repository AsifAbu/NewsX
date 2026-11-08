# NewsPortal — BRD, SRS & User Stories

Nov 7, 2026 · @Asif

## Your Original Idea

A web news portal with four user tiers and five core pages:

**Roles**

- **Visitor/Guest** — read news only
- **Registered User** — Guest + view, pin/bookmark news, set interested categories, manage profile, comment
- **Moderator** — Registered User + write/create news, submit for admin approval
- **Admin** — Registered User + approve/reject moderator submissions, create and publish news directly, delete news/users/comments

**Pages**

1. Dashboard — latest news in short form
2. News Details — full article
3. Profile — register, login, reset password
4. News Post Form — moderator/admin authoring
5. Approval List — admin reviews pending submissions, using page 2 for full preview

That's a solid, lean skeleton. The gaps below are what turn it into a buildable, launch-ready spec.

## Gap Analysis & Recommendations

Your 4 roles and 5 pages cover the core loop well. Below are the gaps, grouped by priority, plus terminology items that need a decision before writing requirements.

### Must-fix (blocks a usable MVP)

| Gap | Why it matters | Suggestion |
| --- | --- | --- |
| No Search | Readers expect to find news by keyword | Add a search bar on Dashboard (API + results view); doesn't need its own page |
| No rejection workflow | Admin can "approve" — what happens when they don't? | Add Reject + reason; Moderator needs a "My Submissions" status view (Draft/Pending/Approved/Rejected) |
| No category/tag browsing | "Interested category" is stored on profile but never used | Add category filter chips on Dashboard; use the stored preference to rank/sort |
| No Admin page for users/comments | BRD says Admin can "delete news+user+comment" but no page hosts that | Reuse the Approval List pattern: a filterable management list for Users and for reported Comments |
| Comment abuse handling is reactive-only | Only "Admin deletes" is defined — no way for users to flag | Add a "Report comment" action for Registered Users, feeding the Admin comment list above |
| Auth flow under-specified | "reset pass" is named but not email verification or forgot-password | MVP (confirmed): signup creates an active account immediately, no verification; forgot-password and email verification are deferred to Phase 2 — see docs/Architecture.md. |

### Should-add (important, cheap to include now)

- **SEO fundamentals** — slugs, meta title/description, Open Graph tags, sitemap.xml — the primary acquisition channel for a news site.
- **Featured image + attribution** on news (image, caption, source/credit).
- **Draft/auto-save** on the Post Form so Moderators don't lose longer pieces mid-edit.
- **"Pin" is ambiguous** — it could mean (a) a personal bookmark/reading list for Registered Users, or (b) pinning an article to the top of the Dashboard (an editorial/Admin action). Recommend renaming the user-facing one to **"Bookmark/Save"** and treating homepage pinning as a separate Admin capability.
- **Breaking/Featured news slot** on Dashboard.
- **Basic notifications** — **Phase 2** (needs SMTP; see `docs/Architecture.md`): email the Moderator on approve/reject, email a user on comment reply. MVP covers this via the in-app "My Submissions" status view instead.
- **Legal pages** — Privacy Policy, Terms of Service — needed once you're collecting accounts/comments in most jurisdictions.

### Nice-to-have (phase 2)

- RSS feed / newsletter digest built from "interested category" data
- Social login (Google) alongside email/password
- Related articles on the Details page
- Admin analytics (views, most-read, engagement)
- Author/reporter public profile page
- Edit history/versioning on published articles
- Multi-language / i18n

### Needs your decision (open questions)

1. Can two Moderators edit the same draft at once, or is it single-owner?
2. Does Admin use the *same* Post Form (page 4) with an instant-publish option, or a separate flow? (Recommended: same form, role-gated "Publish" vs "Submit for approval" button.)
3. Is comment moderation manual-only, or do you also want basic spam/profanity filtering?
4. Any monetization (ads) planned, or content-only for now?
5. Target scale — hobby traffic, or real news-spike traffic (affects caching/CDN choices in the SRS)?

## Business Requirements Document (BRD)

### 1. Purpose

Build a web-based news portal where editorial staff (Moderators, Admin) publish vetted news content, and the public (Guests, Registered Users) consumes, personalizes, and engages with it (bookmarks, comments).

### 2. Scope

**In scope (MVP)**

- 4 roles: Guest, Registered User, Moderator, Admin
- Dashboard, News Details, Profile, News Post Form, Approval List, plus the recommended Search/category filter and Admin management views
- Moderator submission → Admin approval workflow; Admin direct publish
- Comments, bookmarks, category preferences

**Out of scope (MVP)**

- Monetization/ads, native mobile apps, multi-language content, push notifications, advanced analytics (Phase 2 candidates)

### 3. Stakeholders

- **Readers** (Guest, Registered User) — consume content
- **Editorial team** (Moderator) — produce content
- **Site Admin** — governs content quality, users, moderation
- **Product owner** (you) — defines priorities, approves scope

### 4. Business Rules

- All Moderator-submitted news requires Admin approval before publishing.
- Admin may publish directly without approval.
- Only Admin can delete news, users, or comments.
- A Registered User must be promoted to Moderator by Admin (no self-signup as Moderator).
- A rejected submission returns to the Moderator with a reason, editable and resubmittable.

### 5. Success Metrics

- Time from submission to approval/rejection decision
- % of submissions approved on first pass
- Registered-user retention / return visits
- Comment engagement rate per article
- Search → article click-through rate

### 6. Assumptions & Constraints

- Single language, single currency/timezone at MVP (confirm).
- Web-only, responsive design; no native app at MVP.
- Content is text + images only (no video) at MVP unless stated otherwise.
- No transactional email at MVP (no verification, no password-reset email); new accounts are validated directly via Neon's `User` table in the console, and role promotion (Registered User → Moderator) is done the same way until the Admin Management page (FR-6) ships. See `docs/Architecture.md`.

### 7. Risks

- No rejection/status workflow → Moderators get no feedback and disengage.
- No SEO at launch → organic traffic stays near zero, which is the primary acquisition channel for a news site.
- No comment moderation tooling → spam/abuse erodes trust quickly once public.

## Software Requirements Specification (SRS)

### 1. Roles & Permissions Matrix

| Capability | Guest | Registered User | Moderator | Admin |
| --- | --- | --- | --- | --- |
| View news | ✅ | ✅ | ✅ | ✅ |
| Register / Login / Reset password | ✅ (register) | ✅ | ✅ | ✅ |
| Bookmark news | ❌ | ✅ | ✅ | ✅ |
| Set interested categories | ❌ | ✅ | ✅ | ✅ |
| Comment on news | ❌ | ✅ | ✅ | ✅ |
| Report a comment | ❌ | ✅ | ✅ | ✅ |
| Create/submit news for approval | ❌ | ❌ | ✅ | ✅ (optional) |
| View own submission status | ❌ | ❌ | ✅ | n/a |
| Approve/reject submitted news | ❌ | ❌ | ❌ | ✅ |
| Publish news directly | ❌ | ❌ | ❌ | ✅ |
| Delete news / user / comment | ❌ | ❌ | ❌ | ✅ |
| Promote user to Moderator | ❌ | ❌ | ❌ | ✅ |

### 2. Functional Requirements by Page

**FR-1 Dashboard**

- FR-1.1 Paginated/infinite-scroll list of published news, newest first: title, thumbnail, excerpt, category, publish date.
- FR-1.2 Filter by category/tag.
- FR-1.3 Keyword search across title/body.
- FR-1.4 Optional featured/breaking-news slot at top.
- FR-1.5 Logged-in users see content weighted by their interested categories.
- FR-1.6 "Most Viewed" sidebar module: ranked list of articles by view count (requires a `News.view_count` field, incremented on each Details page view). See `docs/UIDesign.md`. The module's box sizes to its own content (fixed to its list length) and does not stretch to match a longer list next to it.
- FR-1.7 An **"All"** nav tab (alongside "Latest" and the category links) lists every published article, newest first, independent of any category filter. Loads 15 articles initially; a "More" button at the bottom-right loads 10 more per click, appended to the end of the list, until none remain (the button then shows disabled/greyed instead of disappearing). The "Latest Updates" module (FR-1.1's list, wherever it's shown) links to this tab via its own "More" button.

**FR-2 News Details**

- FR-2.1 Full article: title, author, category, image, body, publish/update date.
- FR-2.2 View/add comments (Registered Users+); report action on each comment.
- FR-2.3 Bookmark/Save toggle (Registered Users+).
- FR-2.4 When reached from the Approval List, show submission metadata (submitter, submitted date, status) and Approve/Reject actions (Admin only).

**FR-3 Profile**

- FR-3.1 Register (name, email, phone, password entered twice to confirm); account is active immediately — no email verification in the MVP (Phase 2 item; see `docs/Architecture.md`). On a validation failure (e.g. invalid phone, passwords don't match, email already registered), the form keeps the previously entered name/email/phone and highlights only the field(s) that failed with a red border and an inline message — password fields are cleared and never echoed back.
- FR-3.2 Login / Logout. The Login page shows a "Not registered yet? Signup here" link to the Register page for users without an account.
- FR-3.3 Forgot/reset password via emailed link — **Phase 2** (requires SMTP, not in the MVP architecture).
- FR-3.4 Edit profile (name, avatar, interested categories).
- FR-3.5 View own bookmarks and (Moderator) own submissions with status.

**FR-4 News Post Form**

- FR-4.1 Fields: title, category, tags, featured image + caption, body (rich text).
- FR-4.2 Save as Draft.
- FR-4.3 Moderator: "Submit for Approval" → status = Pending.
- FR-4.4 Admin: "Publish" → status = Published immediately, or "Submit for Approval" if choosing peer review.
- FR-4.5 Edit an existing Draft/Rejected item and resubmit.

**FR-5 Approval List**

- FR-5.1 List all Pending submissions: submitter, title, category, submitted date.
- FR-5.2 Filter by status (Pending/Approved/Rejected).
- FR-5.3 Click through to News Details (FR-2.4) to review, Approve, or Reject + reason.
- FR-5.4 On reject, the Moderator sees the status and reason in their own "My Submissions" view (MVP); emailing the Moderator is a Phase 2 addition once SMTP is available.

**FR-6 Admin Management (recommended addition — Phase 2; until built, use the Neon console directly for user edits and role changes)**

- FR-6.1 User list: search, view, suspend/delete, promote to Moderator.
- FR-6.2 Reported-comments queue: view, dismiss, or delete.

**FR-7 Informational Pages (site-wide footer)**

- FR-7.1 A site-wide footer appears on every page: an email/social-links/WhatsApp strip, and a bottom bar with the logo, links to FR-7.2's pages, and a copyright line.
- FR-7.2 Six Guest-accessible pages, linked from the footer: About Us, Contact Us, Sitemap (links to the main pages and categories), Advertisement, Privacy Policy, Comment Policy. **Currently placeholder/dummy content** (contact email/WhatsApp number, addresses, legal text) — real copy is a follow-up item, not yet written.

### 3. Non-Functional Requirements

- **Security**: hashed passwords, CSRF protection, input sanitization on comments/news body (XSS), rate-limited login attempts, CAPTCHA on registration/comments.
- **Performance**: Dashboard first-load under \~2s on broadband; cached/CDN-served images.
- **SEO**: server-rendered or pre-rendered article pages, clean slugs, sitemap.xml, meta tags, Open Graph.
- **Availability**: target 99%+ uptime for MVP hosting.
- **Accessibility**: WCAG 2.1 AA for core reading flows.
- **Scalability**: stateless app layer so it can scale horizontally during traffic spikes (breaking news).
- **Compliance**: Privacy Policy, Terms of Service, cookie consent if using analytics/ads.
- **Perceived performance**: every route shows a shaped skeleton-loading placeholder (matching that page's real layout) during navigation/data fetch, instead of a blank screen or a generic spinner.
- **Visual consistency**: one font family for all English-language UI and content site-wide (a different script, e.g. Bengali, may use its own font); a single accent color (red) used consistently for primary actions and key section headings.

### 4. High-Level Data Model

| Entity | Key fields |
| --- | --- |
| User | id, email, phone (optional), password\_hash, name, role, interested\_categories\[\] |
| News | id, title, slug, body, image\_url, category\_id, author\_id, status (draft/pending/published/rejected), rejection\_reason, published\_at, view\_count |
| Category | id, name |
| Comment | id, news\_id, user\_id, body, status (visible/reported/removed), created\_at |
| Bookmark | id, user\_id, news\_id |
| ApprovalLog | id, news\_id, admin\_id, decision, reason, decided\_at |

### 5. External Interfaces

- Neon (Postgres) — primary database for all entities above (confirmed; see `docs/Architecture.md`)
- Cloudinary — image storage/CDN for news images and avatars (confirmed; see `docs/Architecture.md`)
- Transactional email service (Resend / Amazon SES) — **Phase 2**; not used in the MVP (no verification or password-reset emails at launch)

## User Stories

### Guest

- As a Guest, I want to browse the Dashboard without logging in, so I can read news freely.
  - AC: Dashboard and Details pages are publicly accessible; comment/bookmark actions prompt login.
- As a Guest, I want to search and filter news by category, so I can find what interests me.
- As a Guest, I want to see which articles are most viewed/trending, so I can find popular content quickly.
- As a Guest, I want an "All" tab that lists every published article newest-first with a way to load more, so I can browse beyond the curated homepage sections.
  - AC: 15 articles load initially; "More" appends 10 more per click and goes disabled/grey once nothing is left; "Latest Updates" also links here via its own "More" button.
- As a Guest, I want to find informational pages (About, Contact, Sitemap, Advertisement, Privacy Policy, Comment Policy) via the site footer, so I can learn more about the site and its policies.

### Registered User

- As a Registered User, I want to register with my name, email, phone number, and a password (entered twice), so I get an account immediately.
  - AC: Account is created and active right away — no email verification step in the MVP (Phase 2: verify email before full access). If validation fails, the name/email/phone I typed stay in the form and only the field(s) that failed are highlighted red with an explanation; my password is never echoed back.
- As a Registered User, I want to log in with my email and password, so I can access my account and personalized features.
  - AC: The Login page offers a "Not registered yet? Signup here" link straight to the Register page.
- As a Registered User, I want to log out, so I can secure my account on a shared device.
- As a Registered User, I want to reset my password if I forget it, so I can regain access. **(Phase 2 — requires SMTP, not available at MVP launch)**
- As a Registered User, I want to bookmark articles, so I can find them later from my profile.
- As a Registered User, I want to set my interested categories, so my Dashboard shows relevant news first.
- As a Registered User, I want to comment on an article, so I can share my view.
  - AC: Comment requires login; empty/overlong comments rejected client- and server-side.
- As a Registered User, I want to report an inappropriate comment, so moderators can act on it.

### Moderator

- As a Moderator, I want to write a news article and save it as a draft, so I don't lose work mid-edit.
- As a Moderator, I want to submit my article for approval, so Admin can review it before it goes live.
- As a Moderator, I want to see the status of my submissions (Pending/Approved/Rejected), so I know what needs attention.
- As a Moderator, I want to see the rejection reason and resubmit, so I can fix and republish my work.

### Admin

- As an Admin, I want to see a list of pending submissions, so I can review them in order.
- As an Admin, I want to open a submission's full preview before deciding, so I can judge it in context.
- As an Admin, I want to approve or reject with a reason, so Moderators get clear feedback.
- As an Admin, I want to publish news directly without approval, so I can post time-sensitive content fast.
- As an Admin, I want to delete a news article, user, or comment, so I can enforce content and conduct standards.
- As an Admin, I want to promote a Registered User to Moderator, so the editorial team can grow.
