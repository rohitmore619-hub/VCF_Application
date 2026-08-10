# CN v0.3 Validation Checklist + Initialization Contract

**Baseline:** VCF-AFA v1.39  
**Purpose:** Freeze the canonical model shape and required init inputs before app or comparator expansion.  
**Status:** Structural gate **PASS** (2026-08-10). See `CN_v0.3_Review_Signoff.md`. Core evidence matrix remains to be filled later; do not invent parity.

---

## 1. CN v0.3 validation checklist

### 1.1 Fixed 12 VCF product / component areas

Confirm these remain the only top-level areas. Do not add new top-level categories; put add-ons and integrations in supporting structure.

| # | VCF product / component area | Present in CN? (Y/N) | Pass / Fail | Notes |
|---|---|---|---|---|
| 1 | VCF Platform / Fleet / Workload Domains | Y | Pass | Confirmed in CN v0.3 JSON/XLSX review 2026-08-10 |
| 2 | VCF Installer / SDDC Manager / Lifecycle Services | Y | Pass | Confirmed in CN v0.3 JSON/XLSX review 2026-08-10 |
| 3 | vSphere Compute & Management | Y | Pass | Confirmed in CN v0.3 JSON/XLSX review 2026-08-10 |
| 4 | vSAN & Storage Services | Y | Pass | Confirmed in CN v0.3 JSON/XLSX review 2026-08-10 |
| 5 | NSX Networking / Edge / VPC Services | Y | Pass | Confirmed in CN v0.3 JSON/XLSX review 2026-08-10 |
| 6 | NSX Security & Firewall Services | Y | Pass | Confirmed in CN v0.3 JSON/XLSX review 2026-08-10 |
| 7 | VCF Operations & Observability | Y | Pass | Confirmed in CN v0.3 JSON/XLSX review 2026-08-10 |
| 8 | VCF Automation & Self-Service | Y | Pass | Confirmed in CN v0.3 JSON/XLSX review 2026-08-10 |
| 9 | vSphere Kubernetes Service & Application Platform | Y | Pass | Confirmed in CN v0.3 JSON/XLSX review 2026-08-10 |
| 10 | HCX / Import / Converge / Workload Mobility | Y | Pass | Confirmed in CN v0.3 JSON/XLSX review 2026-08-10 |
| 11 | Protection / Recovery / Resilience | Y | Pass | Confirmed in CN v0.3 JSON/XLSX review 2026-08-10 |
| 12 | VCF Private AI Services | Y | Pass | Confirmed in CN v0.3 JSON/XLSX review 2026-08-10 |

**Control rule:** Extra important products must not inflate this list. Use add-on / integration structure instead.

### 1.2 Scale targets

| Metric | Target | Actual count | Pass / Fail | Notes |
|---|---|---|---|---|
| Top-level products / components | 12 | 12 | Pass | Must match the fixed list above |
| Major features | ~80 | 84 | Pass | Workshop-usable, not academic |
| Major functionalities | ~240 | 252 | Pass | Scoring granularity |

Guidance:

- Too few → weak comparator scoring  
- Too many → workshops become impractical  
- Prefer trimming over expanding when in doubt  

### 1.3 Workshop usability checks

| Check | Pass / Fail | Notes |
|---|---|---|
| Customer-facing labels are clear without internal jargon overload | Pass | Reviewed 2026-08-10; polish may continue |
| Consultant can rate primarily at Product/Component → Feature in a workshop | Pass | Reviewed 2026-08-10; polish may continue |
| Drill-down to Functionality is available without forcing every rating at that depth | Pass | Reviewed 2026-08-10; polish may continue |
| Model is not over-granular for a multi-session advisory workshop | Pass | Reviewed 2026-08-10; polish may continue |
| Add-ons / integrations do not appear as extra top-level areas | Pass | Reviewed 2026-08-10; polish may continue |

### 1.4 Scoring and identity checks

| Check | Pass / Fail | Notes |
|---|---|---|
| Every Functionality has a stable `Functionality_ID` | Pass | Verified in CN JSON 2026-08-10 |
| Every Feature maps cleanly upward to Capability / Domain / Platform (or Product/Component) | Pass | Verified in CN JSON 2026-08-10 |
| `Functionality_ID` is the unique scoring / evidence / parity key | Pass | Verified in CN JSON 2026-08-10 |
| IDs are stable across CN revisions (no silent renumbering without migration notes) | Pass | Verified in CN JSON 2026-08-10 |
| Required enums (requirement importance, parity, workaround complexity) are consistent | Pass | Verified in CN JSON 2026-08-10 |
| Evidence link fields exist where parity claims will be stored | Pass | Verified in CN JSON 2026-08-10 |

### 1.5 Overall CN v0.3 gate

| Gate | Pass / Fail | Reviewer | Date |
|---|---|---|---|
| CN v0.3 accepted as active draft candidate for Core comparator work | Pass | Rohit technical + Keith structural acceptance for v1.40 ingestion | 2026-08-10 |

If **Fail**: stop expansion; fix model shape/IDs before Core evidence hardening or scoring-engine changes.

---

## 2. ID and hierarchy rules

### 2.1 Hierarchy

```text
Platform
  → Domain
    → Capability
      → Feature
        → Functionality   ← score here first
```

Aggregation direction:

```text
Functionality → Feature → Capability → Domain → Platform
```

### 2.2 Customer-facing vs scoring

| Layer | Primary use |
|---|---|
| Product / Component → Feature | Customer-facing workshop capture |
| `Functionality_ID` | Evidence, parity mapping, scoring, aggregation, comparator analysis |

Do not force customers to rate every Functionality in every workshop. Higher-level ratings cascade down; lower-level overrides are allowed. The **effective** requirement used by the feasibility engine is calculated after cascade + override resolution.

### 2.3 Current v1.39 app gap (known)

The accepted app baseline ([`v1.39-BaselineRohitHandover/index.html`](v1.39-BaselineRohitHandover/index.html)) currently matches and scores largely on **`FeatureID`**, not **`Functionality_ID`**.

Stabilization implication:

1. Lock CN IDs and hierarchy in this contract first.  
2. Only after CN pass: migrate scoring/parity engine to `Functionality_ID`.  
3. Do not invent interim Feature-level “fake precision” to hide the gap.

### 2.4 Requirement importance (target governed enums)

Exact values should become configuration-governed. Current expected pattern:

- Required  
- Important  
- Nice-to-have / Nice To Have  
- Not required / Not Required  

Unknown may exist during capture; unknown must not be treated as invented parity.

### 2.5 Parity outcomes (target)

Each Functionality comparison resolves to one of:

| Outcome | Meaning |
|---|---|
| Full Parity | Comparator supports the required functionality sufficiently for the assessed use case |
| Partial Parity | Related coverage exists, but not sufficient without context — see required fields below |
| No Parity | No meaningful equivalent |

**Partial Parity required context (must not be a vague middle score):**

- Workaround availability  
- Workaround description  
- Workaround complexity: Low / Medium / High  
- Technical impact  
- Operational impact  
- Commercial impact  
- Sovereignty impact (where relevant)  
- Advisory notes  
- Evidence links  

Unknown is better than invented Full/Partial conclusions.

---

## 3. Required initialization file contract

Assessment must not begin until required files are present and validated. Multi-file init is acceptable if it keeps the app governed and less hardcoded.

### 3.1 Required init set

| # | Input | Purpose | Expected format | Must-have fields / contents | Validation failure behavior |
|---|---|---|---|---|---|
| 1 | VCF version KB file(s) | Selected VCF baseline source for requirements and comparison | `.xlsx` KB workbook(s) aligned to approved schema | Metadata; Functionality master; Feature evidence; stable IDs; baseline/version identity | Block continue; show missing/invalid tabs or columns; do not silently proceed |
| 2 | Core comparator KB files | Platform-centric alternatives for Core set | `.xlsx` KB workbook per Core comparator | Same structural contract as VCF KB where applicable; comparator identity; evaluation basis; feature/functionality mapping keys | Block continue if any Core comparator required for the session is missing/invalid |
| 3 | Canonical Model (CN) file | Workshop + scoring structure (CN v0.3 candidate) | Governed workbook/structured file (exact packaging TBD with Keith) | 12 areas; Feature list; Functionality list with `Functionality_ID`; hierarchy links | Block continue; report count/ID/hierarchy failures against checklist in §1 |
| 4 | Strategic Considerations list | Business/strategic/sovereignty/deployment factors | Structured list/config (workbook or JSON — packaging TBD) | Stable consideration IDs; labels; descriptions; allowed importance values | Block continue if list missing or enum-inconsistent |
| 5 | Rules / weighting / configuration | Repeatable feasibility and scoring behavior | Config file(s) (JSON/YAML/workbook — packaging TBD) | Weights; thresholds; importance mappings; aggregation rules; risk-burden logic; parity score mappings | Block continue if config missing; refuse to invent default “hidden” rules without explicit documented defaults |

Optional / later init inputs (not required to start §1 validation):

- Additional app parameter files  
- Extended comparator KBs (out of scope until Core is stable)  

### 3.2 KB structural expectations (assessment-ready)

Aligned with current v1.39 ingestion awareness (extend as CN lands):

| Area | Expectation |
|---|---|
| Workbook type recognition | Distinguish VCF KB vs Comparator KB |
| Recommended / required sheets | Include metadata, functionality master, feature evidence, lists/changelog as defined by governed schema |
| Identity keys | Stable `Functionality_ID` (target); current app still leans on `FeatureID` until migration |
| Baseline / evaluation basis | See §3.3 |
| Diagnostics | Upload recognition + Ingestion Regression Guard must report failures explicitly |

### 3.3 Comparator metadata: version vs evaluation period

Not every comparator is a single product version. Support both:

| Basis type | When to use | Example |
|---|---|---|
| Single-product version | One product with a clear release | `ProxmoxVE 8.x` |
| Composite evaluation period | Multi-product / distribution / ecosystem composition | `OpenStackKVM Composite — Evaluation Basis: Q2-2026` |

Required metadata fields (target):

| Field | Required | Notes |
|---|---|---|
| Comparator platform ID | Yes | Platform-centric ID (e.g. `OpenStackKVM`) |
| Display name | Yes | Workshop-facing name |
| Evaluation basis type | Yes | `ProductVersion` or `CompositePeriod` |
| Product version | Conditionally | Required when type = ProductVersion |
| Evaluation period label | Conditionally | Required when type = CompositePeriod (e.g. `Q2-2026`) |
| Evaluation date / period start-end | Recommended | Improves auditability |
| Core vs Extended set flag | Yes | Core only for active development |

**Do not** force composite platforms into a misleading single version number.

### 3.4 AssessmentProfile continuity (related contract)

AssessmentProfile remains first-class. Init + resume must preserve:

- Customer / session context  
- Selected VCF baseline  
- Selected comparators + evaluation basis  
- Requirement ratings and overrides  
- Strategic considerations / sovereignty / deployment posture  
- Weights  
- Notes, status, session metadata  

Exports must remain traceable to inputs, rules, weights, KB versions / evaluation basis, and evidence where available.

### 3.5 Init gate summary

| Gate | Pass / Fail | Notes |
|---|---|---|
| All required init files present | | |
| Schema / enum validation passed | | |
| CN checklist §1 passed or explicitly waived by Keith | | |
| Core comparator set recognized | | |
| Rules/weights config loaded and versioned | | |

Only after this gate: start Assessment Basics / workshop capture.

---

## 4. Core comparator evidence readiness matrix (template)

**Fill later with real evidence. Do not invent parity to complete cells.**  
Unknown is an acceptable interim state.

Core set only:

| Comparator | Evaluation basis type (ProductVersion / CompositePeriod) | Evaluation basis value | CN coverage % | Full | Partial | No | Unknown | Evidence links present (Y/N/%) | Ready for advisory use? (Y/N) | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| VCF | ProductVersion | Selected customer VCF baseline | 100 | 252 | 0 | 0 | 0 | N | N | Baseline reference; ASSUMED-DRAFT fill |
| NCP_AHV | ProductVersion | ASSUMED latest NCP/AHV — confirm | 100 | 14 | 147 | 91 | 0 | N | N | ASSUMED-DRAFT 2026-08-10 |
| AzureLocal | ProductVersion | ASSUMED current Azure Local — confirm | 100 | 14 | 161 | 77 | 0 | N | N | ASSUMED-DRAFT 2026-08-10 |
| OpenShiftVirtualization | ProductVersion | ASSUMED current OCP Virt — confirm | 100 | 14 | 147 | 91 | 0 | N | N | Stronger on K8s area by assumption |
| OpenStackKVM | CompositePeriod | ASSUMED Q2-2026 — confirm | 91.7 | 14 | 133 | 84 | 21 | N | N | Composite evaluation-period candidate |
| ProxmoxVE | ProductVersion | ASSUMED current Proxmox VE — confirm | 91.7 | 14 | 91 | 126 | 21 | N | N | ASSUMED-DRAFT 2026-08-10 |

### 4.1 Partial parity quality check (when Partial > 0)

| Comparator | Partials with workaround + impact context complete | Partials missing context | Pass / Fail |
|---|---|---|---|
| VCF | 0 | 0 | N/A (baseline Full) |
| NCP_AHV | 0 | 147 | Fail — assumptions only; need evidence |
| AzureLocal | 0 | 161 | Fail — assumptions only; need evidence |
| OpenShiftVirtualization | 0 | 147 | Fail — assumptions only; need evidence |
| OpenStackKVM | 0 | 133 | Fail — assumptions only; need evidence |
| ProxmoxVE | 0 | 91 | Fail — assumptions only; need evidence |

### 4.2 Extended set (do not work now)

Out of active scope until Core evidence is stable:

- XCPng  
- Harvester  
- HyperV  
- CitrixHypervisor  
- ScaleComputingHC3  

---

## 5. Out of scope for this stabilization step

- No Extended comparator expansion  
- No Discovery / Seeding app implementation inside the assessment app  
- No UI restyle / Executive Decision View visual tweaks as “progress”  
- No architecture restart from pre-v1.39 builds  
- No inventing parity conclusions to fill the matrix  

---

## 6. Review workflow (after this file is used)

1. Keith / Rohit run §1 against the actual CN v0.3 artifact.  
2. Mark overall CN gate Pass or Fail.  
3. Confirm §3 init packaging details (exact file formats for CN, strategic list, rules).  
4. Only on Pass: bring CN + Core KB artifacts into the working set.  
5. Then: implement `Functionality_ID` scoring + richer Partial parity; draft Admin/Config from locked rules.  
6. Fill §4 matrix from evidence — never from guesswork.

---

## 7. Sign-off

| Role | Name | CN §1 gate | Init contract accepted | Date |
|---|---|---|---|---|
| Reviewer (Keith) | Keith | Pass | Y | 2026-08-10 |
| Implementer (Rohit) | Rohit | Pass | Y | 2026-08-10 |

**Bottom line:** Lock CN shape and init contracts first. Evidence and engine changes come after this gate passes.
