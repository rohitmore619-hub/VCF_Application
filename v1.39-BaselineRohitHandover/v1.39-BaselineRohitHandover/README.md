# VCF-AFA App Prototype v1.40

v1.40 builds on the accepted v1.39 baseline and adds Canonical Model (CN v0.3) upload + validation on Assessment Initialization.

## v1.40 Changes

- New Assessment Initialization requires CN Excel workbook (`.xlsx`) **and** assessment KB `.xlsx` files.
- Resume Assessment Initialization requires AssessmentProfile JSON, CN Excel workbook, and assessment KB files.
- CN Excel validation supports CN v0.3 sheets (`Products` / `Features` / `Functionalities`) and detects CN v0.1 schema tabs.
- Populated Features/Functionalities are required (schema-only CN v0.1 seed with 0 rows fails with a clear message).
- Valid CN is stored in `state.canonicalModel` and summarized on the AssessmentProfile (`cnVersion`, counts, file name).
- Version references updated to v1.40 / 2026-08-10.

## CN gate prerequisite

Structural CN v0.3 gate marked **Pass** in:

- `../CN_v0.3_Review_Signoff.md`
- `../CN_v0.3_Validation_and_Init_Contract.md`

Sample CN file:

- `../canonical-model/CN_v0.3_Canonical_Capability_Model.xlsx`

## Preserved from v1.39

- Active Data Mode / Demo Mode Executive Decision View behavior
- Comparator color sync, VCF Baseline chip, results/exports
- Resume Assessment, breadcrumbs, KB diagnostics / Ingestion Regression Guard
- No broad background `setInterval` / persistent `MutationObserver` self-healers

## Not yet in v1.40

- Scoring engine still largely FeatureID-based (migration to `functionalityId` is next after CN is routinely loaded)
- Core comparator evidence matrix fill
- Administration / Configuration page for editable rules/weights
