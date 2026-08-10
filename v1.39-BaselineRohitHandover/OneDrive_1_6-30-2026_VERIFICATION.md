# OneDrive_1_6-30-2026 — Pull + Verification Report

**Pulled from:** `origin/main`  
**Local path:** `v1.39-BaselineRohitHandover/OneDrive_1_6-30-2026/`  
**Verified:** 2026-08-10

## Folder contents

| File | Size | Notes |
|---|---:|---|
| `VCF_KnowledgeBase_7.0.xlsx` | 79,845 | Valid VCF KB schema tabs |
| `VCF_KnowledgeBase_8.0.xlsx` | 79,845 | **Byte-identical duplicate of 7.0** |
| `NCP_AHV_KB_2026Q1.xlsx` … `Q9.xlsx` | 351,976 each | **All 9 files are byte-identical** |
| `VCF-AFA_CN_CanonicalModel_v0.1.xlsx` | 206,895 | CN schema workbook (draft seed) |

## KB compatibility with app (v1.40)

### VCF KBs
- Tabs present: `00_ReadMe`, `01_Metadata`, `02_FunctionalityMaster`, `03_FeatureEvidenceRegister`, `90_Lists`, `99_ChangeLog`, `KB Metrics`
- Filename pattern `VCF_KnowledgeBase_*.xlsx` → app classifies as **VCF**
- `02_FunctionalityMaster` ≈ **820** rows
- **Issue:** 7.0 and 8.0 are the same file content (same hash). Baseline selector may show two entries that are not truly different versions.

### NCP_AHV comparator KBs
- Tabs present (includes `04_SolutionComponents`, `05_ComponentMapping`)
- Filename does **not** start with `VCF_KnowledgeBase` → app classifies as **Comparator**
- `02_FunctionalityMaster` ≈ **136** rows
- **Issue:** Q1–Q9 are identical copies. Uploading all nine does not add new comparator versions—only duplicate workbooks.

### Minimum upload set that should unlock Initialization
1. CN JSON v0.3: `canonical-model/CN_v0.3_Canonical_Capability_Model.json`
2. One VCF KB: `VCF_KnowledgeBase_7.0.xlsx` (or 8.0 — same bytes)
3. One comparator: `NCP_AHV_KB_2026Q1.xlsx`

## Check: `VCF-AFA_CN_CanonicalModel_v0.1.xlsx`

### What it is
Governed **CN v0.1 draft schema workbook** (created 2026-06-23), not an app runtime AssessmentProfile and **not** the v1.40 CN JSON upload format.

### Sheets
- `00_Metadata`
- `01_Products` — **12 draft products seeded**
- `02_Features` — **0 rows**
- `03_Functionalities` — **0 rows**
- `04_Enums`
- `05_Quality_Checks` — Product count OK; Feature/Functionality counts = 0 → **Review**
- `06_Change_Log`
- `99_App_Load_View` — **0 rows**

### Product seed list (v0.1)
1. vCenter Server  
2. ESXi / vSphere Hypervisor  
3. vSAN  
4. NSX  
5. SDDC Manager  
6. Aria Operations  
7. Aria Operations for Logs  
8. Aria Automation  
9. HCX  
10. Tanzu / Kubernetes Services  
11. Identity, Access, and Policy Controls  
12. Data Protection and Recovery Integration  

### Compared with our CN v0.3 JSON
| Topic | CN v0.1 XLSX | CN v0.3 JSON (current app input) |
|---|---|---|
| Version | v0.1 | v0.3 |
| Format for v1.40 upload | **No** (xlsx) | **Yes** (json) |
| Products | 12 (different naming/taxonomy) | 12 (handover 12-area model) |
| Features | 0 | 84 |
| Functionalities | 0 | 252 |
| Status | Draft seed / schema | draft_candidate populated syllabus |

**Conclusion:** CN v0.1 is a useful **schema/governance ancestor**, but it is **not ready** as the live syllabus and **cannot** be uploaded into v1.40 Initialization as the CN file. Keep using `CN_v0.3_Canonical_Capability_Model.json` for app upload. Align/migrate v0.1 product taxonomy vs v0.3 12-area model in a later controlled CN revision if Keith wants one authority list.

## Recommended click/upload (after this pull)

1. Open `v1.39-BaselineRohitHandover/v1.39-BaselineRohitHandover/index.html`
2. **Assessment → New Assessment**
3. **Select CN File** → `canonical-model/CN_v0.3_Canonical_Capability_Model.json`
4. **Select Assessment Files** →  
   - `OneDrive_1_6-30-2026/VCF_KnowledgeBase_7.0.xlsx`  
   - `OneDrive_1_6-30-2026/NCP_AHV_KB_2026Q1.xlsx`  
   (optional: skip duplicate Q2–Q9 / duplicate VCF 8.0 unless you need them for UI testing)
5. When gate = **Ready** → **Next Step**
6. On KB/baseline step, select the VCF baseline shown for the loaded VCF KB

## Follow-ups
- Replace duplicate VCF 7/8 and NCP Q1–Q9 with true distinct version artifacts
- Add remaining Core comparator KBs (AzureLocal, OpenShiftVirtualization, OpenStackKVM, ProxmoxVE)
- Decide whether CN v0.3 product names should be remapped to CN v0.1 Product_IDs or vice versa under Keith governance
