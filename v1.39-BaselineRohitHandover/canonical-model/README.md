# Canonical Model CN v0.3 (draft candidate)

## What this is

Governed **Canonical Capability Model** for VCF-AFA stabilization.

| File | Purpose |
|---|---|
| [`CN_v0.3_Canonical_Capability_Model.xlsx`](CN_v0.3_Canonical_Capability_Model.xlsx) | Full CN structure: 12 products, features, functionalities, enums, ID rules, init alignment |
| [`CN_v0.3_Canonical_Capability_Model.xlsx`](CN_v0.3_Canonical_Capability_Model.xlsx) | Excel review workbook for comparison (Products, Features, Functionalities, FunctionalityIndex + empty Core parity columns) |
| [`CN_v0.3_Functionality_Index.json`](CN_v0.3_Functionality_Index.json) | Flat index of every `functionalityId` for review and future ingestion mapping |
| [`CN_v0.3_Functionality_Index.xlsx`](CN_v0.3_Functionality_Index.xlsx) | Excel conversion of the flat functionality index (same rows as the JSON) |
| [`../CN_v0.3_Validation_and_Init_Contract.md`](../CN_v0.3_Validation_and_Init_Contract.md) | Pass/Fail validation checklist + init contract |

### Excel sheets

- `Metadata` — version, counts, scoring key, upload status  
- `Products` — 12 areas with Pass/Fail note columns  
- `Features` — feature inventory  
- `Functionalities` — main comparison sheet (`functionalityId` + blank Core comparator parity columns)  
- `FunctionalityIndex` — flat index from `CN_v0.3_Functionality_Index.json` (product → feature → functionality IDs/names)  
- `Enums`, `PartialParityFields`, `InitAndCoreSet`, `IdRules` — governance helpers  

Fill comparator parity cells only from evidence. Leave blank/Unknown rather than guessing. JSON remains the structured source for future app ingestion.

**Current exception (stabilization unblock):** Core parity columns were filled on 2026-08-10 with **ASSUMED-DRAFT** heuristics (see `Assumptions` sheet). Replace before advisory use.

**Scale in this draft:** 12 products / 84 features / 252 functionalities (target ~12 / ~80 / ~240).

## Important truths

1. **Customer does not create or fill this file.** Architects / internal SMEs own it.
2. **v1.39 does not upload CN yet.** Initialization today accepts KB `.xlsx` files only. CN ingestion is future work on the Initialization page.
3. **This file alone does not change app scoring.** Stabilization requires: validate CN → implement upload/validation → score by `functionalityId`.
4. **No comparator parity is claimed here.** Do not invent Full/Partial/No from this syllabus. Unknown is better than false precision.

## How to use now

1. Review structure against the validation checklist.
2. Keith/Rohit mark Pass/Fail on the 12 areas, counts, IDs, workshop usability.
3. Trim, rename, or extend functionalities only with architect approval; keep IDs stable.
4. After Pass: use as the governed input contract for Core evidence mapping and future app ingestion.

## Intended future upload point

**New Assessment — Initialization** and **Resume Assessment — Initialization** (available in v1.40), together with:

- VCF KB file(s)
- Core comparator KB files
- Strategic Considerations list
- Rules / weighting / configuration

## Scoring key

- Customer-facing workshop depth: Product/Component → Feature  
- Engine scoring key: **`functionalityId`**  
- Aggregate upward: Functionality → Feature → Capability → Domain → Platform  

## Status

`draft_candidate` — requires sign-off before advisory production use.


## Draft Core parity fill (2026-08-10)

The Excel `Functionalities` sheet and `CoreEvidenceMatrix` sheet now include **ASSUMED-DRAFT** Core comparator parity values to unblock stabilization dry-runs.

- See sheet `Assumptions` for heuristic rules
- See `CN_v0.3_Core_Parity_Assumptions.json` for machine-readable counts
- **Not ready for customer advisory conclusions** until evidence links replace assumptions
- Prefer keeping Unknown over fake certainty when re-reviewing
