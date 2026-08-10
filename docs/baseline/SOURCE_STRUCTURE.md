# Source Structure

## Active structure

```text
assessment-app/
  v1.39/                         # ONLY active app baseline
    index.html                   # full assessment application
    README.md
    MANIFEST_v1.39.txt
    assets/

docs/
  handover/                      # Keith handover materials
  baseline/                      # source/baseline confirmation
  contracts/                     # input/output data contracts
  models/                        # CN validation + admin model drafts
  backlog/                       # prioritized next steps

reference/
  canonical-model/               # CN v0.3 draft
  comparator-decomposure/        # composite comparator notes
  test-inputs/                   # sample VCF/comparator KBs + AssessmentProfile

packages/
  v1.39-BaselineRohitHandover.zip
  ForRohit.zip
  01.TestFiles.zip
```

## Important principle

Folder layout is secondary.

What matters for future work:

- clear data contracts
- validated ingestion
- promotion-ready KBs
- repeatable scoring/config inputs
- AssessmentProfile continuity across workshop sessions

## Current app logical layers in v1.39

Observed in the app navigation model:

1. Welcome / initialization
2. Assessment basics / profile
3. KB load / validate
4. Strategic / non-technical considerations
5. Technical requirements capture
6. Weighting
7. Review
8. Results / Executive Decision View
9. Administration placeholders:
   - Load / Validate Active KBs
   - Start New Version Discovery
   - Promote Knowledge Base
   - Tool Configuration

Per handover direction, version discovery and seeded KB generation should move to a separate Discovery / Seeding application. The assessment app should consume approved inputs only.
