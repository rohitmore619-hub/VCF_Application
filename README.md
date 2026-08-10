# VCF-AFA

Governed advisory application for assessing VMware Cloud Foundation environments against alternative infrastructure platforms.

## Accepted baseline

**VCF-AFA v1.39 is the only active implementation baseline.**

| Item | Location |
| --- | --- |
| Active app source | [`assessment-app/v1.39/`](assessment-app/v1.39/) |
| App entrypoint | [`assessment-app/v1.39/index.html`](assessment-app/v1.39/index.html) |
| Canonical model draft | [`reference/canonical-model/VCF-AFA_CN_CanonicalModel_v0.3.xlsx`](reference/canonical-model/VCF-AFA_CN_CanonicalModel_v0.3.xlsx) |
| Comparator decomposure notes | [`reference/comparator-decomposure/ComparatorDecomposure.xlsx`](reference/comparator-decomposure/ComparatorDecomposure.xlsx) |
| Sample/test inputs | [`reference/test-inputs/`](reference/test-inputs/) |
| Handover summary | [`docs/handover/`](docs/handover/) |
| Data contracts | [`docs/contracts/`](docs/contracts/) |
| Original handover packages | [`packages/`](packages/) |

Do not restart from older builds. Do not revive earlier experimental UI/rendering approaches.

## What this project is

- Customer workshop capture
- VCF baseline vs comparator feasibility assessment
- Evidence-backed parity analysis
- Executive shortlisting / decision support

## What this project is not

- Lifecycle management
- Migration automation
- Generic product comparison marketing
- A combined research + discovery + assessment monolith

## Core comparator set (active)

- VCF
- NCP_AHV
- AzureLocal
- OpenShiftVirtualization
- OpenStackKVM
- ProxmoxVE

Extended comparators exist for later expansion only.

## Immediate working direction

1. Stabilize model and data contracts.
2. Validate CN v0.3.
3. Define initialization input set.
4. Harden Core comparator evidence KBs.
5. Keep discovery/seeding outside the assessment app.

See [`docs/backlog/immediate-next-steps.md`](docs/backlog/immediate-next-steps.md).

## Run the app

Open `assessment-app/v1.39/index.html` in a browser.

Notes:

- Active Data Mode is the production path.
- Demo Mode is permanent for demos/UX validation and must not override Active Data Mode.
- Current prototype may require network access for SheetJS unless a local copy is packaged later.
