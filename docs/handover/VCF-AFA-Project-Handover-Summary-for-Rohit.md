# VCF-AFA Project Handover Summary for Rohit

Source: handover package from Keith. This markdown is the working copy of the accepted direction. The original PDF is retained beside this file.

## 1. Purpose

Give Rohit the clean current-state view of VCF-AFA.

Avoid obsolete implementation history, failed design experiments, and older architecture assumptions.

Accepted implementation baseline: **VCF-AFA v1.39**.

Future development starts from v1.39 unless Keith explicitly instructs otherwise.

## 2. Project objective

VCF-AFA is an advisory application for assessing VMware Cloud Foundation environments against alternative infrastructure platform options.

It supports customer advisory workshops by helping consultants:

- Capture business, strategic, sovereignty, and technical requirements
- Compare a selected VCF baseline against comparator platforms
- Evaluate functional parity at granular level
- Identify full/partial/no parity, workarounds, risks, and impacts
- Generate executive feasibility and shortlisting outputs
- Support repeatable, evidence-backed advisory conclusions

It is not a lifecycle manager, migration automation product, generic comparison tool, or vendor marketing asset.

## 3. Current accepted baseline

v1.39 is the only active implementation baseline and includes:

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
- Stronger executive-grade card styling
- Stable rendering without broad background self-healing timers or broad persistent observer patchers

Baseline rule: do not restart from older builds or reintroduce earlier experimental architectures.

## 4. Repository / source status

Do not assume prior repository folder models are still active.

Confirmed in this repo:

- Active editable source: `assessment-app/v1.39/`
- Contracts and validation notes: `docs/`
- Reference inputs: `reference/`

Principle: future inputs, KBs, schemas, config files, and exports must have clear data contracts that are easy to validate, ingest, and promote.

## 5. Core architecture direction

### Assessment application

Focused on workshop capture, baseline/comparator selection, requirement/strategic capture, feasibility scoring, executive output, export, and repeatable evaluation.

Not the upstream research engine for discovering new product versions.

### Knowledge base inputs

Assessment app ingests approved KB and configuration files. Multi-file initialization is acceptable if it keeps the app governed and less hardcoded.

### Separate Discovery / Seeding application

Discovery of new VCF/comparator versions, seeded KB generation, human review, and promotion formatting belong in a separate app.

## 6. Comparator strategy

Platform-centric, not vendor-centric.

### Core set

VCF, NCP_AHV, AzureLocal, OpenShiftVirtualization, OpenStackKVM, ProxmoxVE

### Extended set (later only)

XCPng, Harvester, HyperV, CitrixHypervisor, ScaleComputingHC3

Do not expand active comparator scope until Core evidence is stable.

## 7. Comparator versioning principle

Support both:

- single-product version basis
- composite evaluation-date / evaluation-period basis

Example: `OpenStackKVM Composite / Evaluation Basis: Q2-2026`

## 8. Canonical model concept

Active draft candidate: **CN v0.3**

Planning target confirmed in draft workbook: 12 products, 80 features, 240 functionalities.

Customer-facing: Product/Component → Feature  
Scoring key: Functionality_ID

Keep add-ons in supporting registry. Do not inflate the top-level 12.

## 9. Assessment hierarchy

Platform → Domain → Capability → Feature → Functionality

Score at Functionality first, aggregate upward.

## 10. Parity model

Full Parity / Partial Parity / No Parity

Partial parity must include workaround and impact context. Partial parity without impact context hides risk.

## 11–13. Requirements, AssessmentProfile, Administration

- Requirements capture at capability/feature/functionality with cascade + overrides
- AssessmentProfile is first-class (save/export/import/resume)
- Administration/Configuration page must expose rules, weights, thresholds, and scoring logic for repeatability

## 14–16. Current functionality, UX, rendering

Preserve v1.39 workflow and executive-grade visual language.

Prefer explicit render hooks and controlled events. No broad persistent MutationObserver patchers or recurring production self-healing loops.

## 17. Sovereignty and deployment

Capture and interpret data placement, routing, admin/security/config/keystore/IAM/workload/operational control across Far Edge, Near Edge, Central Compute, on-prem, and self-managed private cloud contexts.

## 18–22. Forward backlog and guardrails

Priority is stabilize model and data contracts, not expand UI or comparator count.

Strongest next move:

1. Validate canonical model
2. Define initialization input set
3. Harden evidence-backed Core comparator KBs
