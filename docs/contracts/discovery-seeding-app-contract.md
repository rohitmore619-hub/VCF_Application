# Discovery / Seeding App ↔ Assessment App Contract

## Separation rule

| App | Owns | Does not own |
| --- | --- | --- |
| Assessment app | Workshop capture, scoring, executive output using approved inputs | Automated discovery, evidence harvesting, seed generation |
| Discovery / Seeding app | Version discovery, draft KB generation, human review packaging, promotion formatting | Live customer assessment decisions |

Combining both weakens validation and defensibility.

## Discovery / Seeding outputs

Must emit files in the exact structures required by assessment ingestion:

1. Draft or promoted VCF KBs
2. Draft or promoted comparator KBs
3. Optional CN update proposals (not silent overwrite)
4. Validation reports
5. Promotion checklist / review package

## Promotion states

| State | Selectable in Active Data Mode | Meaning |
| --- | --- | --- |
| Draft | No | Generated/harvested, needs review |
| In Review | No | Human review underway |
| Approved / Active | Yes | Assessment-ready |
| Deprecated | No | Retained for history only |

## Required handoff package contents

For each candidate KB:

- workbook conforming to KB ingestion contract
- metadata completeness report
- schema validation report
- CN ID alignment report
- evidence link validation report
- component/evaluation-basis validation for composite comparators
- reviewer sign-off fields
- promotion target filename

## Assessment app import expectations

Assessment app should:

- accept only approved/active artifacts in Active Data Mode
- allow draft inspection only in clearly separated admin/validation views
- refuse to mix incompatible Canonical Model versions silently
- record KB/CN/ruleset identities into AssessmentProfile and exports

## Boundary for existing v1.39 admin pages

Current placeholders:

- Start New Version Discovery
- Promote Knowledge Base

These may remain as navigation stubs or thin launch points, but implementation of discovery/seeding logic should not grow inside the assessment scoring runtime.

## First contract milestone

Define and freeze:

1. KB workbook schemas
2. evaluation-basis metadata
3. CN ID authority
4. promotion status fields
5. validation report format

Then build Discovery / Seeding against that freeze.
