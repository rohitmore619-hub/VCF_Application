#!/usr/bin/env node
/**
 * Build CN v0.3–aligned NCP_AHV comparator KB + paired VCF KB.
 * Encodes ASSUMED-DRAFT parity for today's FeatureID scoring engine:
 *   Full  -> exact CN featureId
 *   Partial -> NCP-P-{featureId} with same FeatureName (near-match)
 *   No    -> omit from NCP master
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const MODEL_DIR = join(ROOT, 'v1.39-BaselineRohitHandover/canonical-model');
const ONEDRIVE = join(ROOT, 'v1.39-BaselineRohitHandover/OneDrive_1_6-30-2026');
const OUT_DIR = join(ROOT, 'v1.39-BaselineRohitHandover/kbs');

const CN_PATH = join(MODEL_DIR, 'CN_v0.3_Canonical_Capability_Model.json');
const INDEX_PATH = join(MODEL_DIR, 'CN_v0.3_Functionality_Index.json');
const ASSUMP_PATH = join(MODEL_DIR, 'CN_v0.3_Core_Parity_Assumptions.json');
const OLD_NCP = join(ONEDRIVE, 'NCP_AHV_KB_2026Q1.xlsx');

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
}

function cleanKeys(row) {
  const out = {};
  for (const [k, v] of Object.entries(row || {})) {
    if (String(k).startsWith('__')) continue;
    out[k] = v == null ? '' : v;
  }
  return out;
}

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokenSet(s) {
  return new Set(norm(s).split(' ').filter((t) => t.length > 2));
}

function jaccard(a, b) {
  const A = tokenSet(a);
  const B = tokenSet(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / (A.size + B.size - inter);
}

function bestOldMatch(name, oldRows) {
  let best = null;
  let bestScore = 0;
  for (const row of oldRows) {
    const score = Math.max(
      jaccard(name, row.FunctionalityName),
      jaccard(name, row.FeatureName || ''),
    );
    if (score > bestScore) {
      bestScore = score;
      best = row;
    }
  }
  return bestScore >= 0.35 ? { row: best, score: bestScore } : null;
}

function sheetPairs(pairs) {
  return XLSX.utils.json_to_sheet(pairs.map(([Field, Value]) => ({ Field, Value })));
}

function append(wb, name, sheet) {
  XLSX.utils.book_append_sheet(wb, sheet, name);
}

function ncpParityForProduct(assumptions, productId) {
  const arr = assumptions.profileByProduct?.[productId];
  // Core comparators excluding VCF: NCP_AHV is index 0
  return (arr && arr[0]) || 'Unknown';
}

function buildWorkbooks(cn, index, assumptions, oldNcpWb) {
  const oldFuncs = (XLSX.utils.sheet_to_json(oldNcpWb.Sheets['02_FunctionalityMaster'], {
    defval: '',
  }) || []).map(cleanKeys);
  const oldEvidence = (XLSX.utils.sheet_to_json(oldNcpWb.Sheets['03_FeatureEvidenceRegister'], {
    defval: '',
  }) || []).map(cleanKeys);

  const oldByFeatureName = new Map();
  for (const r of oldEvidence) {
    if (r.FeatureName) oldByFeatureName.set(norm(r.FeatureName), r);
  }

  const vcfFuncRows = [];
  const vcfEvidenceRows = [];
  const ncpFuncRows = [];
  const ncpEvidenceRows = [];
  const crosswalkFeatures = [];
  const crosswalkFuncs = [];

  const featureSeenVcf = new Set();
  const featureSeenNcp = new Set();

  for (const p of cn.products || []) {
    const parity = ncpParityForProduct(assumptions, p.productId);
    for (const f of p.features || []) {
      const featureId = f.featureId;
      const featureName = f.name;
      const domainId = p.domainId || f.domainId;
      const capabilityId = p.capabilityId || f.capabilityId;

      // VCF: always include all CN features/functionalities
      if (!featureSeenVcf.has(featureId)) {
        featureSeenVcf.add(featureId);
        vcfEvidenceRows.push({
          FeatureID: featureId,
          FeatureName: featureName,
          CapabilityID: capabilityId,
          DomainID: domainId,
          EvidenceURL: '',
          EvidenceSource: 'CN v0.3 syllabus',
          EvidenceVersion: 'v0.3',
          EvidenceDate: '2026-08-31',
          EvidenceStatus: 'Baseline',
          EvidenceNotes: 'Paired CN-aligned VCF KB generated from locked CN v0.3.',
        });
      }

      for (const g of f.functionalities || []) {
        vcfFuncRows.push({
          FunctionalityID: g.functionalityId,
          ComparatorFunctionalityID: g.functionalityId,
          FunctionalityName: g.name,
          Description: g.description || `${g.name} under ${featureName}`,
          FeatureID: featureId,
          FeatureName: featureName,
          DomainName: p.domainName,
          CapabilityName: p.capabilityName,
          LifecycleStatus: 'Active',
          ReviewStatus: 'Draft',
          EvaluatedVersion: 'CN v0.3 aligned',
          PrimaryComponent: p.name,
          PrimaryComponentVersion: 'CN-v0.3',
          SupportingComponents: '',
          SolutionBaseline: 'VCF_CN_v0.3',
          ComponentVersionValidationStatus: 'CN Generated',
          ComponentMappingNotes: `productId=${p.productId}; functionalityId=${g.functionalityId}`,
        });
      }

      // NCP encoding by ASSUMED-DRAFT product parity
      let ncpFeatureId = null;
      let includeNcp = false;
      if (parity === 'Full Parity') {
        ncpFeatureId = featureId;
        includeNcp = true;
      } else if (parity === 'Partial Parity') {
        ncpFeatureId = `NCP-P-${featureId}`;
        includeNcp = true;
      } else {
        // No Parity / Unknown — omit from NCP master
        includeNcp = false;
      }

      const nameMatch = bestOldMatch(featureName, oldFuncs);
      const oldEv = oldByFeatureName.get(norm(featureName)) || null;

      crosswalkFeatures.push({
        productId: p.productId,
        featureId,
        featureName,
        assumedParity: parity,
        ncpFeatureId: ncpFeatureId || null,
        includedInNcpKb: includeNcp,
        oldFeatureId: nameMatch?.row?.FeatureID || oldEv?.FeatureID || null,
        oldMatchScore: nameMatch ? Number(nameMatch.score.toFixed(3)) : null,
      });

      if (!includeNcp) {
        for (const g of f.functionalities || []) {
          crosswalkFuncs.push({
            functionalityId: g.functionalityId,
            functionalityName: g.name,
            featureId,
            assumedParity: parity,
            includedInNcpKb: false,
            oldComparatorFunctionalityID: null,
          });
        }
        continue;
      }

      if (!featureSeenNcp.has(ncpFeatureId)) {
        featureSeenNcp.add(ncpFeatureId);
        ncpEvidenceRows.push({
          FeatureID: ncpFeatureId,
          FeatureName: featureName,
          CapabilityID: capabilityId,
          DomainID: domainId,
          EvidenceURL: oldEv?.EvidenceURL || '',
          EvidenceSource: oldEv?.EvidenceSource || 'ASSUMED-DRAFT CN alignment',
          EvidenceVersion: oldEv?.EvidenceVersion || 'ASSUMED-DRAFT',
          EvidenceDate: oldEv?.EvidenceDate || '2026-08-31',
          EvidenceStatus: 'ASSUMED-DRAFT',
          EvidenceNotes:
            oldEv?.EvidenceNotes ||
            `ASSUMED-DRAFT parity=${parity}; CN featureId=${featureId}; not advisory-ready.`,
        });
      }

      for (const g of f.functionalities || []) {
        const fnMatch = bestOldMatch(g.name, oldFuncs);
        const old = fnMatch?.row;
        ncpFuncRows.push({
          ComparatorFunctionalityID: `NCP-${g.functionalityId}`,
          FunctionalityName: g.name,
          Description:
            old?.Description ||
            `ASSUMED-DRAFT NCP_AHV coverage for ${g.name} (${parity}).`,
          FeatureID: ncpFeatureId,
          FeatureName: featureName,
          DomainName: p.domainName,
          CapabilityName: p.capabilityName,
          LifecycleStatus: 'Active',
          ReviewStatus: 'Draft',
          EvaluatedVersion: 'ASSUMED-DRAFT CN v0.3 alignment',
          PrimaryComponent: old?.PrimaryComponent || 'Nutanix AHV / Prism',
          PrimaryComponentVersion:
            old?.PrimaryComponentVersion || 'Requires Vendor Portal Validation',
          SupportingComponents: old?.SupportingComponents || 'AOS; Prism Central',
          SolutionBaseline: 'NCP_AHV_CN_v0.3',
          ComponentVersionValidationStatus: 'ASSUMED-DRAFT',
          ComponentMappingNotes: `assumedParity=${parity}; cnFeatureId=${featureId}; cnFunctionalityId=${g.functionalityId}`,
        });
        crosswalkFuncs.push({
          functionalityId: g.functionalityId,
          functionalityName: g.name,
          featureId,
          assumedParity: parity,
          includedInNcpKb: true,
          ncpFeatureId,
          oldComparatorFunctionalityID: old?.ComparatorFunctionalityID || null,
          oldFeatureId: old?.FeatureID || null,
          oldMatchScore: fnMatch ? Number(fnMatch.score.toFixed(3)) : null,
        });
      }
    }
  }

  // Flat index also drives counts
  const indexByFeature = new Map();
  for (const row of index) {
    if (!indexByFeature.has(row.featureId)) indexByFeature.set(row.featureId, []);
    indexByFeature.get(row.featureId).push(row);
  }

  const vcfWb = XLSX.utils.book_new();
  append(
    vcfWb,
    '00_ReadMe',
    sheetPairs([
      ['Purpose', 'CN v0.3–aligned VCF KB paired with NCP_AHV_KB_CN_v0.3.xlsx'],
      ['ScoringKey', 'functionalityId (app v1.41)'],
      ['Source', 'CN_v0.3_Canonical_Capability_Model.json'],
      ['Note', 'Generated for structural testing; not a production VCF evidence pack.'],
    ]),
  );
  append(
    vcfWb,
    '01_Metadata',
    sheetPairs([
      ['PlatformKey', 'VCF'],
      ['PlatformName', 'VMware Cloud Foundation (CN v0.3 aligned)'],
      ['KBStatus', 'Draft'],
      ['Selectable', 'Yes'],
      ['Approved', 'No'],
      ['CNVersion', 'v0.3'],
      ['FeatureCount', String(featureSeenVcf.size)],
      ['FunctionalityCount', String(vcfFuncRows.length)],
      ['GeneratedOn', '2026-08-31'],
    ]),
  );
  append(vcfWb, '02_FunctionalityMaster', XLSX.utils.json_to_sheet(vcfFuncRows));
  append(vcfWb, '03_FeatureEvidenceRegister', XLSX.utils.json_to_sheet(vcfEvidenceRows));
  append(vcfWb, '04_SolutionComponents', XLSX.utils.json_to_sheet([{ Component: 'VCF Platform', Role: 'Baseline' }]));
  append(vcfWb, '05_ComponentMapping', XLSX.utils.json_to_sheet([{ FeatureID: 'VCF-03-F01', PrimaryComponent: 'vSphere' }]));
  append(
    vcfWb,
    '90_Lists',
    sheetPairs([
      ['EvidenceStatus', 'Baseline'],
      ['ReviewStatus', 'Draft'],
      ['LifecycleStatus', 'Active'],
    ]),
  );
  append(
    vcfWb,
    '99_ChangeLog',
    XLSX.utils.json_to_sheet([
      {
        Date: '2026-08-31',
        Change: 'Generated CN v0.3–aligned VCF KB for NCP_AHV pilot pairing',
        Author: 'automation',
      },
    ]),
  );
  append(
    vcfWb,
    'KB Metrics',
    sheetPairs([
      ['features', String(featureSeenVcf.size)],
      ['functionalities', String(vcfFuncRows.length)],
    ]),
  );

  const ncpWb = XLSX.utils.book_new();
  append(
    ncpWb,
    '00_ReadMe',
    sheetPairs([
      ['Purpose', 'CN v0.3–aligned NCP_AHV Core comparator KB (ASSUMED-DRAFT)'],
      ['Encoding', 'Full=exact FeatureID; Partial=NCP-P-{FeatureID}+same name; No=omitted'],
      ['Warning', 'ASSUMED-DRAFT — not evidence-backed; not advisory-ready'],
      ['PairedVcfKb', 'VCF_KnowledgeBase_CN_v0.3.xlsx'],
      ['SourceAssumptions', 'CN_v0.3_Core_Parity_Assumptions.json (NCP index 0)'],
    ]),
  );
  append(
    ncpWb,
    '01_Metadata',
    sheetPairs([
      ['PlatformKey', 'NCP_AHV'],
      ['PlatformName', 'Nutanix Cloud Platform / AHV'],
      ['ComparatorType', 'Core Comparator'],
      ['KBStatus', 'ASSUMED-DRAFT'],
      ['Selectable', 'Yes'],
      ['Approved', 'No'],
      ['CNVersion', 'v0.3'],
      ['EvidenceStatus', 'ASSUMED-DRAFT'],
      ['EvaluatedVersion', 'ASSUMED-DRAFT CN v0.3 alignment; replace with portal-validated evidence'],
      ['EvaluatedVersionStatus', 'Requires Vendor Portal Validation'],
      ['FeatureCount', String(featureSeenNcp.size)],
      ['FunctionalityCount', String(ncpFuncRows.length)],
      ['GeneratedOn', '2026-08-31'],
    ]),
  );
  append(ncpWb, '02_FunctionalityMaster', XLSX.utils.json_to_sheet(ncpFuncRows));
  append(ncpWb, '03_FeatureEvidenceRegister', XLSX.utils.json_to_sheet(ncpEvidenceRows));
  append(
    ncpWb,
    '04_SolutionComponents',
    XLSX.utils.json_to_sheet([
      { Component: 'AHV', Role: 'Hypervisor' },
      { Component: 'AOS', Role: 'Storage / Cluster' },
      { Component: 'Prism Central', Role: 'Management' },
    ]),
  );
  append(
    ncpWb,
    '05_ComponentMapping',
    XLSX.utils.json_to_sheet(
      ncpEvidenceRows.slice(0, 20).map((r) => ({
        FeatureID: r.FeatureID,
        PrimaryComponent: 'AHV',
        SupportingComponents: 'AOS; Prism Central',
      })),
    ),
  );
  append(
    ncpWb,
    '90_Lists',
    sheetPairs([
      ['EvidenceStatus', 'ASSUMED-DRAFT'],
      ['ReviewStatus', 'Draft'],
      ['LifecycleStatus', 'Active'],
      ['ParityEncoding', 'Full|Partial|No'],
    ]),
  );
  append(
    ncpWb,
    '99_ChangeLog',
    XLSX.utils.json_to_sheet([
      {
        Date: '2026-08-31',
        Change:
          'Generated CN-aligned NCP_AHV KB from CN v0.3 + ASSUMED-DRAFT product profiles; carried over name-matched notes from NCP_AHV_KB_2026Q1',
        Author: 'automation',
      },
    ]),
  );
  append(
    ncpWb,
    'KB Metrics',
    sheetPairs([
      ['features', String(featureSeenNcp.size)],
      ['functionalities', String(ncpFuncRows.length)],
      ['fullParityFeatures', String([...featureSeenNcp].filter((id) => !id.startsWith('NCP-P-')).length)],
      ['partialParityFeatures', String([...featureSeenNcp].filter((id) => id.startsWith('NCP-P-')).length)],
    ]),
  );

  const crosswalk = {
    status: 'ASSUMED-DRAFT',
    generatedOn: '2026-08-31',
    warning:
      'ASSUMED-DRAFT CN alignment for NCP_AHV. Not evidence-backed. Not ready for advisory conclusions.',
    encoding: {
      fullParity: 'Exact CN featureId in NCP FeatureID column',
      partialParity: 'FeatureID = NCP-P-{cnFeatureId} with same FeatureName for near-match',
      noParity: 'Feature omitted from NCP FunctionalityMaster',
    },
    counts: {
      vcfFeatures: featureSeenVcf.size,
      vcfFunctionalities: vcfFuncRows.length,
      ncpFeatures: featureSeenNcp.size,
      ncpFunctionalities: ncpFuncRows.length,
      featuresByParity: {
        'Full Parity': crosswalkFeatures.filter((f) => f.assumedParity === 'Full Parity').length,
        'Partial Parity': crosswalkFeatures.filter((f) => f.assumedParity === 'Partial Parity').length,
        'No Parity': crosswalkFeatures.filter((f) => f.assumedParity === 'No Parity').length,
      },
    },
    features: crosswalkFeatures,
    functionalities: crosswalkFuncs,
  };

  return { vcfWb, ncpWb, crosswalk };
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const cn = loadJson(CN_PATH);
  const index = loadJson(INDEX_PATH);
  const assumptions = loadJson(ASSUMP_PATH);
  const oldNcpWb = XLSX.readFile(OLD_NCP);

  const { vcfWb, ncpWb, crosswalk } = buildWorkbooks(cn, index, assumptions, oldNcpWb);

  const vcfPath = join(OUT_DIR, 'VCF_KnowledgeBase_CN_v0.3.xlsx');
  const ncpPath = join(OUT_DIR, 'NCP_AHV_KB_CN_v0.3.xlsx');
  const xwalkPath = join(OUT_DIR, 'NCP_AHV_CN_Crosswalk.json');

  XLSX.writeFile(vcfWb, vcfPath, { bookType: 'xlsx' });
  XLSX.writeFile(ncpWb, ncpPath, { bookType: 'xlsx' });
  writeFileSync(xwalkPath, JSON.stringify(crosswalk, null, 2) + '\n');

  console.log(`Wrote ${vcfPath}`);
  console.log(`Wrote ${ncpPath}`);
  console.log(`Wrote ${xwalkPath}`);
  console.log(
    `Counts: VCF features=${crosswalk.counts.vcfFeatures} funcs=${crosswalk.counts.vcfFunctionalities}; NCP features=${crosswalk.counts.ncpFeatures} funcs=${crosswalk.counts.ncpFunctionalities}`,
  );
  console.log('Parity feature counts:', crosswalk.counts.featuresByParity);
}

main();
