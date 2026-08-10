# Immediate Next Steps

Derived from the handover and confirmed against the v1.39 package contents.

## Do now

1. **Treat `assessment-app/v1.39` as the only implementation baseline.**
2. **Review app behavior in Active Data Mode and Demo Mode** using the organized source.
3. **Validate CN v0.3 as draft** — structure passes 12/80/240; ID alignment and App Load View fixes still required.
4. **Confirm initialization input set** — see `docs/contracts/initialization-input-set.md`.
5. **Adopt comparator versioning metadata model** — support product version and composite evaluation periods.
6. **Draft Administration/Configuration around an external ruleset artifact** — see `docs/models/admin-configuration-page-model.md`.
7. **Prioritize Core comparator evidence quality** before any Extended comparator work.
8. **Freeze Discovery ↔ Assessment data contract** before building discovery features into the assessment app.
9. **Strengthen validation** on KB metadata, ID alignment, promotion status, and AssessmentProfile resume compatibility.

## Do not do

- Restart architecture from older builds
- Expand comparator scope early
- Treat Demo Mode as production data
- Hide scoring logic permanently in code
- Force composite platforms into single version numbers
- Invent parity conclusions
- Overbuild discovery inside the assessment app
- Over-granularize CN beyond workshop usability
- Ship subtle UI tweaks as meaningful progress

## Highest-value sequence

1. Stabilize CN authority and ID mapping decision.
2. Define required init files and fail-closed validation.
3. Rebuild/harden Core comparator KBs against CN with real evidence and evaluation basis.
4. Expose rules/weights via Administration config artifact.
5. Keep discovery/seeding separate and contract-aligned.
