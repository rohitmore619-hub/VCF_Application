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

function main() {
  const errors = [];
  const cn = load(join(MODEL, 'CN_v0.3_Canonical_Capability_Model.json'));
  const map = load(join(KBS, 'NCP_AHV_Evidence_Map_v1.json'));
  const xw = load(join(KBS, 'NCP_AHV_Evidence_Crosswalk_v1.json'));
  const profile = load(join(KBS, 'NordicPrecision_NCP_AHV_AssessmentProfile.json'));
  const wb = XLSX.readFile(join(KBS, 'NCP_AHV_KB_CN_v0.3_Evidence.xlsx'));

  for (const t of REQUIRED) {
    if (!wb.SheetNames.includes(t)) errors.push(`missing tab ${t}`);
  }

  const cnFeatureIds = cn.products.flatMap((p) => p.features.map((f) => f.featureId));
  if (cnFeatureIds.length !== 84) errors.push(`CN features ${cnFeatureIds.length}`);
  for (const id of cnFeatureIds) {
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
  const missingUrl = evRows.filter((r) => !String(r.EvidenceURL || '').startsWith('http'));
  if (missingUrl.length) errors.push(`${missingUrl.length} evidence rows lack http URL`);

  if (xw.counts['Full Parity'] !== 34) errors.push(`expected 34 Full, got ${xw.counts['Full Parity']}`);
  if (xw.counts['Partial Parity'] !== 48) errors.push(`expected 48 Partial, got ${xw.counts['Partial Parity']}`);
  if (xw.counts['No Parity'] !== 2) errors.push(`expected 2 No, got ${xw.counts['No Parity']}`);

  if (Object.keys(profile.requirements || {}).length !== 84) {
    errors.push('customer profile must rate all 84 features');
  }

  console.log('Evidence KB validation');
  console.log('  parity counts', xw.counts);
  console.log('  evidence rows', evRows.length, 'func rows', funcs.length);
  console.log('  customer requirement keys', Object.keys(profile.requirements).length);

  if (errors.length) {
    errors.forEach((e) => console.error(' -', e));
    process.exit(1);
  }
  console.log('PASS');
}

main();
