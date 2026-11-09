# NewsPortal — Test Cases

Derived from the User Stories in [`BRD-SRS-UserStories.md`](BRD-SRS-UserStories.md). Each story has at least one positive test case; stories with validation, permission, or state-transition behavior also get negative/edge cases. Items marked **(TBD)** depend on an open decision in [`CLAUDE.md`](../CLAUDE.md) — expected result assumes the recommended default until confirmed.

Legend: Priority — High (blocks release) / Medium / Low.

> **MVP note:** per `docs/Architecture.md`, there is no email/SMTP service at MVP. Email verification and password-reset test cases are therefore moved to the **Phase 2** section at the end, not dropped. New accounts are validated directly in Neon's `User` table console, and role promotion is done the same way until the Admin Management UI (FR-6) ships.

## Guest

| ID | Title | Precondition | Steps | Expected Result | Priority |
| --- | --- | --- | --- | --- | --- |
| TC-G-01 | View Dashboard without login | Not logged in | Open the Dashboard | List of published news shown; no login required | High |
| TC-G-02 | Open News Details as Guest | Not logged in | Click into an article | Full article shown; comment/bookmark controls prompt login instead of acting | Medium |
| TC-G-03 | Search news by keyword | Not logged in | Enter a keyword that matches an article title/body | Matching articles returned | High |
| TC-G-04 | Search with no matches | Not logged in | Enter a keyword matching nothing | "No results found" message shown, no error | Medium |
| TC-G-05 | Filter by category | Not logged in | Select a category filter | Only articles in that category shown | High |
| TC-G-06 | Attempt to comment as Guest | Not logged in, on Details page | Try to submit a comment | Blocked; redirected/prompted to log in | High |
| TC-G-07 | Attempt to bookmark as Guest | Not logged in, on Details page | Try to bookmark the article | Blocked; redirected/prompted to log in | Medium |
| TC-G-08 | View "Most Viewed" sidebar | None | Open the Dashboard | Sidebar shows articles ranked by view count, highest first, independent of login state | Medium |
| TC-G-09 | View the "All" tab | Not logged in | Click "All" in the nav, after "Latest" | Shows every published article, newest first, up to 15 | High |
| TC-G-10 | "All" tab — load more | On the "All" tab, more than 15 published articles exist | Click the "More" button | 10 more articles appended to the end of the list; list does not reset/scroll away from where it was | High |
| TC-G-11 | "All" tab — no more results | On the "All" tab, every article has been loaded | Observe the "More" button | Button is greyed out/disabled instead of disappearing; clicking it does nothing | Medium |
| TC-G-12 | "Latest Updates" → All | On the Dashboard (or a category page), "Latest Updates" section visible | Click its "More" button | Navigates to the "All" tab; this button is itself hidden when already on the "All" tab | Medium |
| TC-G-13 | Footer info pages load | On any page | Click each footer link: About Us, Contact us, Sitemap, Advertisement, Privacy Policy, Comment Policy | Each navigates to its page and renders without error (content is placeholder for now) | Medium |
| TC-G-14 | Login page offers Signup | Not logged in | Open the Login page | "Not registered yet? Signup here" link is visible; clicking it opens the Register page | Medium |
| TC-G-15 | "Most Viewed" box height is fixed | None | Open the "All" tab (a long list) and compare the "Most Viewed" box to the list next to it | "Most Viewed" box height matches its own ~10 items; it does not stretch to match the longer list | Low |
| TC-G-16 | Hero ranks by today's most-viewed | At least 5 articles published today with different view counts | Open the Dashboard | The 5 hero cards are ordered by today's view count descending, not by publish time | High |
| TC-G-17 | Hero fallback when fewer than 5 published today | Fewer than 5 articles published today | Open the Dashboard | Remaining hero slots are filled with the next most-viewed articles overall (any date) | Medium |
| TC-G-18 | "Most Viewed" uses a 30-day window | An article published more than 30 days ago has very high views; a recent one has fewer | Open the Dashboard | The 30+ day old article does not appear in "Most Viewed", even though its view count is higher | Medium |
| TC-G-19 | "Latest Updates" is a fixed 8, site-wide | More than 8 published articles exist across categories | Open the default Dashboard and a category page | Both show exactly 8 items, newest first, not filtered by category | Medium |

## Registered User

| ID | Title | Precondition | Steps | Expected Result | Priority |
| --- | --- | --- | --- | --- | --- |
| TC-RU-01 | Register with valid details | None | Submit registration form with valid name/email/phone, and the same password in both Password and Confirm password | Account created and **active immediately** (role=user), phone saved; no verification email sent at MVP | High |
| TC-RU-01b | Confirm new user row in Neon | Just registered via TC-RU-01 | Open Neon console → project → `User` table | New row present with correct email/name/phone/role, password stored hashed | High |
| TC-RU-02 | Register with duplicate email | Email already registered | Submit registration with that email | Error: "That email is already registered."; the Email field is shown with a red border and the same message; Name/Email/Phone values the user typed remain in the form | High |
| TC-RU-03 | Register with invalid email format | None | Submit with malformed email | Validation error; Email field shown with a red border + message; no account created | Medium |
| TC-RU-04 | Register with weak password | None | Submit with password below policy (min 8 chars, needs a letter and a number) | Validation error; Password field shown with a red border + message; no account created | Medium |
| TC-RU-04b | Register with invalid phone number | None | Submit with a phone value that's too short or contains invalid characters | Validation error: "Please enter a valid phone number."; Phone field shown with a red border + message; Name/Email/Phone values retained; no account created | Medium |
| TC-RU-04c | Register with mismatched passwords | None | Enter different values in Password and Confirm password | Validation error: "Passwords do not match."; Confirm password field shown with a red border + message; password fields are cleared/never echoed back; Name/Email/Phone values retained; no account created | High |
| TC-RU-06 | Login with valid credentials | Account exists (no verification needed at MVP) | Submit correct email/password | Logged in, redirected to Dashboard | High |
| TC-RU-08 | Login with wrong password | Account exists | Submit wrong password | Error shown, access denied | High |
| TC-RU-21 | Logout | Logged in | Click "Logout" | Session/cookie cleared; redirected to Dashboard as a Guest | Medium |
| TC-RU-12 | Bookmark an article | Logged in | Click "Bookmark/Save" on an article | Article appears under "My Bookmarks" in Profile | High |
| TC-RU-13 | Remove a bookmark | Article already bookmarked | Click "Remove" on it | Removed from "My Bookmarks" | Medium |
| TC-RU-14 | Set interested categories | Logged in | Select categories in Profile and save | Preferences saved; Dashboard ranking reflects them | High |
| TC-RU-15 | Post a comment | Logged in, on Details page | Submit a valid comment | Comment appears under the article | High |
| TC-RU-16 | Submit empty comment | Logged in | Submit with no text | Validation error; comment not posted | Medium |
| TC-RU-17 | Submit overlong comment | Logged in | Submit text exceeding max length | Validation error; comment not posted | Low |
| TC-RU-18 | Report a comment | Logged in, comment exists | Click "Report" on a comment | Comment flagged and appears in Admin's reported-comments queue | High |
| TC-RU-19 | Attempt to access News Post Form | Logged in as Registered User only | Navigate directly to the Post Form URL | Access denied (403 / redirected) | High |
| TC-RU-20 | Attempt to access Approval List | Logged in as Registered User only | Navigate directly to the Approval List URL | Access denied (403 / redirected) | High |
| TC-RU-22 | View own profile as a plain Registered User | Logged in as a USER-role account | Open `/profile` | Email, phone, joined date, comments-posted count shown; Role, News authored, and Status are **not** shown | High |
| TC-RU-23 | View own profile as Moderator/Admin | Logged in as Moderator or Admin | Open `/profile` | Same fields as TC-RU-22 plus Role, News authored, and Status | High |
| TC-RU-24 | Upload a profile picture | Logged in, on `/profile` | Click the avatar, choose an image file | Image uploads, the circular avatar on the page updates immediately, and the navbar's account icon also shows it (replacing the generic user icon) | High |
| TC-RU-25 | Upload an oversized/invalid profile picture | Logged in, on `/profile` | Choose a non-image file, or one over the size limit | Clear inline error shown; no avatar change | Medium |
| TC-RU-26 | Notification mark-as-read clears the indicator | Logged in, at least one unread notification | Click a notification in the bell dropdown | The bell's unread badge count decreases and that notification's unread dot/bold styling clears immediately, without a page reload | Medium |

## Moderator

| ID | Title | Precondition | Steps | Expected Result | Priority |
| --- | --- | --- | --- | --- | --- |
| TC-MOD-01 | Save article as Draft | Logged in as Moderator | Fill in the Post Form, click "Save as Draft" | Saved with status Draft; not publicly visible; appears in "My Submissions" | High |
| TC-MOD-02 | Submit a Draft for approval | Draft exists | Open the draft, click "Submit for Approval" | Status becomes Pending; appears in Admin's Approval List | High |
| TC-MOD-03 | Submit with required field missing | Editing a draft | Clear the title, click "Submit for Approval" | Validation error; stays in Draft, not submitted | Medium |
| TC-MOD-04 | View My Submissions | Has submissions in multiple statuses | Open "My Submissions" | All own submissions shown with correct status (Draft/Pending/Approved/Rejected) | High |
| TC-MOD-05 | View rejection reason | A submission was Rejected | Open that submission | Rejection reason is visible | High |
| TC-MOD-06 | Edit and resubmit a Rejected item | Rejected submission exists | Edit content, click "Submit for Approval" again | Status returns to Pending | High |
| TC-MOD-07 | Attempt to approve/reject a submission | Logged in as Moderator | Try to access Approve/Reject controls (own or others') | Access denied; Moderator has no approval rights | High |
| TC-MOD-08 | Attempt to publish directly | Logged in as Moderator, editing an article | Look for/attempt a direct-publish action | Option not available / action denied | High |
| TC-MOD-09 | Attempt to delete/hide news, or delete a user/comment | Logged in as Moderator | Open the "Update" dropdown on any article, or try any delete action elsewhere | No Delete/Hide options appear in the Update dropdown (Edit only); any other delete action is denied | High |
| TC-MOD-10 | Edit any news article, including one authored by someone else | Logged in as Moderator; a Published article authored by a different user exists | Open that article, click "Update" → "Edit", change content, click "Submit for Approval" | Edit succeeds; article status becomes Pending (taken off the public site until re-approved); Moderator is redirected to the article and can still view it (not a 404) despite not being the author | High |
| TC-MOD-11 | Moderator's Update dropdown shows Edit only | Logged in as Moderator, viewing any article they can see | Click "Update" | Dropdown shows only "Edit" — no Delete/Hide | High |
| TC-MOD-12 | Attempt to edit a Deleted/Hidden article | An article exists with status Deleted or Hidden | Navigate directly to its edit URL (`/post?edit=<id>`), or try to reach it via Update | Article isn't visible/reachable; attempting the edit URL directly redirects with an error, no changes saved | High |
| TC-MOD-13 | Double-click Publish does not duplicate | Logged in as Admin (or Submit for Approval as Moderator), in the Post Form | Click Publish/Submit twice in quick succession | Only one article is created; the second click has no effect because the button(s) disabled and showed a loading state after the first click | High |

## Admin

| ID | Title | Precondition | Steps | Expected Result | Priority |
| --- | --- | --- | --- | --- | --- |
| TC-ADM-01 | View Approval List | At least one Pending submission exists | Open Approval List | Shows submitter, title, category, submitted date for all Pending items | High |
| TC-ADM-02 | Filter Approval List by status | Submissions in multiple statuses exist | Select a status filter | List updates to show only that status | Medium |
| TC-ADM-03 | Open full preview from Approval List | Pending submission exists | Click a submission | Opens News Details with full content, submission metadata, and Approve/Reject controls | High |
| TC-ADM-04 | Approve a submission | Pending submission open | Click "Approve" | Status → Published; article goes live on Dashboard; Moderator sees "Approved" in their My Submissions view (Phase 2: also emailed) | High |
| TC-ADM-05 | Reject a submission with reason | Pending submission open | Click "Reject", enter a reason, confirm | Status → Rejected; reason stored; Moderator sees status + reason in My Submissions view (Phase 2: also emailed) | High |
| TC-ADM-06 | Reject without a reason | Pending submission open | Click "Reject", leave reason blank, confirm | Validation error; rejection blocked until a reason is given | Medium |
| TC-ADM-07 | Publish directly | Logged in as Admin, in Post Form | Fill form, click "Publish" | Article goes live immediately, no approval step | High |
| TC-ADM-08 **(TBD)** | Submit own article for approval instead | Logged in as Admin, in Post Form | Choose "Submit for Approval" instead of "Publish" | Behaves like a Moderator submission (enters Approval List) | Low |
| TC-ADM-09 | Delete a published article (reversible) | Published article exists | Open it, click "Update" → "Delete" | Status → Deleted immediately (no confirmation step); `archivedAt`/`archivedBy` recorded; article removed from Dashboard/search/Details for everyone except Admin; still restorable, not permanently erased | High |
| TC-ADM-09b | Hide a published article | Published article exists | Open it, click "Update" → "Hide" | Status → Hidden; same visibility exclusion and record-keeping as Delete, distinguished by status label | High |
| TC-ADM-09c | Restore a Deleted/Hidden article to Active | Article is Deleted or Hidden | From the article's own page (banner) or the Archive page, click "Active" | Status → Published; `archivedAt`/`archivedBy` cleared; article reappears everywhere it did before | High |
| TC-ADM-09d | Deleted/Hidden invisible to everyone but Admin | Article is Deleted or Hidden, authored by a Moderator | As Guest, as a plain Registered User, and as the Moderator who authored it (logged in), try to open the article's URL and check "My Submissions" | 404 in every case for all three; article does not appear in the Moderator's own My Submissions list either | High |
| TC-ADM-09e | Archive page lists Deleted/Hidden items | At least one Deleted and one Hidden article exist | Open `/archive` (via the profile dropdown) | Table shows title, date of operation, current status, and "Updated by" (linked to that admin's `/users/[id]` profile) for each; Active/Delete/Hide controls present, with the one matching current status disabled | High |
| TC-ADM-10 **(TBD)** | Delete a user account | User account exists; MVP: via Neon console (FR-6 Admin Management UI is Phase 2) | Delete the row directly in Neon (MVP) or via Admin Management UI (Phase 2) | User can no longer log in; their past comments/articles handled per retention policy (open decision) | High |
| TC-ADM-11 | Delete a comment | Comment exists | Open comment management, click Delete, confirm | Comment removed from the article thread | High |
| TC-ADM-12 | View reported-comments queue | At least one comment reported | Open the queue | All reported comments listed | High |
| TC-ADM-13 | Dismiss a reported comment | Reported comment in queue | Click "Dismiss" | Removed from queue; comment remains visible on the article | Medium |
| TC-ADM-00 | Promote a user via Neon console (MVP interim) | Registered User account exists | In Neon console, edit that user's row and change `role` to `moderator` | On next login/session refresh, user has Moderator access (can reach the Post Form) | High |
| TC-ADM-14 **(Phase 2 UI)** | Promote a user to Moderator via Admin Management | Registered User account exists; FR-6 Admin Management UI built | Open user in Admin Management, click "Promote to Moderator" | User's role updates; they gain access to the Post Form | Low |
| TC-ADM-15 | Non-Admin attempts an Admin-only action | Logged in as Registered User or Moderator | Call/navigate to any Admin-only action (delete user, approve, promote) | Access denied (403) in every case | High |

## Cross-cutting / Non-Functional

| ID | Title | Steps | Expected Result | Priority |
| --- | --- | --- | --- | --- |
| TC-NF-01 | XSS in comment body | Submit a comment containing `<script>alert(1)</script>` | Input is sanitized/escaped; script does not execute | High |
| TC-NF-02 | Injection in search field | Submit a search query with SQL/NoSQL injection payloads | Handled safely; no data exposure or error leak | High |
| TC-NF-03 | Brute-force login | Submit wrong password repeatedly for one account | Account/IP rate-limited or temporarily locked after N attempts | High |
| TC-NF-04 | Unauthenticated API access | Call a protected endpoint (e.g. admin delete) with no/invalid session | 401/403 returned, no data returned | High |
| TC-NF-05 | Dashboard load performance | Load Dashboard under normal conditions | First meaningful content renders within the agreed target (see SRS NFRs) | Medium |
| TC-NF-06 | Responsive layout | Load Dashboard, Details, Profile, Post Form, Approval List at mobile viewport width | Layout remains usable, no horizontal scroll, no overlapping elements | Medium |
| TC-NF-07 | Skeleton loading state shown during navigation | Throttle the network, navigate to any route | Observe the page before data arrives | A shaped skeleton placeholder matching that page's layout is shown (not a blank page or a generic spinner) | Low |
| TC-NF-08 | One font per language, site-wide | Open any page | Inspect the computed `font-family` of a heading and of a body paragraph | Both resolve to the same font-family for English-language content; a different script (if present) may use its own font | Low |
| TC-NF-09 | Form buttons disable with a loading state while submitting | Any form-driven action (Approve, Bookmark, Delete comment, Reactivate, Dismiss, Logout, Archive controls, etc.) | Click the button | It immediately shows a loading indicator and becomes unclickable; any other button sharing that same form also becomes unclickable until the request finishes | High |

## Phase 2 — Deferred (not run against the MVP build)

Not dropped — just not applicable until the corresponding feature ships (SMTP for email, or the Admin Management UI). Kept here so they aren't lost.

| ID | Title | Precondition | Steps | Expected Result | Priority | Needs |
| --- | --- | --- | --- | --- | --- | --- |
| TC-RU-05 | Verify email | Registered, unverified | Click verification link from email | Account marked verified | High | SMTP (Resend/SES) |
| TC-RU-07 | Login before email verification | Unverified account exists | Attempt login | Blocked or limited access with a "verify your email" prompt | Medium | SMTP + FR-3.1 verification flow |
| TC-RU-09 | Request password reset | Account exists | Submit "forgot password" with registered email | Reset email sent with a link | High | SMTP (Resend/SES) |
| TC-RU-10 | Reset password via valid link | Reset email received | Open link, set new password | Password updated; can log in with new password | High | SMTP (Resend/SES) |
| TC-RU-11 | Reset password via expired/used link | Link already used or expired | Open the link | Error shown; no password change | Medium | SMTP (Resend/SES) |
| TC-ADM-14 | Promote a user to Moderator via Admin Management | FR-6 Admin Management UI built | Open user in Admin Management, click "Promote to Moderator" | User's role updates; they gain access to the Post Form | Low | FR-6 Admin Management UI |

## Traceability Matrix — every user story, mapped to its test case(s)

Source: user stories as listed in [`BRD-SRS-UserStories.md`](BRD-SRS-UserStories.md) (synced). Confirms no story is untested.

| Role | User Story | Test Case(s) |
| --- | --- | --- |
| Guest | Browse the Dashboard without logging in | TC-G-01, TC-G-02 |
| Guest | Search and filter news by category | TC-G-03, TC-G-04, TC-G-05 |
| Guest | See which articles are most viewed/trending | TC-G-08, TC-G-15, TC-G-18 |
| Guest | Hero ranks by today's most-viewed, with fallback | TC-G-16, TC-G-17 |
| Guest | "Latest Updates" is a fixed 8, site-wide | TC-G-19 |
| Guest | Browse the "All" tab, paginated newest-first | TC-G-09, TC-G-10, TC-G-11, TC-G-12 |
| Guest | Find informational pages via the footer | TC-G-13 |
| Guest | (negative: restricted actions prompt login) | TC-G-06, TC-G-07 |
| Registered User | Register with name/email/phone/password (confirmed), get an account immediately | TC-RU-01, TC-RU-01b, TC-RU-02, TC-RU-03, TC-RU-04, TC-RU-04b, TC-RU-04c |
| Registered User | Log in with email and password | TC-RU-06, TC-RU-08, TC-G-14 |
| Registered User | Log out | TC-RU-21 |
| Registered User | Reset password if forgotten **(Phase 2)** | TC-RU-09, TC-RU-10, TC-RU-11 (Phase 2 section) |
| Registered User | (Phase 2: verify email) | TC-RU-05, TC-RU-07 (Phase 2 section) |
| Registered User | Bookmark articles | TC-RU-12, TC-RU-13 |
| Registered User | Set interested categories | TC-RU-14 |
| Registered User | Comment on an article | TC-RU-15, TC-RU-16, TC-RU-17 |
| Registered User | Report an inappropriate comment | TC-RU-18, TC-ADM-12, TC-ADM-13 |
| Registered User | (negative: Moderator/Admin-only pages blocked) | TC-RU-19, TC-RU-20 |
| Registered User | View own profile (role-based field visibility) | TC-RU-22, TC-RU-23 |
| Registered User | Upload a profile picture | TC-RU-24, TC-RU-25 |
| Registered User | Notification mark-as-read clears the indicator | TC-RU-26 |
| Moderator | Write a news article and save as Draft | TC-MOD-01 |
| Moderator | Submit an article for approval | TC-MOD-02, TC-MOD-03 |
| Moderator | See status of own submissions | TC-MOD-04 |
| Moderator | See rejection reason and resubmit | TC-MOD-05, TC-MOD-06 |
| Moderator | Edit any news article (not just own) and resubmit | TC-MOD-10, TC-MOD-11, TC-MOD-12 |
| Moderator | (negative: no approval/publish/delete/hide rights) | TC-MOD-07, TC-MOD-08, TC-MOD-09 |
| Cross-cutting | No duplicate submissions from a slow action | TC-MOD-13, TC-NF-09 |
| Admin | See list of pending submissions | TC-ADM-01, TC-ADM-02 |
| Admin | Open a submission's full preview before deciding | TC-ADM-03 |
| Admin | Approve or reject with a reason | TC-ADM-04, TC-ADM-05, TC-ADM-06 |
| Admin | Publish news directly without approval | TC-ADM-07, TC-ADM-08 |
| Admin | Delete/Hide a news article (reversible) and restore it | TC-ADM-09, TC-ADM-09b, TC-ADM-09c, TC-ADM-09d |
| Admin | Review archived news on the Archive page | TC-ADM-09e |
| Admin | Delete a news article, user, or comment | TC-ADM-09, TC-ADM-10, TC-ADM-11 |
| Admin | Promote a Registered User to Moderator | TC-ADM-00 (MVP, Neon console), TC-ADM-14 (Phase 2 UI) |
| Admin | (negative: non-Admin blocked from Admin actions) | TC-ADM-15 |
| Cross-cutting | Security / performance / accessibility (not a user story, but required by the SRS NFRs) | TC-NF-01 – TC-NF-09 |
