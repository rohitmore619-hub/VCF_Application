#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const KBS = join(ROOT, 'v1.39-BaselineRohitHandover/kbs');
const MODEL = join(ROOT, 'v1.39-BaselineRohitHandover/canonical-model');
const REQUIRED = [
  '00_ReadMe',
  '01_Metadata',
  '02_FunctionalityMaster',
  '03_FeatureEvidenceRegister',
  '90_Lists',
  '99_ChangeLog',
];

function load(p) {
  return JSON.parse(readFileSync(p, 'utf8'));
}

function inheritAll(cn, mapFeatures) {
  let features = 0;
  let identical = 0;
  for (const p of cn.products) {
    for (const f of p.features) {
      const parities = (f.functionalities || []).map((g) => mapFeatures[g.functionalityId]?.parity);
      if (!parities.length) continue;
      features++;
      if (parities.every((x) => x && x === parities[0])) identical++;
    }
  }
  return features > 0 && identical === features;
}

function main() {
  const errors = [];
  const cn = load(join(MODEL, 'CN_v0.3_Canonical_Capability_Model.json'));
  const map = load(join(KBS, 'NCP_AHV_Evidence_Map_v1.json'));
  const xw = load(join(KBS, 'NCP_AHV_Evidence_Crosswalk_v1.json'));
  const profile = load(join(KBS, 'NordicPrecision_NCP_AHV_AssessmentProfile.json'));
  const rules = load(join(MODEL, 'VCF-AFA_Rules_v1.json'));
  const wb = XLSX.readFile(join(KBS, 'NCP_AHV_KB_CN_v0.3_Evidence.xlsx'));

  if (rules.scoringKey !== 'functionalityId') errors.push('rules scoringKey');
  for (const t of REQUIRED) {
    if (!wb.SheetNames.includes(t)) errors.push(`missing tab ${t}`);
  }

  const cnFnIds = cn.products.flatMap((p) => p.features.flatMap((f) => f.functionalities.map((g) => g.functionalityId)));
  if (cnFnIds.length !== 252) errors.push(`CN functionalities ${cnFnIds.length}`);
  if (inheritAll(cn, map.features || {})) errors.push('NCP inherit-all functionality parities');
  for (const id of cnFnIds) {
    if (!map.features[id]) errors.push(`evidence map missing ${id}`);
  }

  const catalog = map.evidenceCatalog || {};
  for (const [fid, ev] of Object.entries(map.features)) {
    if (!['Full Parity', 'Partial Parity', 'No Parity', 'Unknown'].includes(ev.parity)) {
      errors.push(`${fid} bad parity ${ev.parity}`);
    }
    if (!ev.evidenceKey || !catalog[ev.evidenceKey]) errors.push(`${fid} missing evidence URL key`);
    if (ev.parity === 'Partial Parity' && !ev.workaround) {
      errors.push(`${fid} Partial missing workaround`);
    }
  }

  const funcs = XLSX.utils.sheet_to_json(wb.Sheets['02_FunctionalityMaster'], { defval: '' });
  const evRows = XLSX.utils.sheet_to_json(wb.Sheets['03_FeatureEvidenceRegister'], { defval: '' });
  if (!funcs[0] || !('FeatureID' in funcs[0])) errors.push('FeatureID column missing');
  if (!funcs[0] || !('FunctionalityID' in funcs[0])) errors.push('FunctionalityID column missing');
  const missingUrl = evRows.filter((r) => !String(r.EvidenceURL || '').startsWith('http'));
  if (missingUrl.length) errors.push(`${missingUrl.length} evidence rows lack http URL`);

  const full = cnFnIds.filter((id) => map.features[id]?.parity === 'Full Parity');
  const partial = cnFnIds.filter((id) => map.features[id]?.parity === 'Partial Parity');
  const none = cnFnIds.filter((id) => ['No Parity', 'Unknown'].includes(map.features[id]?.parity));
  const encoded = new Set(funcs.map((r) => String(r.FunctionalityID || '').trim()).filter(Boolean));
  for (const id of full) if (!encoded.has(id)) errors.push(`Full missing ${id}`);
  for (const id of partial) {
    if (!encoded.has(`NCP-P-${id}`)) errors.push(`Partial missing NCP-P-${id}`);
    if (encoded.has(id)) errors.push(`Partial ${id} must not be exact CN id`);
  }
  for (const id of none) {
    if (encoded.has(id) || encoded.has(`NCP-P-${id}`)) errors.push(`No ${id} should be omitted`);
  }

  const reqKeys = Object.keys(profile.requirements || {});
  if (reqKeys.length < 84) errors.push('customer profile must rate features');

  console.log('Evidence KB validation (functionalityId)');
  console.log('  parity counts', xw.counts);
  console.log('  evidence rows', evRows.length, 'func rows', funcs.length);
  console.log('  customer requirement keys', reqKeys.length);
  console.log('  FN Full/Partial/No', full.length, partial.length, none.length);

  if (errors.length) {
    errors.forEach((e) => console.error(' -', e));
    process.exit(1);
  }
  console.log('PASS');
}

main();
