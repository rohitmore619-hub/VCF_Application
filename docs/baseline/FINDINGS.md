# Finding Summary — Repo Onboarding Pass

Date: 2026-08-10  
Baseline inspected: VCF-AFA v1.39  
Canonical model inspected: CN v0.3

## Confirmed

- Active app source is the v1.39 single-page HTML prototype.
- Working path established at `assessment-app/v1.39/`.
- CN v0.3 matches the 12 / 80 / 240 planning target and keeps integrations out of the top-level 12.
- Core comparator set and composite evaluation-period need are reflected in reference materials.
- AssessmentProfile JSON already exists as a first-class export/resume object in v1.39.

## Critical gaps to resolve before feature expansion

1. **CN ↔ KB ID mismatch** (`FT-/FN-` vs `F0001/FN000001`).
2. **CN not yet a required initialization artifact** in v1.39.
3. **Admin/config is placeholder**; scoring governance still mostly code-embedded.
4. **Discovery/promotion pages exist inside assessment app** and should stay thin while a separate seeding app is defined.
5. **Test KBs are not promotion-ready** (NCP drafts; metadata/filename inconsistencies; limited to NCP among Core comparators).
6. **CN App Load View / Feature_ID header defects** need cleanup before ingestion hardening.

## Delivered in this branch

- Organized active source and reference inputs
- Baseline confirmation docs
- Initialization, KB, AssessmentProfile, comparator-versioning, and discovery contracts
- CN validation notes
- Administration page model draft
- Immediate next-step backlog aligned to handover guardrails
