# LSC e-Detailing Prototype · Field Sales Rep on iPad

Interactive prototype of the Life Sciences Cloud (LSC) Intelligent Content / e-Detailing
future-state experience. Walks the seven process steps (Before/During/After Visit) across
each step's **native LSC surface** — Notifications panel, Account record, Intelligent
Content tab, Visit page, Field Email — with a region toggle that surfaces Common Core
versus NA / EMEA / APAC / LATAM deviations grounded in the user-story backlog.

---

## Quick Start (≈90 seconds)

You need **Node.js 18 or newer**. Check with `node --version`. If you don't have it,
install from [nodejs.org](https://nodejs.org) (LTS is fine).

From this folder, run:

```bash
npm install
npm run dev
```

Vite will print a local URL (typically `http://localhost:5173`). Open it in
**Chrome, Edge, or Safari** — the prototype is desktop-sized (~1280px+ recommended).

That's it. Hot reload is on; if you edit `src/EDetailingPrototype.jsx` the browser
refreshes automatically.

---

## What you should see

A dark studio backdrop with three columns:

- **Left rail** — the seven process steps grouped by Before/During/After Visit, each
  labeled with its native LSC surface
- **Center** — an iPad device frame containing the active step rendered in its actual
  LSC surface (Notifications panel, Account record, Visit page, etc.)
- **Right rail** — the Variation Inspector, showing the active region's user story and
  UI effect when an override is in play

Above the iPad: a **Region toggle** (Common Core · NA · EMEA · APAC · LATAM).
Below it: a step pager.

---

## Demo Script (recommended walkthrough)

A 5–7 minute walkthrough that hits the strongest moments:

### 1. Set the frame (30s)

Start in **Common Core**, **Step 2 — Pre-Call Planning**.

Talking points:
- "This is the Account record on iPad. The Recommended Presentation card you see is
  **OOTB** — driven by Provider Account Territory Information JSON, no code."
- "Next Best Action below it is also OOTB."
- Point at the surface ribbon: "Each step renders in its native LSC surface, not all
  bundled into Intelligent Content."

### 2. Walk Before → During → After in Common Core (2 min)

Click through Steps 1 → 7. For each, mention the surface label so stakeholders see
the LSC-feasibility framing:

- **Step 1 · Notifications panel** (bell icon dropdown, not the IC tab)
- **Step 2 · Account record** (Pre-Call tab)
- **Step 3 · Intelligent Content tab** (the only step that lives here)
- **Step 4 · Visit page · Content sidebar** (Presentation Forum)
- **Step 5 · Player feedback panel + Visit notes**
- **Step 6 · Visit record + Activity Timeline**
- **Step 7 · Field Email from HCP record**

### 3. Show two high-impact regional overrides (2 min)

Toggle to **APAC** and navigate to **Step 4**. The amber dot next to the step in the
left rail signals an override.

Talking points:
- Channel chips (WeChat / WhatsApp) appear on the slide canvas
- Slide rail shows locked navigation — only cover-page jumps allowed
- Read out the user story in the Variation Inspector

Toggle to **LATAM** and navigate to **Step 7**.

Talking points:
- Email body visibly splits into editable green zones (greeting/closing) and
  locked gray zones (core medical messaging)
- HCP fields are pre-populated
- This is **OOTB** — uses Field Email Fragments and locked template body

### 4. Show one custom-build call-out (1 min)

Toggle to **NA** and navigate to **Step 5**.

Talking points:
- Mic button is disabled with a "Blocked by NA market policy" message
- This is the largest custom build in the program — voice capture is not OOTB and
  needs LWC + speech-to-text + Custom Setting policy gates per state

### 5. Close (30s)

"Roughly two-thirds of the future-state is OOTB or admin-configurable. The custom
build is concentrated in four areas — voice capture, APAC navigation lock, EMEA
in-slide overlay, and the APAC asset builder — which is why we recommend a 3-wave
release sequence."

---

## Demoing remotely (Zoom, Teams, Meet)

1. Run `npm run dev`
2. Share the **browser tab**, not the whole screen — keeps system chrome out of the recording
3. In Chrome: **View → Always Show Toolbar** and zoom to **90%** so the iPad and rails
   all fit on a 1080p shared screen
4. Optional: use Loom or QuickTime to record the walkthrough as an asynchronous
   stakeholder share-out

If the iPad device frame feels too small on a projector, zoom Chrome to **125%** —
the layout stays clean.

---

## Sharing a built version with stakeholders

If you want to send a static link to someone (no installation on their end), build it:

```bash
npm run build
```

This produces a `dist/` folder. Three easy hosting options:

| Option | How | Best for |
|---|---|---|
| **Netlify Drop** | Drag the `dist/` folder onto [app.netlify.com/drop](https://app.netlify.com/drop) | One-click public URL |
| **Vercel** | `npx vercel --prod` from the project root | If you already have a Vercel account |
| **Local file** | `npm run preview` then share over Tailscale / VPN | Internal-only |

Share the resulting URL. Recipients need only a modern browser.

---

## Project structure

```
edetailing-demo/
├── index.html                       Vite entry HTML
├── package.json                     Dependencies + scripts
├── vite.config.js                   Vite config (host: true, port: 5173)
├── src/
│   ├── main.jsx                     React mount point
│   └── EDetailingPrototype.jsx      The full prototype (~1200 lines)
└── README.md                        This file
```

The prototype is a single self-contained React component with no external state, no
network calls, and no backend. All data is in-memory: regions, steps, variations, and
mock visit content. Edit `src/EDetailingPrototype.jsx` to change copy or regional rules
— the structures are clearly labeled at the top of the file (`REGIONS`, `STEPS`,
`VARIATIONS`).

---

## Troubleshooting

**`npm install` fails with a Node version error**
You're on Node ≤ 16. Install Node 18+ from [nodejs.org](https://nodejs.org) and retry.

**Port 5173 is in use**
Vite will auto-fall-back to 5174, 5175, etc. — check the terminal output for the
actual URL it picked. Or stop the other Vite process.

**Layout looks cramped or wraps oddly**
The prototype is laid out for ~1280px+ viewports. Maximize the browser window or zoom
out (Ctrl/Cmd + −) until the three columns sit side-by-side.

**Region toggle does nothing visible**
That step has no override for that region — the right-rail Variation Inspector will say
"Matches Common Core." Look for amber dots in the left rail to find steps that *do*
have overrides for the active region.

**Lucide icon errors**
You may see `Cannot find module 'lucide-react/icons/...'` on very old Node versions.
Confirm Node 18+ and run `rm -rf node_modules package-lock.json && npm install`.

---

## What this prototype is NOT

- Not a connected Salesforce app — no API calls, no auth, no persistence
- Not pixel-perfect production UI — it's grounded in SLDS tokens but is a directional
  prototype meant to support stakeholder reactions, not be deployed
- Not a substitute for the feasibility report — read
  `LSC_Intelligent_Content_Feasibility_Report.docx` (separate deliverable) for the
  OOTB / Configurable / Custom classification per capability

---

Built for stakeholder demo. Stories sourced from *Common Core Log – Intelligent Content*.
UI grounded in iPad LSC for Customer Engagement (SLDS).
