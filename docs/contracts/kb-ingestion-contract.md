# KB Ingestion Contract

## Purpose

Define the assessment-app contract for approved knowledge-base workbooks.

The assessment app consumes approved KBs. It does not discover or invent them.

## Workbook classification

| File pattern | Type |
| --- | --- |
| `VCF_KnowledgeBase_*.xlsx` | VCF |
| `<PlatformKey>_KnowledgeBase_<evaluationBasis>.xlsx` | Comparator |

v1.39 currently uses a simple filename rule (`VCF_KnowledgeBase*` => VCF, else Comparator). Future ingestion should also validate metadata fields (`KnowledgeBaseType`, `PlatformKey`) and fail closed on mismatch.

## Recommended / required tabs

Observed by current parser and existing workbooks:

### Shared / VCF-oriented

- `01_Metadata`
- `02_FunctionalityMaster` (requires FeatureID linkage)
- `03_FeatureEvidenceRegister`

### Comparator extensions

- `04_SolutionComponents`
- `05_ComponentMapping`

### Supporting

- `00_ReadMe`
- `90_Lists`
- `99_ChangeLog`
- `KB Metrics`

v1.39 currently warns on missing recommended tabs rather than hard-failing all of them. Target state: hard-fail on missing required tabs for promotion-ready KBs.

## Metadata contract (minimum)

### VCF KB

| Field | Required | Example |
| --- | --- | --- |
| WorkbookName | Yes | `VCF_KnowledgeBase_9.1.xlsx` |
| KnowledgeBaseType | Yes | `Active VCF Knowledge Base` |
| VCFVersion | Yes | `9.1` |
| KBStatus | Yes | `Active` |
| ApprovalStatus | Yes | `Approved` |
| Selectable | Yes | `Yes` |
| CanonicalModelVersion | Yes | `v0.3` |
| SchemaModel | Yes | governed schema id/version |

### Comparator KB

| Field | Required | Example |
| --- | --- | --- |
| PlatformKey | Yes | `NCP_AHV` |
| PlatformName | Yes | `Nutanix Cloud Platform / AHV` |
| ComparatorType | Yes | `Core Comparator` |
| VersioningMode | Yes | `single_product` or `composite_period` |
| ProductVersion | Conditional | used when single-product |
| EvaluationPeriod | Conditional | e.g. `2026Q2` |
| EvaluationBasisLabel | Yes | display label for UI chip/export |
| ComparatorBaseline | Yes | machine baseline key |
| KBStatus | Yes | `Active` only when selectable |
| Selectable | Yes | `Yes` only when approved |
| PromotionReady | Yes | `Yes` for assessment use |
| CanonicalModelVersion | Yes | must match loaded CN |
| SourceVCFBaseline | Recommended | VCF KB used as mapping baseline |

## Functionality contract

Scoring unit is Functionality.

Each functionality row must provide:

- stable Functionality ID aligned to CN
- Feature ID aligned to CN
- display name + vendor-native description
- lifecycle/review status
- evaluation basis / version applicability
- for comparators: primary/supporting components when composite

## Evidence contract

Evidence is feature-level and inherited by functionality through Feature ID.

Minimum evidence fields:

- FeatureID
- EvidenceURL
- EvidenceSource
- EvidenceVersion / date
- EvidenceStatus (`Approved` for active assessments)
- Notes

Unknown is better than fabricated parity. Draft evidence must not be selectable in Active Data Mode.

## Parity payload expectations

Where comparator functionality is assessed for parity, partial parity must carry:

- workaround availability
- workaround description
- workaround complexity
- technical / operational / commercial / sovereignty impact
- advisory notes
- evidence links

Parity without impact context is not assessment-ready.

## Current gaps in handover test KBs

- NCP KBs are Draft / not promotion-ready / Selectable=No
- Component versions pending vendor portal validation
- Exact evaluated releases not locked
- ID scheme not aligned to CN v0.3
- Repeated Q1–Q9 copies appear to be packaging/test duplicates, not distinct evidence baselines
