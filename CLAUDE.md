# CLAUDE.md — VaidTrack Repository Guide

Persistent source of truth for working in this repo. Read this first. It reflects
direct inspection of the repository (2026-08-26), not the older `README.md` or
`llms.txt`, which contain stale information (see §11).

---

## 1. Project Overview

VaidTrack (`vaidtrack.com`) is a **hybrid medical-tourism website**, not a pure
static site. It has three cooperating layers:

1. **Static frontend** — hand-written HTML pages at the repo root (homepage,
   legal pages, listing pages) plus three standalone landing-page microsites.
   No JS build step for the site itself (Tailwind is either CDN or a
   pre-built `tailwind.min.css`); some assets ship pre-minified.
2. **PHP MVC admin panel** (`adminpanel/`) — a hand-rolled PHP 8 MVC app
   (no framework, no Composer) that is both a **CMS** (authenticated
   CRUD for doctors, treatments, hospitals, specialties, testimonials,
   FAQs, site settings) and a **public content server** (renders
   doctor/treatment/hospital/specialty detail pages dynamically, and
   exposes a read-only JSON API).
3. **JSON API + data-sync layer** — the static frontend's JS
   (`cms.js`, `doctors.js`, `treatments.js`, `specialties.js`) fetches
   live content from the admin panel's `/adminpanel/api/*.json`
   endpoints at runtime and renders it into the static HTML's mount
   points, falling back to local `data/*.json` files (or hardcoded
   markup) if the API is unreachable.

**How they interact:** the CMS database (via `adminpanel`) is the real
source of truth for doctors/treatments/hospitals/specialties/testimonials/FAQs.
The `data/*.json` files under the repo root are a **static fallback/cache**,
not the primary source. Static HTML pages render instantly with fallback
content, then JS upgrades sections in place once the API responds.
`.htaccess` decides, per request, whether a URL is served as a static file
or handed off to the PHP admin panel (see §5).

---

## 2. Repository Structure

Root (selected, confirmed by directory listing):

```
index.html                     Homepage
all-doctors.html, all-treatments.html   Listing pages
hospital.html, hospitals.html  Hospital pages
privacy-policy.html, disclaimer.html
llms.txt                       AI/docs summary — STALE, see §11
.htaccess, _redirects          Rewrite rules (Apache / Netlify-style)
robots.txt, sitemap.xml
package.json                   Empty ({}) — no npm scripts/build defined
adminpanel/                    PHP MVC CMS + public dynamic pages (§4, §5)
data/                           JSON fallback data (§6)
assets/                         Shared CSS/JS/fonts for the main site (§3)
images/                         Shared image assets for the main site
hip-replacement-in-india/       Landing microsite (§7)
knee-replacement-in-india/      Landing microsite (§7)
spine-surgery-in-india/         Landing microsite (§7)
_archive/                       Old logo/brand source files + .cdr design files — not used at runtime
.claude/                        Claude Code project config (skills, worktrees)
.cursor/mcp.json                Cursor GitMCP docs server config
```

**`data/`**
- `data/doctors/doctors.json` — fallback doctor profiles (primary source is the CMS DB via `/adminpanel/api/doctors.json`)
- `data/treatments/treatments.json` — fallback treatment list (primary source is `/adminpanel/api/treatments.json`)

**`assets/`**
- `assets/css/` — `styles.css` (+ `styles.min.css`), `tailwind.min.css`, `treatment-page.css`, `fonts-inter.css`
- `assets/js/` — see §3 for the real, current file list
- `assets/fonts/` — `inter-latin.woff2`, `inter-latin-ext.woff2`

**`images/`**
- `doctors-images/` (filenames match doctor `slug`), `hero/`, `hospital/`, `patients/`, plus brand wordmark files (`vaidtrack-wordmark*.png/webp`) and `logo.png`.

**`.claude/`**
- `skills/taste-skill/` — generic anti-slop frontend design skill (not VaidTrack-specific).
- `worktrees/testimonial-videos-order/` — an active git worktree; be aware it exists but treat it as unrelated working state unless a task references it.

---

## 3. Frontend Architecture

**Actual current files** (do not assume `README.md`'s list — it's out of date):

CSS (`assets/css/`):
- `styles.css` — source; `styles.min.css` — minified build actually linked from `index.html`
- `tailwind.min.css` — pre-built Tailwind, linked directly (no Tailwind CDN in `index.html` currently)
- `treatment-page.css`, `fonts-inter.css`

JS (`assets/js/`), all loaded via `<script defer>` in `index.html`, cache-busted with `?v=` query strings:
- `nav.js` — mobile hamburger menu toggle
- `doctors.js` — fetches `/adminpanel/api/doctors.json` (fallback `data/doctors/doctors.json`), renders doctor cards
- `specialties.js` — fetches `/adminpanel/api/specialties.json`, renders specialties grid
- `cms.js` — syncs hospitals, testimonials, FAQs, and hero content from `/adminpanel/api/*.json` into existing DOM mount points
- `treatments.js` — fetches `/adminpanel/api/treatments.json` (fallback `data/treatments/treatments.json`), renders treatment cards
- `main.min.js` — slider, FAQ, forms, clean-URL section scrolling/history, section order (the minified build actually shipped — there is no unminified `main.js` in the repo)
- `analytics.js` — delayed GTM load (`GTM-KZ86XPT5`) on first interaction or idle timeout; `gtag()` stub queues to `dataLayer`
- `treatment-page.js` — used by treatment detail pages: scroll progress, sticky bar, FAQ, lead form submission to a Google Apps Script endpoint (`GAS_URL`), WhatsApp CTA links

**Shared frontend pattern (important, repeats across `doctors.js`, `treatments.js`, `specialties.js`, `cms.js`):**
fetch from the live admin-panel JSON API first → render into existing static
HTML mount points → on fetch failure, fall back to a local `data/*.json` file
or leave the hardcoded static markup in place. When editing these files,
preserve this fetch → render → fallback pattern rather than assuming the API
is always available.

**WhatsApp CTA number actually in use:** `919871262293` (updated 2026-09-01; README and llms.txt now match, see §11).

---

## 4. CMS / Admin Panel Architecture

`adminpanel/` is a vanilla PHP 8 MVC app, PSR-4-ish autoloaded, no Composer,
no framework. Structure:

```
adminpanel/
├── public/index.php, router.php   Front controller
├── routes/web.php                 All route definitions (single file)
├── app/
│   ├── Core/                      App, Router, Auth, Session, Csrf, Database, Model, Controller, View
│   ├── Controllers/                Admin controllers (auth-gated) + Public* controllers (open) + Controllers/Api/
│   ├── Models/                     Doctor, Treatment, Hospital, Specialty, Testimonial, Faq, User, PasswordResetToken
│   ├── Repositories/                One repository per module + DashboardRepository, RelatedOptionsRepository, SiteSettingRepository
│   ├── Services/                    Business logic + *ExportService per exportable module
│   ├── Middleware/                  AuthMiddleware, GuestMiddleware
│   └── Helpers/                     ImageUploader, RateLimiter, Slug, Validator, functions.php
├── views/                          Plain PHP templates: dashboard, doctors, treatments, hospitals, specialties, testimonials, faqs, settings, public/, auth/, layouts/, partials/, components/
├── database/migrations/            001 through 013 (auth, doctors, rename, treatments, hospitals, specialties, permission cleanup, content module, content sync, hospitals-unique-name, hospitals-address-pincode, hospital-specialties/quick-facts, treatments-price)
├── database/seeds/                 001_admin_user, 002_doctors_related, 003_admin_account
├── config/                         app.php, database.php, session.php
├── scripts/                        setup-local.sh, start-dev.sh
└── storage/, uploads/, public/uploads/   Logs, cache, uploaded images (writable paths)
```

**Confirmed CRUD modules** (each with auth-gated admin routes under `/module`,
`/module/create`, edit/update/delete/restore, and — where present —
import/export):
- **Doctors** — full CRUD + soft-delete/restore + duplicate + import + export (CSV/JSON/Excel)
- **Treatments** — full CRUD + soft-delete/restore + duplicate + import + export (CSV/JSON/Excel)
- **Hospitals** — full CRUD + soft-delete/restore + duplicate + import + export (CSV/JSON/Excel)
- **Specialties** — full CRUD + soft-delete/restore + import + export (CSV/JSON/Excel) — no duplicate route
- **Testimonials** — CRUD (create/edit/update/delete) — no restore/import/export routes confirmed
- **FAQs** — CRUD (create/edit/update/delete) — no restore/import/export routes confirmed
- **Settings** — `hero` (edit) and `icons` (accreditations + quick-fact icons CRUD), no listing/index pattern — single-record/config style

Soft-delete/restore is confirmed via explicit `{id}/delete` and `{id}/restore`
POST routes on Doctors, Treatments, and Hospitals.

Auth: session-based (`AuthMiddleware`/`GuestMiddleware`), login/forgot-password/
reset-password flows in `AuthController`. Local dev default admin credentials
are documented in `adminpanel/README.md` — do not hardcode or repeat
credentials elsewhere.

---

## 5. Public Dynamic Routing

Confirmed public (non-authenticated) routes in `adminpanel/routes/web.php`:

| Route | Controller |
|---|---|
| `GET /doctors/{slug}` | `PublicDoctorController::show` |
| `GET /treatments/{slug}` | `PublicTreatmentController::show` |
| `GET /hospitals/{slug}` | `PublicHospitalController::show` |
| `GET /specialities/{slug}` | `PublicSpecialtyController::show` |
| `GET /api/*.json` | `Api\PublicContentController` (see §6) |

**`.htaccess` routing precedence (root `.htaccess`, confirmed):**
1. `www` → non-`www` redirect; `*.html` → extensionless clean URL redirect.
2. Named home-section paths (`/treatment`, `/doctors`, `/testimonials`,
   `/about-us`, `/faq`, `/contact`, `/book-appointment`, `/visa-travel`,
   `/how-it-works`) always rewrite to `/index.html` (these are in-page
   sections, not the dynamic doctor/treatment/etc. detail routes).
3. **Static file wins if it exists**: if `REQUEST_FILENAME.html` exists on
   disk, it is served directly.
4. **Only if no static file exists** does `/treatments/{slug}` fall through
   to `/adminpanel/treatments/{slug}` (PHP dynamic route), and
   `/specialities/{slug}` to `/adminpanel/specialities/{slug}`.

In short: **static HTML always takes precedence over the PHP dynamic route**
for a given path. The dynamic PHP route is the fallback for slugs that don't
have (or no longer have) a static file. `robots.txt` explicitly disallows
crawling `/adminpanel/` directly.

Note: `_redirects` (Netlify-style) does **not** replicate the PHP dynamic
fallback (rules 3–4 above) — it only has the static clean-URL rewrites. Do
not assume both hosting configs behave identically; `.htaccess` (Apache/
Hostinger) is the one with full PHP-fallback behavior.

Do not invent additional dynamic routes — only the ones listed above and in
`adminpanel/routes/web.php` exist.

---

## 6. JSON API / CMS Data Layer

**Confirmed public read-only endpoints** (`Api\PublicContentController`, all
under `/adminpanel/api/`, unauthenticated):

```
/api/treatments.json
/api/treatments/{slug}.json
/api/specialties.json
/api/hospitals.json
/api/hospitals/{slug}.json
/api/doctors.json
/api/testimonials.json
/api/faqs.json
/api/hero.json
```

**Consumers on the static frontend:**
- `doctors.js` → `/adminpanel/api/doctors.json`, fallback `data/doctors/doctors.json`
- `treatments.js` → `/adminpanel/api/treatments.json`, fallback `data/treatments/treatments.json`
- `specialties.js` → `/adminpanel/api/specialties.json` (no local fallback file confirmed)
- `cms.js` → hospitals, testimonials, FAQs, and hero content from the corresponding `/api/*.json` endpoints (no local fallback files; falls back to existing static markup in the DOM)

`data/doctors/doctors.json` and `data/treatments/treatments.json` are the
**only** local JSON data files in the repo — treat them as fallback/cache
snapshots of the CMS, not as the canonical editable source once the CMS DB
exists. To change doctor/treatment content that should persist, prefer the
admin panel; only edit the `data/*.json` files directly if explicitly asked
to update the static fallback.

---

## 7. Landing Page Microsites

Three standalone, self-contained landing pages, unrelated to the main site's
`assets/`/`images/` (each has its own copies):

```
hip-replacement-in-india/
knee-replacement-in-india/
spine-surgery-in-india/
```

Each confirmed to contain the same structure:
- `index.html` — the landing page itself
- `css/tailwind.min.css` — own local Tailwind build
- `images/` — own doctor photos, `Hospital Logos/`, `logo.png`, `testimonials/`
- `treatment-images/` — procedure-specific images (e.g. "Hip Resurfacing.png", "Revision Hip Replacement.png")
- `ortho icon/` — treatment icon set (note: literal space in the directory name)
- `thank-you/index.html` — post-lead-form thank-you page

These are **not** wired into `assets/js/cms.js` or the JSON API — they are
static, independently maintained pages. A prior fourth microsite,
`top-orthopedics/`, was removed (see §11) with its links pointed back to the
main site.

---

## 8. SEO / Server / Deployment

- **`.htaccess`** (Apache, used on the live Hostinger deployment) — canonical
  domain redirect, clean-URL rewriting, static-vs-PHP-dynamic precedence
  (§5), gzip/deflate compression, cache headers (long-cache for static
  assets, no-cache for HTML), `X-Content-Type-Options` / `Referrer-Policy`
  security headers.
- **`_redirects`** — Netlify-style equivalent of the *static* clean-URL
  rules only; does not include the PHP-dynamic fallback (§5). Treat as
  secondary/legacy unless the site is confirmed to be hosted on Netlify.
- **`robots.txt`** — allows all crawling except `/adminpanel/`; points to `sitemap.xml`.
- **`sitemap.xml`** — lists key static/clean URLs (home, `/all-treatments`, `/doctors`, etc.) with `lastmod` dates.
- **`llms.txt`** — short AI-facing summary; **stale**, see §11.
- **Admin panel deployment**: per `adminpanel/README.md`, deployed as a
  subfolder of the same document root (`vaidtrack.com/adminpanel`) via a
  two-tier `.htaccess` chain (`adminpanel/.htaccess` →
  `adminpanel/public/.htaccess` → `public/index.php`). The vhost document
  root must stay the site root, not `adminpanel/public`. `adminpanel/.env`
  (not `.env.example`) is required at runtime; see that README for the full
  production checklist before touching deployment config.
- **Analytics**: GTM `GTM-KZ86XPT5` (GA4 arrives via GTM, per `analytics.js`).

---

## 9. Development Rules

- **Before modifying anything**, inspect the relevant existing implementation
  (the actual file, not this document's summary of it) — this file is a map,
  not a substitute for reading the code you're about to change.
- Do not replace working architecture with a framework or rewrite large
  portions unless explicitly requested. This is intentionally a hand-rolled
  static site + hand-rolled PHP MVC app.
- Preserve existing URLs, `.htaccess`/`_redirects` routing, SEO structure
  (sitemap, robots, meta tags), analytics/tracking (GTM ID, `dataLayer`
  calls), and the CMS/API relationship (§5, §6) unless explicitly asked to
  change them.
- Prefer minimal, targeted changes over broad refactors.
- Do not create a new/duplicate data source when an existing one already
  covers it (e.g. don't add a new JSON file for doctors — `data/doctors/doctors.json`
  and the CMS DB already own that).
- Do not modify unrelated files (e.g. a landing-microsite change should not
  touch `assets/` shared by the main site, and vice versa).
- **Before making a change, identify which layer owns the behavior**: static
  frontend HTML/CSS/JS, CMS admin (controller/model/view), public JSON API,
  fallback JSON data, or one of the three landing-page microsites — each has
  a different "correct" place to make the same conceptual change.

---

## 10. Important Project Conventions

- **Slugs**: doctor/treatment/hospital/specialty identity is slug-based
  (`Helpers/Slug.php` on the PHP side); doctor image filenames match the
  doctor's `slug` (e.g. `dr-akshay-tiwari.jpg`).
- **Cache-busting**: CSS/JS `<link>`/`<script>` tags on the main site use
  `?v=YYYYMMDD-description` query strings bumped on every shipped change —
  follow this pattern when editing linked assets in `index.html`.
- **Graceful-degradation fetch pattern**: see §3/§6 — always fetch live →
  render → fall back, never assume the admin API is reachable.
- **`.claude/skills/taste-skill/`**: a generic frontend anti-slop/design-taste
  skill (page-kind/vibe/audience inference for landing pages, portfolios,
  redesigns). Not VaidTrack-specific instructions — apply it only when doing
  visual/design work, not as project architecture guidance.
- **`.cursor/mcp.json`**: configures a GitMCP docs server
  (`https://gitmcp.io/mnadwi3/kenyalandingpage`) for Cursor. Only relevant if
  working from Cursor with MCP docs lookup; does not affect runtime behavior.
- **`package.json` is `{}`**: there is no npm build pipeline defined in this
  repo despite minified assets (`main.min.js`, `styles.min.css`,
  `tailwind.min.css`) being present — treat those minified files as
  hand-shipped build output, not something `npm run build` regenerates here.

---

## 11. Known Documentation Gaps

`README.md` and `llms.txt` are **outdated** and should not be trusted over
this file or direct inspection. Confirmed stale points:
- Both claim JS is just `main.js`, `doctors.js`, `treatment-page.js`. In
  reality: `main.js` doesn't exist (it's `main.min.js`), and `nav.js`,
  `specialties.js`, `cms.js`, `treatments.js`, `analytics.js` are undocumented.
- Both claim treatment detail pages are static files under `treatments/*.html`.
  That directory does not exist; treatment pages are now served dynamically
  by `adminpanel` (`PublicTreatmentController`) with `data/treatments/treatments.json`
  as fallback data, per the `.htaccess` precedence in §5.
- Neither document mentions the admin panel's CMS scope (doctors, treatments,
  hospitals, specialties, testimonials, FAQs, settings — §4), its public
  controllers (§5), or the JSON API (§6) at all.
- Neither document mentions the three landing-page microsites (§7),
  `all-doctors.html`, `all-treatments.html`, `hospital.html`, or `hospitals.html`.
- (Resolved 2026-08-30, superseded 2026-09-01) `README.md`'s WhatsApp CTA
  number previously read `wa.me/918979983149`, out of sync with the number
  actually used across live pages. The number was then changed sitewide on
  2026-09-01 to `919871262293` (from the interim `919818377518`); README and
  llms.txt were updated to match.
- `adminpanel/README.md`'s quick-start references only migration
  `001_auth_schema.sql`; the repo actually has migrations through
  `013_treatments_price.sql`.
- Root `.gitignore` still references a `top-orthopedics/` directory that was
  removed from the repo (commit `9c3b137`, "Remove superseded top-orthopedics
  page, point landing pages home") — the entries are dead but harmless.

When a task depends on details these files got wrong, trust this file and/or
direct inspection of the current code, not `README.md`/`llms.txt`.

---

## 12. Workflow for Future Claude Sessions

1. Read this file (`CLAUDE.md`) first, before searching the repo.
2. Inspect only the files relevant to the requested task — do not rescan the
   entire repository "just in case" once this file has given you the map.
3. For non-trivial changes, state which files you intend to change and why
   before editing.
4. After editing, summarize exactly what changed (files touched, and the
   nature of the change) — don't just say "done."
5. If you discover this file is itself out of date (a new module, a moved
   file, a changed route), say so and propose the specific update rather than
   silently working around the discrepancy.
