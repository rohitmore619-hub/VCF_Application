# VCF-AFA App Prototype v1.39

**This is the accepted active implementation baseline.**

Repo working path: `assessment-app/v1.39/`

Open `index.html` in a browser to run the prototype.

## v1.39 Changes

- Removed finite background `setInterval` self-healing loops that could cause unsolicited screen jumps.
- Removed broad persistent `MutationObserver` self-healing patchers for Executive Decision View mounting, comparator color synchronization, VCF Baseline chip placement, and completion-message scrubbing.
- Replaced periodic/background patching with explicit render, navigation, selection, upload, click, and change hooks.
- Scoped KB diagnostics and Ingestion Regression Guard refresh behavior to initialization/upload contexts and manual refresh controls.
- Coalesced Active Data Mode Executive Decision View rendering into a single scheduled render per data/selection event instead of multiple delayed renders.
- Added Executive Decision View render-signature guarding to avoid full `innerHTML` re-renders when the selected comparator and data have not changed.
- Preserved right-side Executive Insight Modules scroll position and page scroll position across Executive Decision View renders.
- Updated current version references to v1.39.

## Preserved Behavior

- v1.36 accepted workflow and Executive Decision View behavior.
- Demo Mode and Active Data Mode Executive Decision View functionality.
- Comparator color synchronization.
- VCF Baseline chip behavior.
- Results and exports.
- Resume Assessment.
- Breadcrumbs.
- Saved AssessmentProfile status handling.
- Upload recognition.
- KB diagnostics and Ingestion Regression Guard, now without background polling.
- VCF Technical Requirements behavior.
- Repository packaging behavior.

## Related repo docs

- Baseline confirmation: `../../docs/baseline/ACTIVE_BASELINE.md`
- Contracts: `../../docs/contracts/`
- CN validation: `../../docs/models/cn-v0.3-validation.md`
- Next steps: `../../docs/backlog/immediate-next-steps.md`

## Validation Summary

- Inline JavaScript syntax check passed in original handover package.
- Static checks confirmed no active `setInterval`, `new MutationObserver`, or `observer.observe` calls remain as production self-healing behavior.
- App runtime version references are v1.39 / 2026-06-21.
- ZIP integrity copies retained under `../../packages/`.

## Concept note

Applies the accepted Executive Decision View card styling language across preceding workflow screens. Built from accepted v1.37 baseline; v1.38 failed concept was not used as source.
