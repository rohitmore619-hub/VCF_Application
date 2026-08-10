# Active Baseline Confirmation

## Verdict

The active implementation baseline is **VCF-AFA v1.39**.

Confirmed working source:

```text
assessment-app/v1.39/
  index.html
  README.md
  MANIFEST_v1.39.txt
  assets/T_systems_logo_rgb_p.png
```

Runtime markers in `index.html`:

- `APP_VERSION = 'v1.39'`
- Release date references: `2026-06-21`
- Packaging model: single-page HTML application with embedded CSS/JS

## Packaging method

Current operating package is a browser-openable HTML prototype:

1. Open `index.html`
2. Upload KB / assessment files through the UI
3. Save/export AssessmentProfile JSON from the app

There is no separate multi-module repository layout required to run v1.39.

The old nested handover folder and zip packages remain archived under:

- `v1.39-BaselineRohitHandover/` (as received)
- `packages/` (integrity copies)

Future development should treat `assessment-app/v1.39/` as the editable source of truth unless Keith instructs otherwise.

## What v1.39 already includes

From the accepted baseline and static inspection:

- Active Data Mode
- Demo Mode
- Executive Decision View
- Comparator feasibility visualization and selection behavior
- Comparator color synchronization
- VCF Baseline Version chip behavior
- Saved AssessmentProfile handling / Resume Assessment
- Breadcrumb navigation
- KB upload recognition and diagnostics
- Ingestion Regression Guard
- Technical Requirements Capture
- Strategic Considerations workflow
- Results and export behavior
- Executive-grade card styling across workflow screens
- Stable render approach without broad background self-healing timers or broad persistent MutationObserver patchers

## Stability note

`MutationObserver` strings still appear in comments/stubs documenting removal. Active production self-healing observers/timers are not the accepted pattern for new work.

## Baseline rule

- Do not build from older versions.
- Do not treat Demo Mode as the production data path.
- Increment version on each new app build/package.
