# Comparator Versioning Model

## Principle

Not every comparator is a single product version.

Some platforms are compositions of multiple products with independent release cadences. Forcing a single version number creates false precision.

## Supported versioning modes

### A. Single-product version basis

Use when the comparator is meaningfully represented by one release train.

Example:

```json
{
  "platformKey": "ProxmoxVE",
  "versioningMode": "single_product",
  "productVersion": "9.2",
  "evaluationBasisLabel": "Proxmox VE 9.2",
  "evaluationDate": "2026-05-21"
}
```

### B. Composite evaluation-period basis

Use when the comparator is an assembled solution baseline.

Example:

```json
{
  "platformKey": "OpenStackKVM",
  "versioningMode": "composite_period",
  "evaluationPeriod": "2026Q2",
  "evaluationBasisLabel": "OpenStackKVM Composite / Q2-2026",
  "evaluationDate": "2026-06-30",
  "components": [
    {"componentKey": "Nova", "componentVersion": "32.2.0"},
    {"componentKey": "Cinder", "componentVersion": "27.0.0"},
    {"componentKey": "Neutron", "componentVersion": "27.0.2"}
  ]
}
```

## Required metadata fields

| Field | Required | Description |
| --- | --- | --- |
| platformKey | Yes | Stable platform id from Core/Extended set |
| versioningMode | Yes | `single_product` \| `composite_period` |
| evaluationBasisLabel | Yes | Human-facing label in UI/export |
| productVersion | If single_product | Primary product version |
| evaluationPeriod | If composite_period | Period key such as `2026Q2` |
| evaluationDate | Recommended | Point-in-time freeze date |
| components[] | If composite_period | Component inventory with versions |
| evidenceFreezeNotes | Recommended | What was included/excluded |

## UI / export implications

- Do not display only a bare version field for composite comparators.
- Prefer “Evaluation Basis” chip/label language.
- AssessmentProfile and exports must persist evaluation basis, not just filename.
- Feasibility comparisons must identify whether baselines are version-locked or period-compiled.

## Core comparator guidance (from decomposure reference)

| Platform | Likely mode | Why |
| --- | --- | --- |
| VCF | single_product | Versioned VCF release train |
| NCP_AHV | composite_period | AHV/AOS/Prism/NCM/Flow composition |
| AzureLocal | composite_period / release-train hybrid | HCI stack + OS/build train |
| OpenShiftVirtualization | composite_period | OCP + Virt + CNI/storage dependencies |
| OpenStackKVM | composite_period | Multi-service OpenStack release |
| ProxmoxVE | single_product leaning composite notes | Primary VE version with ZFS/Ceph options |

## Ruthless rule

Do not expand to Extended comparators until Core comparator evidence and evaluation-basis metadata are stable.
