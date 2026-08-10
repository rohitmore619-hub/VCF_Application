# Initialization Input Set

## Goal

Make assessment initialization explicit, complete, and validated before workshop capture begins.

## Current v1.39 behavior

Today the app:

- accepts one or more `.xlsx` uploads
- classifies `VCF_KnowledgeBase*.xlsx` as VCF KBs
- treats other workbooks as Comparator KBs
- warns when recommended tabs are missing
- does **not** yet require Canonical Model / strategic list / ruleset files as hard prerequisites

This is acceptable as a prototype path, but it is not the governed target state.

## Target required initialization set

| Input | Purpose | Required | Notes |
| --- | --- | --- | --- |
| Canonical Model (`CN`) | Workshop hierarchy + scoring keys | Yes | Active draft: CN v0.3 |
| VCF KB set | Selected VCF baseline evidence/functions | Yes | One selectable baseline version minimum |
| Core comparator KB set | Comparator evidence/functions | Yes | Core set only for active work |
| Strategic Considerations list | Non-technical/sovereignty/deployment criteria | Yes | May be workbook or governed JSON |
| Rules / weighting / thresholds config | Repeatable feasibility engine settings | Yes | Eventually Administration page source |
| Optional AssessmentProfile | Resume multi-session workshop | Optional | JSON import |

## Suggested filename contracts

```text
VCF-AFA_CN_CanonicalModel_vX.Y.xlsx
VCF_KnowledgeBase_<version>.xlsx
<PlatformKey>_KnowledgeBase_<evaluationBasis>.xlsx
VCF-AFA_StrategicConsiderations_vX.Y.xlsx
VCF-AFA_Ruleset_vX.Y.json
*_VCF-AFA_AssessmentProfile_YYYY-MM-DD.json
```

Examples:

- `VCF_KnowledgeBase_9.1.xlsx`
- `NCP_AHV_KnowledgeBase_2026Q2.xlsx`
- `OpenStackKVM_KnowledgeBase_2026Q2.xlsx`

## Pre-assessment validation gate

Assessment start should be blocked until all checks pass:

1. Canonical Model present, schema/version compatible, QC pass.
2. At least one selectable/approved VCF KB present.
3. At least one approved Core comparator KB present for each selected comparator.
4. Strategic considerations list present and enum-compatible.
5. Ruleset present with required weights/thresholds/parity impact policy.
6. No critical ingestion errors from Ingestion Regression Guard.
7. ID systems align across CN ↔ VCF KB ↔ Comparator KBs.

## Current test-input gaps

From `reference/test-inputs/`:

- VCF files present: `VCF_KnowledgeBase_7.0.xlsx`, `VCF_KnowledgeBase_8.0.xlsx`
- Comparator files present: repeated `NCP_AHV_KB_2026Q1` … `Q9` drafts
- Missing from test pack: CN file, Strategic Considerations file, Ruleset file, other Core comparator KBs
- Naming drift: NCP files use `NCP_AHV_KB_…` while metadata/workbook names expect `NCP_AHV_KnowledgeBase_…`
- Metadata drift: `VCF_KnowledgeBase_8.0.xlsx` metadata reports WorkbookName/VCFVersion for 9.0

These must be cleaned before relying on test packs for governed validation.
