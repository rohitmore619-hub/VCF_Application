# CN v0.3 Validation Notes

## Status

`VCF-AFA_CN_CanonicalModel_v0.3.xlsx` is the **active draft candidate**, not final.

Metadata:

- Model_ID: `VCF-AFA-CN`
- Model_Version: `v0.3`
- Schema_Version: `1.1`
- Status: `Draft`
- Scoring key: `Functionality_ID`
- Customer-facing view: Product/Component → Feature

## Scale check against planning target

| Target | Planned | Actual in CN v0.3 | QC |
| --- | --- | --- | --- |
| Products / components | 12 | 12 | Pass |
| Features | 80 | 80 | Pass |
| Functionalities | 240 | 240 | Pass |

Average features/product ≈ 6.67  
Average functionalities/feature = 3

Internal QC sheet (`05_Quality_Checks`) reports Pass for counts, uniqueness, and orphan-ID checks.

## Top-level products (confirmed)

1. PC-PLATFORM — VCF Platform, Fleet & Workload Domains  
2. PC-LIFECYCLE — VCF Installer, SDDC Manager & Lifecycle Services  
3. PC-VSPHERE — vSphere Compute & Management  
4. PC-VSAN — vSAN & Storage Services  
5. PC-NSX-NET — NSX Networking, Edge & VPC Services  
6. PC-NSX-SEC — NSX Security & Firewall Services  
7. PC-OPS — VCF Operations & Observability  
8. PC-AUTOMATION — VCF Automation & Self-Service  
9. PC-VKS — vSphere Kubernetes Service & Application Platform  
10. PC-MOBILITY — HCX, Import, Converge & Workload Mobility  
11. PC-RESILIENCE — Protection, Recovery & Resilience  
12. PC-PRIVATEAI — VCF Private AI Services  

Add-ons/integrations are correctly separated into `01b_Integrations_AddOns` (26 rows). Do not inflate the top-level 12.

## Enum alignment with handover intent

CN enums already define:

- Requirement_Rating: Required / Important / Nice-to-have / Not Required / Unknown
- Parity: Full / Partial / No / Unknown
- Workaround_Complexity: None / Low / Medium / High / Not Applicable
- Impact_Level: None / Low / Medium / High

This matches the intended parity and requirement model.

## Validation findings / blockers

### 1. ID system mismatch with current KBs (critical)

| Artifact | Feature ID style | Functionality ID style |
| --- | --- | --- |
| CN v0.3 | `FT-PLATFORM-01` | `FN-PLATFORM-01-01` |
| Current VCF/NCP test KBs | `F0001` | `FN000001` / `NCPAHV-FN000001` |

Current AssessmentProfile sample requirements also key on `F0xxx` feature-style IDs from the older KB model.

**Implication:** CN v0.3 cannot be dropped into the current app/KB pipeline without an explicit ID mapping or KB rebuild against CN IDs.

### 2. App does not yet ingest CN as a required init artifact

v1.39 initialization notice states the app currently detects VCF/comparator KBs from uploaded workbooks and that additional artifact validation will follow Canonical Capability Model ingestion work.

### 3. `99_App_Load_View` formula breakage

Joined display fields currently resolve to `#NAME?` for product/feature names and some sort orders when opened with data-only evaluation. Fix before treating App Load View as assessment-ready.

### 4. `02_Features` header defect

First column contains Feature IDs but the header cell is blank (` `) instead of `Feature_ID`. Parsers should tolerate this temporarily; the workbook should be corrected.

### 5. Content maturity

Many functionality descriptions are still seeded template text (“Major functionality for …”). Good structural scaffold; needs advisory-language hardening before workshop defense.

## Validation recommendation

Keep CN v0.3 as the controlled draft model.

Before expansion work:

1. Decide whether future KBs adopt CN ID scheme (`FT-…` / `FN-…`) as authoritative.
2. Define mapping from legacy `F0001` / `FN000001` if transitional compatibility is required.
3. Fix App Load View and Feature_ID header.
4. Validate workshop usability of the 12/80 customer-facing surface with one real assessment dry-run.
5. Only then rebuild Core comparator evidence against CN Functionality_IDs.
