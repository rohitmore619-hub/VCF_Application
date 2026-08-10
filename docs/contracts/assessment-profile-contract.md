# AssessmentProfile Contract

## Role

`AssessmentProfile` is a first-class application object for multi-session workshop continuity.

It is not an external spreadsheet workaround.

## Current sample

`reference/test-inputs/asdasd_VCF-AFA_AssessmentProfile_2026-07-01.json`

- `applicationVersion`: `v1.39`
- Includes profile, requirements, strategic considerations, weighting, resume metadata
- Analysis may be null until results are generated

## Target logical contract

```json
{
  "applicationVersion": "v1.39",
  "schemaVersion": "assessmentprofile-1.0",
  "assessmentStatus": "Incomplete|InProgress|Complete",
  "profile": {},
  "selectedVcf": {},
  "selectedComparators": [],
  "requirementCapture": {},
  "nonTechnicalStrategicConsiderations": [],
  "weights": {},
  "rulesetRef": {},
  "kbInputsRef": {},
  "canonicalModelRef": {},
  "analysis": {},
  "exports": {},
  "session": {}
}
```

## Required content areas

| Area | Must capture |
| --- | --- |
| Customer context | customer, consultants, participants, drivers, timeline, notes |
| VCF baseline | selected KB id, version, filename, detected platform/version |
| Comparators | included comparator KBs + evaluation basis metadata |
| Requirements | capability cascade, feature overrides, functionality overrides, effective ratings |
| Strategic / sovereignty / deployment | importance ratings and accepted deployment models |
| Weights | technical vs strategic and decision priorities |
| Ruleset reference | ruleset id/version used for scoring |
| KB/CN references | filenames, versions, hashes/timestamps where available |
| Status / session | current page/step, completed steps, last saved metadata |
| Results | feasibility outputs, watch areas, advisory notes when generated |

## Requirement cascade rule

1. Higher-level ratings cascade downward by default.
2. Lower-level overrides are allowed.
3. Feasibility engine uses effective ratings after cascade + override resolution.

Supported importance pattern (from CN enums):

- Required
- Important
- Nice-to-have
- Not Required
- Unknown

Normalize display variants such as `Nice To Have` → `Nice-to-have` during import validation.

## Compatibility rules

- Profile `applicationVersion` should be read and validated on resume.
- Reject/warn on incompatible schema or missing required sections.
- Resume must not silently drop comparator evaluation basis or KB identity.
- Active Data Mode resume must re-validate referenced KBs/CN/ruleset before trusting prior analysis.

## Observed cleanup needs

Current profiles contain duplicated fields across `profile`, `assessmentBasics`, and top-level keys. Future schema should define a single authoritative section per concern while allowing transitional read compatibility.
