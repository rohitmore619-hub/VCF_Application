#!/usr/bin/env node
/**
 * Validate CN-aligned NCP_AHV + paired VCF KBs against ASSUMED-DRAFT encoding rules.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const KBS = join(ROOT, 'v1.39-BaselineRohitHandover/kbs');
const MODEL_DIR = join(ROOT, 'v1.39-BaselineRohitHandover/canonical-model');

const REQUIRED_TABS = [
  '00_ReadMe',
  '01_Metadata',
  '02_FunctionalityMaster',
  '03_FeatureEvidenceRegister',
  '90_Lists',
  '99_ChangeLog',
];

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
}

function clean(row) {
  const out = {};
  for (const [k, v] of Object.entries(row || {})) {
    if (String(k).startsWith('__')) continue;
    out[k] = v == null ? '' : v;
  }
  return out;
}

function sheetRows(wb, name) {
  if (!wb.Sheets[name]) return [];
  return XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: '' }).map(clean);
}

function main() {
  const errors = [];
  const warnings = [];

  const cn = loadJson(join(MODEL_DIR, 'CN_v0.3_Canonical_Capability_Model.json'));
  const assumptions = loadJson(join(MODEL_DIR, 'CN_v0.3_Core_Parity_Assumptions.json'));
  const crosswalk = loadJson(join(KBS, 'NCP_AHV_CN_Crosswalk.json'));

  const vcfWb = XLSX.readFile(join(KBS, 'VCF_KnowledgeBase_CN_v0.3.xlsx'));
  const ncpWb = XLSX.readFile(join(KBS, 'NCP_AHV_KB_CN_v0.3.xlsx'));

  for (const [label, wb] of [
    ['VCF', vcfWb],
    ['NCP', ncpWb],
  ]) {
    for (const t of REQUIRED_TABS) {
      if (!wb.SheetNames.includes(t)) errors.push(`${label}: missing tab ${t}`);
    }
  }

  const vcfFuncs = sheetRows(vcfWb, '02_FunctionalityMaster');
  const ncpFuncs = sheetRows(ncpWb, '02_FunctionalityMaster');
  const vcfEv = sheetRows(vcfWb, '03_FeatureEvidenceRegister');
  const ncpEv = sheetRows(ncpWb, '03_FeatureEvidenceRegister');

  if (!vcfFuncs.length || !('FeatureID' in vcfFuncs[0])) {
    errors.push('VCF FunctionalityMaster missing FeatureID');
  }
  if (!ncpFuncs.length || !('FeatureID' in ncpFuncs[0])) {
    errors.push('NCP FunctionalityMaster missing FeatureID');
  }

  const vcfFeatureIds = new Set(vcfFuncs.map((r) => r.FeatureID).filter(Boolean));
  const ncpFeatureIds = new Set(ncpFuncs.map((r) => r.FeatureID).filter(Boolean));

  const cnFeatures = [];
  for (const p of cn.products) {
    const parity = assumptions.profileByProduct[p.productId][0];
    for (const f of p.features) {
      cnFeatures.push({ productId: p.productId, featureId: f.featureId, name: f.name, parity });
    }
  }

  if (vcfFeatureIds.size !== 84) {
    errors.push(`VCF expected 84 unique FeatureIDs, found ${vcfFeatureIds.size}`);
  }
  if (vcfFuncs.length !== 252) {
    errors.push(`VCF expected 252 functionality rows, found ${vcfFuncs.length}`);
  }

  const full = cnFeatures.filter((f) => f.parity === 'Full Parity');
  const partial = cnFeatures.filter((f) => f.parity === 'Partial Parity');
  const none = cnFeatures.filter((f) => f.parity === 'No Parity');

  for (const f of full) {
    if (!ncpFeatureIds.has(f.featureId)) {
      errors.push(`Full parity feature missing exact ID in NCP: ${f.featureId}`);
    }
  }
  for (const f of partial) {
    const pid = `NCP-P-${f.featureId}`;
    if (!ncpFeatureIds.has(pid)) {
      errors.push(`Partial parity feature missing NCP-P ID: ${pid}`);
    }
    if (ncpFeatureIds.has(f.featureId)) {
      errors.push(`Partial parity feature must not use exact CN FeatureID: ${f.featureId}`);
    }
  }
  for (const f of none) {
    if (ncpFeatureIds.has(f.featureId) || ncpFeatureIds.has(`NCP-P-${f.featureId}`)) {
      errors.push(`No-parity feature should be omitted from NCP: ${f.featureId}`);
    }
  }

  const overlap = [...ncpFeatureIds].filter((id) => vcfFeatureIds.has(id));
  const expectedOverlap = new Set(full.map((f) => f.featureId));
  for (const id of overlap) {
    if (!expectedOverlap.has(id)) {
      errors.push(`Unexpected FeatureID overlap VCF∩NCP: ${id}`);
    }
  }
  for (const id of expectedOverlap) {
    if (!overlap.includes(id)) {
      errors.push(`Expected Full overlap missing: ${id}`);
    }
  }

  // Partial near-match names: evidence FeatureName should equal CN feature name
  const ncpEvById = new Map(ncpEv.map((r) => [r.FeatureID, r]));
  for (const f of partial) {
    const row = ncpEvById.get(`NCP-P-${f.featureId}`);
    if (row && row.FeatureName !== f.name) {
      errors.push(`Partial FeatureName mismatch for ${f.featureId}: "${row.FeatureName}" vs "${f.name}"`);
    }
  }

  // Crosswalk consistency
  if (crosswalk.counts?.vcfFeatures !== 84) {
    errors.push(`Crosswalk vcfFeatures expected 84, got ${crosswalk.counts?.vcfFeatures}`);
  }
  if (crosswalk.counts?.featuresByParity?.['Full Parity'] !== full.length) {
    errors.push('Crosswalk Full Parity count mismatch');
  }
  if (crosswalk.counts?.featuresByParity?.['No Parity'] !== none.length) {
    errors.push('Crosswalk No Parity count mismatch');
  }

  // Evidence status draft markers
  const draftEv = ncpEv.filter((r) => String(r.EvidenceStatus).includes('ASSUMED'));
  if (draftEv.length !== ncpEv.length) {
    warnings.push(`${ncpEv.length - draftEv.length} NCP evidence rows lack ASSUMED-DRAFT status`);
  }

  console.log('NCP_AHV CN KB validation');
  console.log(`  VCF features=${vcfFeatureIds.size} funcs=${vcfFuncs.length} evidence=${vcfEv.length}`);
  console.log(`  NCP features=${ncpFeatureIds.size} funcs=${ncpFuncs.length} evidence=${ncpEv.length}`);
  console.log(`  Full=${full.length} Partial=${partial.length} No=${none.length}`);
  console.log(`  VCF∩NCP exact overlap=${overlap.length}`);

  if (warnings.length) {
    console.log('\nWarnings:');
    warnings.forEach((w) => console.log(`  - ${w}`));
  }
  if (errors.length) {
    console.error('\nErrors:');
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }
  console.log('\nPASS: NCP_AHV CN-aligned KB encoding is valid.');
}

main();
