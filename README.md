# VaidTrack.com - Cancer Medical Tourism Landing Page

Static marketing site for **[VaidTrack.com](https://www.vaidtrack.com)** - medical tourism facilitation for international patients seeking cancer care in India (second opinion, specialist matching, visa & travel coordination).

**Live site:** https://www.vaidtrack.com  
**Repo:** https://github.com/mnadwi3/kenyalandingpage

---

## Stack

| Layer | Choice |
|--------|--------|
| Markup | Static HTML (no build step) |
| Styles | Tailwind CDN + `assets/css/styles.css` + `assets/css/treatment-page.css` |
| Scripts | Vanilla JS - `assets/js/main.js`, `assets/js/doctors.js`, `assets/js/treatment-page.js` |
| Data | `data/doctors/doctors.json` (homepage + treatment doctor cards) |
| Hosting | Apache (`.htaccess`) and/or Netlify-style (`_redirects`) |
| Analytics | GTM `GTM-KZ86XPT5`, GA4 `G-5TBH8QQ2EQ` |
| Lead CTA | WhatsApp `wa.me/919871262293` + on-page enquiry forms |

---

## Project structure

```
├── index.html                 # Homepage
├── privacy-policy.html
├── disclaimer.html
├── assets/
│   ├── css/
│   │   ├── styles.css         # Home + shared styles
│   │   └── treatment-page.css # Treatment detail pages
│   └── js/
│       ├── main.js            # Home: slider, FAQ, forms, clean URLs, section order
│       ├── doctors.js         # Loads doctors.json and renders cards
│       └── treatment-page.js  # Treatment pages: sticky bar, FAQ, lead scroll
├── data/
│   └── doctors/
│       └── doctors.json       # Single source of truth for doctor profiles
├── images/
│   ├── doctors-images/        # Doctor portraits (slug.jpg)
│   ├── hero/                  # Hero slider slides
│   ├── hospital/              # Hospital / care photos
│   └── vaidtrack-wordmark.png # Brand logo (SEO / schema URL)
├── treatments/                # One HTML page per cancer type
├── _archive/                  # Unused brand sources and design files
├── .htaccess                  # Clean URLs + HTML extension redirects
├── _redirects                 # Same for Netlify-like hosts
├── llms.txt                   # Short AI/docs summary for GitMCP
└── .cursor/mcp.json           # Optional GitMCP docs server config
```

---

## Doctors data

Doctor cards on the homepage and treatment pages are generated from `data/doctors/doctors.json` via `assets/js/doctors.js`.

- Portrait files live in `images/doctors-images/` and match each doctor's `slug` (e.g. `dr-akshay-tiwari.jpg`).
- Images are lazy-loaded on the homepage.
- To add or edit a doctor, update `doctors.json` and place the matching image file — no HTML edits required.

---

## Homepage sections (`index.html`)

Order is enforced in `assets/js/main.js` (after `#why-india`):

1. **Hero** (`#hero`) - slider + appointment forms
2. **About** (`#about-us`)
3. **Why choose** (`#why-india`)
4. **Treatments** (`#treatment`) - `.tx-card` grid
5. **Doctors** (`#doctors`) - `.doc-card` grid from JSON
6. **Journey** (`#how-it-works`, also `#visa-travel`) - combined 6-step process + travel CTA
7. **Testimonials** (`#testimonials`) - video slots
8. **FAQ** (`#faq`)
9. **Contact** (`#contact`)
10. **Location** (`#location`) - partner hospital Delhi

Card styling notes:

- **Treatment cards** (`.tx-card`): white background, cyan border `#C5E0E8`
- **Doctor cards** (`.doc-card`): circular photo, specialty badge, dual CTAs

---

## Clean URLs

Avoid hash links for main sections. Prefer paths:

| Path | Scrolls to |
|------|------------|
| `/` | Home |
| `/treatment` | Treatments grid |
| `/doctors` | Oncologists |
| `/how-it-works` or `/visa-travel` | Combined journey section |
| `/testimonials` | Testimonials |
| `/about-us` | About |
| `/faq` | FAQ |
| `/contact` | Contact |
| `/book-appointment` | Mobile book form |
| `/treatments/breast-cancer` | Treatment detail (etc.) |
| `/privacy-policy`, `/disclaimer` | Legal pages |

Rewrites live in `.htaccess` and `_redirects`. Home uses `<base href="/">` so assets resolve under section paths. Client scroll/history is handled in `assets/js/main.js`.

**Google Ads final URL:** use `https://www.vaidtrack.com/` (not `index.html#top`).

---

## Treatment pages

Files under `treatments/*.html`, for example:

- breast-cancer, kidney-cancer, liver-cancer, cervical-cancer
- colorectal-cancer, bladder-cancer, blood-cancer, prostate-cancer
- lung-cancer, head-and-neck-cancer, brain-cancer

Each page: hero, lead form (`#lead`), care content, doctors (from JSON), FAQ, sticky WhatsApp / Send Reports bar (`treatment-page.js`).

---

## Brand tokens (site)

| Token | Value | Use |
|--------|--------|-----|
| Primary | `#0F4C81` | Buttons, links, accents |
| Primary dark | `#0B3A61` | Hover, secondary/headings |
| Success / WhatsApp | `#16A34A` | WhatsApp, success states |
| Soft bg | `#F8FAFC` | Section backgrounds |
| Border | `#E2E8F0` | Cards, inputs |
| Text | `#1E293B` / `#64748B` | Primary / secondary text |
| Font | Inter (Google Fonts) | UI |

---

## Local preview

Serve the folder root so clean paths and JSON fetch work:

```bash
npx --yes serve .
```

Bump cache query strings when shipping CSS/JS (e.g. `styles.css?v=...`, `main.js?v=...`).

---

## MCP / AI docs

Cursor MCP (GitMCP) for this repo:

```json
{
  "mcpServers": {
    "kenyalandingpage Docs": {
      "url": "https://gitmcp.io/mnadwi3/kenyalandingpage"
    }
  }
}
```

Server: https://gitmcp.io/mnadwi3/kenyalandingpage

Config may live in `.cursor/mcp.json` (project) and/or `~/.cursor/mcp.json` (global). Reload Cursor after changing MCP config.

---

## Placeholders / launch checklist

- [ ] Confirm doctor credentials in `data/doctors/doctors.json` before publishing
- [ ] Replace placeholder testimonials / confirm patient quotes before publishing attributed stories
- [ ] Confirm WhatsApp number and form endpoints
- [ ] Confirm partner hospital naming / legal wording in footer & disclaimer

---

## License / ownership

Private marketing site for VaidTrack.com. Hospital names on the site are informational unless a partnership is explicitly stated.
