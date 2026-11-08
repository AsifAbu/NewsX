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
- **Account**: logged-out shows a "Login" button. Logged-in shows a **user-circle icon** (not the user's name) that opens the same dropdown as before (Bookmarks, Write, Approvals/Users/Reports for Admin, Logout) — the name is still available via the icon's `title`/`aria-label` for accessibility.

## Dashboard page (modeled on the "Times" concept)

**1. Headlines hero** (top of page, below the navbar):
- Left (~65% width): one large featured story — image with an overlay headline and a relative timestamp ("2 hours ago").
- Right (~35% width): a compact **"Headlines"** list — 3–4 short headline links grouped by category label, text only, no images.

**2. Body — two columns below the hero:**
- **Latest Updates** (left, ~65% width): a flat list of article rows — category label, title, short excerpt, time — newest first (FR-1.1). Ends with a red "More" button, bottom-right, linking to the "All" tab; hidden when already on that tab.
- **Most Viewed** (right sidebar, ~35% width): a numbered ranked list — title, time (FR-1.6). The box sizes to its own ~10 items (`self-start` — does not stretch to match a taller list next to it, e.g. the "All" tab's growing paginated list). No tabs (Article/Live/Videos) at MVP — there's only one content type right now; add tabs later if a second content type (e.g. Live blogs) is introduced.

**Category view** (a category link, or the **"All"** tab, selected): the hero/secondary-card grid is replaced by a list in the same spot — the selected category's name (or "All") shown as a bold red heading above it. A real category's list is a static top-5; the "All" view is the paginated full list (FR-1.7): 15 on load, a red "More" button (bottom-right, disabled/grey once exhausted) appends 10 more per click. A real category page additionally shows the site-wide "Latest Updates" list beneath it (with its own "More" → All link); the "All" view does not repeat it inline — the standard "Latest Updates" section below the grid already covers that.

Category filter and search live in or just under the navbar, not as their own dashboard section.

**Data note:** "Most Viewed" needs `News.view_count`, incremented on each Details page load — already added to the SRS data model (§SRS 4) and FR-1.6.

## News Details page (modeled on the Prothom Alo article page)

Top to bottom:
1. Category breadcrumb (e.g. "Politics")
2. Headline (H1) — with a red-outlined **Edit** button next to it for the author/Admin (when previewing/editing), styled in the accent red theme (filled on hover)
3. Byline (author) + published date + view count
4. Featured image
5. Pending-approval banner (Admin only, when status is Pending): Approve / Reject + reason
6. **Summarize** toggle and **Bookmark** button, both in the accent red theme — Summarize is outlined red (toggles to "Full Version" once summarized); Bookmark is outlined red when not bookmarked and filled solid red ("★ Bookmarked") once it is
7. Article body, rendered from Markdown through the sanitize pipeline in `RULES.md`
8. **Comments** section (FR-2.2), heading in bold red: existing comments, a "Report" action per comment, and an add-comment box for logged-in users
9. **Read More** sidebar — one combined bordered box (same style as the Dashboard's "Most Viewed": heading inside, items separated by dividers, not individually boxed), heading in bold red, with a "More.." link inside the box pointing back to the Dashboard

**Two things in the reference design that are not in current scope — flagged, not built yet:**
- **Share icons** (copy-link at minimum) near the byline — seen in the reference, not yet implemented.
- **Emoji reaction bar** (love/clap/smile/angry with %) under the article — a lightweight engagement feature seen in the reference; not in the BRD. Worth adding to the Phase 2 Nice-to-have list if wanted — say so and I'll add it there.
- **Recurring "More on [topic]" sidebar box** repeated down the article length — same idea as "Read More" above; one instance at the end of the article is enough for MVP.

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

## Responsive behavior

- Navbar collapses to logo + search + hamburger below ~768px; category links (including "All") move into the hamburger menu, along with the search bar.
- Dashboard's Headlines hero stacks to one column (featured story, then the Headlines list); Latest Updates and Most Viewed stack to one column, with Most Viewed moving below Latest Updates.
- Details page is single-column throughout.
- Footer's top strip stacks to one column on mobile; the bottom bar's logo/links/copyright stack vertically and center.
