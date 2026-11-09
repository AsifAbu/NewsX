# NewsX — UI Design Reference

Brand name: **NewsX**. No icon/mark yet — a bold text wordmark is enough for MVP (e.g. "News" in regular weight + "X" in the accent color, matching the two-tone logo pattern in the references).

Derived from three reference screenshots the user shared: a Prothom Alo navbar, a "Times" dashboard concept (Dribbble), and a Prothom Alo article page. This file is the implementation-ready layout spec — read it alongside [`RULES.md`](RULES.md) (patterns/stack) and [`BRD-SRS-UserStories.md`](BRD-SRS-UserStories.md) (functional requirements) before building any page.

## Design tokens (implemented)

| Token | Value | Why |
| --- | --- | --- |
| Typography | **One font site-wide** — Geist Sans (via `next/font`), used for both headings (`font-headline`) and body text | Originally planned as a serif-headline/sans-body split; changed to a single font so no two elements showing the same language ever use different fonts. A different script (e.g. Bengali) may still use its own font. |
| Color | White background, near-black text, one accent color (red/crimson, `--accent`) for the logo, active nav state, key section headings (Most Viewed, Latest Updates, Comments, Read More, the selected category name), and primary/secondary action buttons (Edit, Summarize, Bookmark) | Single CSS variable — easy to swap later |
| Implementation | Tailwind CSS | Confirmed — fills the open "styling" item in `RULES.md` |

## Site-wide navbar (modeled on Prothom Alo; icon/theme pass applied since)

Two rows: logo + date/weather, then nav links + search (left) and notifications + account (right). Skip Prothom Alo's secondary promo-thumbnail strip and language toggle; both are out of MVP scope:

```
[NewsX]                                                    Sunday, Nov 8 · 24°C

Latest  All  Category  Category  ...   [🔍 Search news...]      [🔔] [👤]
```

- **Nav links** (`components/NavLinks.tsx`): "Latest" (unfiltered Dashboard), then **"All"** (every published article, paginated — FR-1.7), then one link per `Category` row (same data that powers the Dashboard filter, FR-1.2); horizontally scrollable on mobile instead of collapsing; active link shown in the accent color.
- **Search** (FR-1.3): a pill-shaped input with a magnifying-glass icon inline (not a separate button), submitting to `/search`. Same component on desktop and in the mobile menu.
- **Notifications**: an outline bell icon (`components/icons.tsx`'s `BellIcon`) with a solid red badge showing the unread count (capped at "9+"); click opens the notification dropdown.
- **Account**: logged-out shows a "Login" button. Logged-in shows a **user-circle icon** — or the user's uploaded avatar, circular, once they've set one via `/profile` — that opens a dropdown (Profile, Bookmarks, Write, Approvals/Users/Reports/Archive for Admin, Logout). The name is still available via the icon's `title`/`aria-label` for accessibility. Clicking a notification, or changing the avatar, refreshes this bell/icon immediately (both actions revalidate the root layout, not just the current page).

## Dashboard page (modeled on the "Times" concept)

**1. Headlines hero** (top of page, below the navbar) — **ranked by today's most-viewed, not newest** (FR-1.4):
- Left (~65% width): one large featured story (today's #1 most-viewed) — image with an overlay headline and a relative timestamp ("2 hours ago").
- Right (~35% width): a compact **"Headlines"** list — the next 4 most-viewed-today stories, grouped by category label, text only, no images.
- Fallback: if fewer than 5 articles were published today, the remaining slot(s) are filled with the next most-viewed articles overall (any date), so the hero is never sparse.

**2. Body — two columns below the hero:**
- **Latest Updates** (left, ~65% width): a flat list of article rows — category label, title, short excerpt, time — newest first, a **fixed 8 items, site-wide** (FR-1.1), independent of the hero's today's-views ranking and of Most Viewed. Ends with a red "More" button, bottom-right, linking to the "All" tab; hidden when already on that tab.
- **Most Viewed** (right sidebar, ~35% width): a numbered ranked list of articles published in the **last 30 days**, ranked by view count (FR-1.6) — not all-time. The box sizes to its own ~10 items (`self-start` — does not stretch to match a taller list next to it, e.g. the "All" tab's growing paginated list). No tabs (Article/Live/Videos) at MVP — there's only one content type right now; add tabs later if a second content type (e.g. Live blogs) is introduced.

**Category view** (a category link, or the **"All"** tab, selected): the hero/secondary-card grid is replaced by a list in the same spot — the selected category's name (or "All") shown as a bold red heading above it. A real category's list is a static top-5; the "All" view is the paginated full list (FR-1.7): 15 on load, a red "More" button (bottom-right, disabled/grey once exhausted) appends 10 more per click. A real category page additionally shows the site-wide "Latest Updates" list beneath it (with its own "More" → All link); the "All" view does not repeat it inline — the standard "Latest Updates" section below the grid already covers that.

Category filter and search live in or just under the navbar, not as their own dashboard section.

**Data note:** "Most Viewed" needs `News.view_count`, incremented on each Details page load — already added to the SRS data model (§SRS 4) and FR-1.6.

## News Details page (modeled on the Prothom Alo article page)

Top to bottom:
1. Category breadcrumb (e.g. "Politics")
2. Headline (H1) — with a red-outlined **Update** control next to it (FR-2.5), styled in the accent red theme (filled on hover). Clicking it opens a dropdown: **Admin** sees Edit / Delete / Hide, for any article; a **Moderator** sees Edit only, also for any article (not just their own — see FR-4.5). Clicking Edit navigates to the Post Form.
3. Byline (author) + published date + view count
4. Featured image
5. **Archived banner** (Admin only, when the article is Deleted/Hidden, FR-2.6): states the status and timestamp, with a one-click "Restore to Active" button.
6. Pending-approval banner (Admin only, when status is Pending): Approve / Reject + reason
7. **Summarize** toggle and **Bookmark** button, both in the accent red theme — Summarize is outlined red (toggles to "Full Version" once summarized); Bookmark is outlined red when not bookmarked and filled solid red ("★ Bookmarked") once it is
8. Article body, rendered from Markdown through the sanitize pipeline in `RULES.md`
9. **Comments** section (FR-2.2), heading in bold red: existing comments, a "Report" action per comment, and an add-comment box for logged-in users
10. **Read More** sidebar — one combined bordered box (same style as the Dashboard's "Most Viewed": heading inside, items separated by dividers, not individually boxed), heading in bold red, with a "More.." link inside the box pointing back to the Dashboard

All of the action buttons above (Edit/Delete/Hide, Restore, Approve/Reject, Bookmark) disable themselves and show a loading state the instant they're clicked, via the shared `SubmitButton` component — see "Loading states" below.

**Two things in the reference design that are not in current scope — flagged, not built yet:**
- **Share icons** (copy-link at minimum) near the byline — seen in the reference, not yet implemented.
- **Emoji reaction bar** (love/clap/smile/angry with %) under the article — a lightweight engagement feature seen in the reference; not in the BRD. Worth adding to the Phase 2 Nice-to-have list if wanted — say so and I'll add it there.
- **Recurring "More on [topic]" sidebar box** repeated down the article length — same idea as "Read More" above; one instance at the end of the article is enough for MVP.

## Profile page (implemented)

Self-service `/profile` (FR-3.6), any logged-in user:
- Circular avatar (click to upload via Cloudinary) next to the user's name — `components/AvatarUpload.tsx`. This is the only place the avatar can be changed; once set, it replaces the navbar's user-circle icon everywhere.
- Fields: email, phone, joined date, comments-posted count — always shown.
- Role, news-authored count, account status — shown only for Moderator/Admin viewing their own profile; hidden for a plain Registered User (not meaningful for that role).
- No Deactivate/Delete controls — same page layout as the Admin's "view any user" page (`/users/[id]`), minus those two Admin-only actions.

## Archive page (implemented)

Admin-only `/archive` (FR-8), linked from the profile dropdown. A table of every Deleted/Hidden news item:
- Columns: Title (links to the article — only Admin can actually open it), date of operation (`archivedAt`), current status (red "Deleted" / amber "Hidden"), "Updated by" (the acting admin's name, linked to their `/users/[id]` profile), and three per-row buttons — Active / Delete / Hide — with whichever matches the current status disabled.
- Moving an item to Active clears it from this list (back to normal Published visibility everywhere).

## Footer (implemented)

Two bars, every page, below the main content (`components/Footer.tsx`):
- **Top strip** (three columns on desktop, stacked on mobile): "Email Us" (mailto link), "Follow Us" (Facebook/Twitter/Instagram/YouTube outline icons), "WhatsApp" (number). **Placeholder/dummy values for now** — swap for NewsX's real contact details and social accounts later.
- **Bottom bar** (dark background): logo on the left, links to the six FR-7.2 pages (About Us, Contact us, Sitemap, Advertisement, Privacy Policy, Comment Policy) in the middle, copyright + a "Technical Partner: TBD" placeholder on the right.

The six linked pages currently show placeholder copy pending real content (Sitemap is the exception — it's data-driven, listing the real page links and `Category` rows).

## Loading states (implemented)

Every route has a `loading.tsx` that Next.js shows automatically while that page's data is loading, built from shared primitives in `components/Skeletons.tsx` rather than a generic spinner:

| Page shape | Skeleton used |
| --- | --- |
| Dashboard | `DashboardSkeleton` — hero image/text blocks + card grid + Most Viewed list |
| News Details | `ArticleSkeleton` — title/meta bars, full-width image, body lines, Read More rows |
| Search, My Submissions, Approval List | `ListSkeleton` |
| Bookmarks, Reports, Users | `TableSkeleton` |
| Login, Register | `FormSkeleton` |
| Post Form | `PostFormSkeleton` |
| User detail | `DetailSkeleton` |

The Navbar and Footer never show a skeleton — they persist across navigations and would just flash.

**Button-level loading (implemented, separate from the above):** every form-driven action button site-wide (Edit/Delete/Hide, Approve/Reject, Bookmark, comment Delete, Reactivate, Logout, the Post Form's Save/Submit/Publish, Archive's Active/Delete/Hide, etc.) uses the shared `components/SubmitButton.tsx`. It disables itself and shows a small inline spinner the instant it's clicked, for as long as its Server Action is in flight — and since it's built on React's `useFormStatus()`, every button sharing that same `<form>` disables together, not just the one clicked. This is what stops a slow action (e.g. Publish) from being double-clicked into firing twice.

## Responsive behavior

- Navbar collapses to logo + search + hamburger below ~768px; category links (including "All") move into the hamburger menu, along with the search bar.
- Dashboard's Headlines hero stacks to one column (featured story, then the Headlines list); Latest Updates and Most Viewed stack to one column, with Most Viewed moving below Latest Updates.
- Details page is single-column throughout.
- Footer's top strip stacks to one column on mobile; the bottom bar's logo/links/copyright stack vertically and center.
