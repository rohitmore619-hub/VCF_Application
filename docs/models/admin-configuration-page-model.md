# Administration / Configuration Page Model

## Business requirement

Given the same inputs, KBs, rules, and weights, the app must produce the same result every time.

If rules remain hidden only in code, the tool is hard to audit, govern, and defend.

## Current state in v1.39

Administration placeholders already exist:

- Load / Validate Active KBs
- Start New Version Discovery
- Promote Knowledge Base
- Tool Configuration

`Tool Configuration` is currently browser-local placeholder content. Scoring/weight logic is still largely embedded in application code and assessment profile fields.

## Target Administration page

Expose governed configuration without turning the assessment app into a research engine.

### Sections

1. **Ruleset identity**
   - Ruleset ID / version
   - Effective date
   - Approval status
   - Change log reference

2. **Requirement importance mappings**
   - Enum values and cascade behavior
   - Default criticality handling

3. **Parity and risk burden policy**
   - Full / Partial / No / Unknown handling
   - Required partial-parity impact fields
   - Risk burden calculation inputs

4. **Feasibility thresholds**
   - Score bands for shortlisting language
   - Blocker rules for Required + No Parity
   - Watch-area trigger thresholds

5. **Aggregation rules**
   - Functionality → Feature → Capability/Domain → Platform rollups
   - Weighting of missing/unknown evidence

6. **Technical vs strategic weighting**
   - Defaults and allowed ranges
   - Decision priority dimensions

7. **Comparator assumptions**
   - Core set enablement
   - Evaluation-basis interpretation
   - Composite vs single-product display rules

8. **Sovereignty / deployment interpretation**
   - Which sovereignty controls affect feasibility
   - Deployment model assumptions

9. **Export governance**
   - Mandatory context fields in reports
   - Evidence citation requirements

## Suggested config artifact

`VCF-AFA_Ruleset_vX.Y.json` loaded at initialization and referenced by AssessmentProfile.

Minimum shape:

```json
{
  "rulesetId": "VCF-AFA-RULESET",
  "rulesetVersion": "0.1",
  "status": "Draft",
  "requirementRatings": ["Required", "Important", "Nice-to-have", "Not Required", "Unknown"],
  "parityValues": ["Full Parity", "Partial Parity", "No Parity", "Unknown"],
  "partialParityRequiredFields": [
    "workaroundAvailability",
    "workaroundDescription",
    "workaroundComplexity",
    "technicalImpact",
    "operationalImpact",
    "commercialImpact",
    "sovereigntyImpact",
    "advisoryNotes",
    "evidenceLinks"
  ],
  "weights": {
    "technicalDefault": 60,
    "strategicDefault": 40
  },
  "aggregation": {
    "scoreAt": "Functionality",
    "rollUpOrder": ["Feature", "Capability", "Domain", "Platform"]
  },
  "thresholds": {},
  "riskBurden": {},
  "comparatorAssumptions": {
    "activeSet": ["VCF", "NCP_AHV", "AzureLocal", "OpenShiftVirtualization", "OpenStackKVM", "ProxmoxVE"]
  }
}
```

## UX direction

- Executive-grade, calm, clearly contained
- Show the values that change outcomes
- Prefer explicit save/import/export of rulesets over hidden code constants
- Read-only mode for consultants during live workshops if needed; edit mode for governed admins

## Out of scope for this page

- Automated vendor research
- Seed generation
- Unreviewed KB promotion

Those belong to the separate Discovery / Seeding app and promotion workflow.
