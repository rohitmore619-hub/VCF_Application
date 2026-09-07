#!/usr/bin/env node
/**
 * Validate Core comparator evidence maps + workbooks against CN v0.3 functionalityIds.
 */
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

const PLATFORMS = [
  { key: 'AzureLocal', prefix: 'AZL', fileBase: 'AzureLocal' },
  { key: 'OpenShiftVirtualization', prefix: 'OSV', fileBase: 'OpenShiftVirtualization' },
  { key: 'OpenStackKVM', prefix: 'OSK', fileBase: 'OpenStackKVM' },
  { key: 'ProxmoxVE', prefix: 'PMX', fileBase: 'ProxmoxVE' },
];

function load(p) {
  return JSON.parse(readFileSync(p, 'utf8'));
}
function rows(wb, n) {
  return XLSX.utils.sheet_to_json(wb.Sheets[n] || {}, { defval: '' });
}
function fnId(r) {
  return String(r.FunctionalityID || r.ComparatorFunctionalityID || '').trim();
}

function scoreFn(vcfIds, vcfNameById, funcs) {
  const idx = {};
  const names = {};
  for (const r of funcs) {
    const id = fnId(r);
    if (!id) continue;
    idx[id] = r;
    const nm = String(r.FunctionalityName || '').trim().toLowerCase();
    if (nm) names[nm] = names[nm] || [];
    if (nm) names[nm].push(id);
  }
  let full = 0;
  let partial = 0;
  let no = 0;
  for (const id of vcfIds) {
    if (idx[id]) full++;
    else {
      const pkey = Object.keys(idx).find((k) => k.endsWith(`-P-${id}`));
      if (pkey) partial++;
      else {
        const nm = (vcfNameById[id] || '').toLowerCase();
        const alts = (names[nm] || []).filter((k) => k !== id);
        if (alts.length) partial++;
        else no++;
      }
    }
  }
  return { full, partial, no };
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
  const cnFn = cn.products.flatMap((p) => p.features.flatMap((f) => f.functionalities.map((g) => g)));
  const cnIds = cnFn.map((g) => g.functionalityId);
  const cnName = Object.fromEntries(cnFn.map((g) => [g.functionalityId, g.name]));
  if (cnIds.length !== 252) errors.push(`CN functionalities ${cnIds.length} != 252`);

  const vcfWb = XLSX.readFile(join(KBS, 'VCF_KnowledgeBase_CN_v0.3.xlsx'));
  const vcfFuncs = rows(vcfWb, '02_FunctionalityMaster');
  const vcfFnIds = vcfFuncs.map(fnId).filter((id) => /^VCF-\d{2}-F\d{2}-FN\d{2}$/.test(id));
  if (vcfFnIds.length !== 252) errors.push(`VCF FunctionalityID rows ${vcfFnIds.length} != 252`);

  const ncpXw = load(join(KBS, 'NCP_AHV_Evidence_Crosswalk_v1.json'));
  const ncpSig = `${ncpXw.counts['Full Parity']}/${ncpXw.counts['Partial Parity']}/${ncpXw.counts['No Parity']}`;

  const only = process.argv[2];
  const list = only ? PLATFORMS.filter((p) => p.key === only) : PLATFORMS;
  if (only && !list.length) {
    console.error('Unknown platform', only);
    process.exit(1);
  }

  const signatures = [];
  for (const plat of list) {
    const map = load(join(KBS, `${plat.fileBase}_Evidence_Map_v1.json`));
    const xw = load(join(KBS, `${plat.fileBase}_Evidence_Crosswalk_v1.json`));
    const wb = XLSX.readFile(join(KBS, `${plat.fileBase}_KB_CN_v0.3_Evidence.xlsx`));
    const label = plat.key;

    if (map.platformKey !== plat.key) errors.push(`${label}: platformKey mismatch`);
    if (inheritAll(cn, map.features || {})) errors.push(`${label}: inherit-all functionality parities`);
    for (const t of REQUIRED) {
      if (!wb.SheetNames.includes(t)) errors.push(`${label}: missing tab ${t}`);
    }
    const catalog = map.evidenceCatalog || {};
    for (const id of cnIds) {
      const ev = map.features?.[id];
      if (!ev) errors.push(`${label}: map missing ${id}`);
      else {
        if (!['Full Parity', 'Partial Parity', 'No Parity', 'Unknown'].includes(ev.parity)) {
          errors.push(`${label}: ${id} bad parity`);
        }
        if (!ev.evidenceKey || !catalog[ev.evidenceKey]) errors.push(`${label}: ${id} missing evidence URL key`);
        if (ev.parity === 'Partial Parity' && (!ev.workaround || !ev.workaroundComplexity || !ev.technicalImpact)) {
          errors.push(`${label}: ${id} Partial missing workaround fields`);
        }
      }
    }
    if (map.evaluationBasisType === 'CompositePeriod' && plat.key !== 'OpenStackKVM') {
      errors.push(`${label}: CompositePeriod only expected for OpenStackKVM`);
    }
    if (plat.key === 'OpenStackKVM' && map.evaluationBasisType !== 'CompositePeriod') {
      errors.push(`${label}: expected CompositePeriod`);
    }

    const funcs = rows(wb, '02_FunctionalityMaster');
    const evRows = rows(wb, '03_FeatureEvidenceRegister');
    if (!funcs[0] || !('FeatureID' in funcs[0])) errors.push(`${label}: FeatureID column missing`);
    if (!funcs[0] || !('FunctionalityID' in funcs[0])) errors.push(`${label}: FunctionalityID column missing`);
    const missingUrl = evRows.filter((r) => !String(r.EvidenceURL || '').startsWith('http'));
    if (missingUrl.length) errors.push(`${label}: ${missingUrl.length} evidence rows lack http URL`);

    const fullIds = cnIds.filter((id) => map.features[id]?.parity === 'Full Parity');
    const partialIds = cnIds.filter((id) => map.features[id]?.parity === 'Partial Parity');
    const noneIds = cnIds.filter((id) => ['No Parity', 'Unknown'].includes(map.features[id]?.parity));

    const encoded = new Set(funcs.map(fnId).filter(Boolean));
    for (const id of fullIds) {
      if (!encoded.has(id)) errors.push(`${label}: Full ${id} missing exact FunctionalityID`);
    }
    for (const id of partialIds) {
      const pid = `${plat.prefix}-P-${id}`;
      if (!encoded.has(pid)) errors.push(`${label}: Partial missing ${pid}`);
      if (encoded.has(id)) errors.push(`${label}: Partial ${id} must not use exact CN FunctionalityID`);
    }
    for (const id of noneIds) {
      if (encoded.has(id) || encoded.has(`${plat.prefix}-P-${id}`)) {
        errors.push(`${label}: No/Unknown ${id} should be omitted`);
      }
    }

    const vcfIdSet = new Set(vcfFnIds);
    for (const id of encoded) {
      if (vcfIdSet.has(id) && !fullIds.includes(id)) errors.push(`${label}: unexpected VCF FunctionalityID overlap ${id}`);
    }

    const sc = scoreFn(cnIds, cnName, funcs);
    const sig = `${sc.full}/${sc.partial}/${sc.no}`;
    signatures.push(`${label} Full/Partial/No=${sig}`);
    console.log(
      `${label}: map Full=${xw.counts['Full Parity']} Partial=${xw.counts['Partial Parity']} No=${xw.counts['No Parity']} | smoke ${sig}`,
    );
    if (sc.full !== fullIds.length || sc.partial !== partialIds.length || sc.no !== noneIds.length) {
      errors.push(`${label}: smoke ${sig} != map ${fullIds.length}/${partialIds.length}/${noneIds.length}`);
    }
    if (sig === ncpSig) errors.push(`${label}: scoring signature must differ from NCP ${ncpSig}`);
  }

  signatures.forEach((s) => console.log(' ', s));
  if (errors.length) {
    console.error('\nErrors:');
    errors.forEach((e) => console.error(' -', e));
    process.exit(1);
  }
  console.log('\nPASS core comparator KB validation (functionalityId)');
}

main();
