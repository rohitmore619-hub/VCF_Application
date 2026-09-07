#!/usr/bin/env node
/**
 * Validate Core comparator evidence maps + workbooks against CN v0.3 and VCF KB.
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

function parseKb(fileName, funcs, ev) {
  const featureIndex = {};
  const features = [];
  for (const r of funcs) {
    const fid = String(r.FeatureID || '').trim();
    if (!fid) continue;
    if (!featureIndex[fid]) {
      const f = { FeatureID: fid, FeatureName: r.FeatureName || '', CapabilityName: r.CapabilityName || '' };
      featureIndex[fid] = f;
      features.push(f);
    }
  }
  for (const r of ev || []) {
    const fid = String(r.FeatureID || '').trim();
    if (!fid) continue;
    if (!featureIndex[fid]) {
      const f = { FeatureID: fid, FeatureName: r.FeatureName || '', CapabilityName: '' };
      featureIndex[fid] = f;
      features.push(f);
    } else if (r.FeatureName) featureIndex[fid].FeatureName = r.FeatureName;
  }
  return { fileName, features, featureIndex };
}

function near(c, f) {
  const t = ((f.FeatureName || '') + ' ' + (f.CapabilityName || '')).toLowerCase();
  return c.features.find((cf) => {
    const s = ((cf.FeatureName || '') + ' ' + (cf.CapabilityName || '')).toLowerCase();
    return (
      (f.FeatureName && s.includes((f.FeatureName || '').toLowerCase())) ||
      (cf.FeatureName && t.includes((cf.FeatureName || '').toLowerCase()))
    );
  });
}

function score(vcf, comp) {
  let full = 0;
  let partial = 0;
  let no = 0;
  for (const f of vcf.features) {
    if (comp.featureIndex[f.FeatureID]) full++;
    else if (near(comp, f)) partial++;
    else no++;
  }
  return { full, partial, no };
}

function main() {
  const errors = [];
  const cn = load(join(MODEL, 'CN_v0.3_Canonical_Capability_Model.json'));
  const cnIds = cn.products.flatMap((p) => p.features.map((f) => f.featureId));
  if (cnIds.length !== 84) errors.push(`CN features ${cnIds.length} != 84`);

  const vcfWb = XLSX.readFile(join(KBS, 'VCF_KnowledgeBase_CN_v0.3.xlsx'));
  const vcf = parseKb('VCF', rows(vcfWb, '02_FunctionalityMaster'), rows(vcfWb, '03_FeatureEvidenceRegister'));

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
    const missingUrl = evRows.filter((r) => !String(r.EvidenceURL || '').startsWith('http'));
    if (missingUrl.length) errors.push(`${label}: ${missingUrl.length} evidence rows lack http URL`);

    const fullIds = cnIds.filter((id) => map.features[id]?.parity === 'Full Parity');
    const partialIds = cnIds.filter((id) => map.features[id]?.parity === 'Partial Parity');
    const noneIds = cnIds.filter((id) => ['No Parity', 'Unknown'].includes(map.features[id]?.parity));

    const ncpIds = new Set(funcs.map((r) => String(r.FeatureID || '').trim()).filter(Boolean));
    for (const id of fullIds) {
      if (!ncpIds.has(id)) errors.push(`${label}: Full ${id} missing exact FeatureID`);
    }
    for (const id of partialIds) {
      const pid = `${plat.prefix}-P-${id}`;
      if (!ncpIds.has(pid)) errors.push(`${label}: Partial missing ${pid}`);
      if (ncpIds.has(id)) errors.push(`${label}: Partial ${id} must not use exact CN ID`);
    }
    for (const id of noneIds) {
      if (ncpIds.has(id) || ncpIds.has(`${plat.prefix}-P-${id}`)) {
        errors.push(`${label}: No/Unknown ${id} should be omitted`);
      }
    }

    const vcfIds = new Set(vcf.features.map((f) => f.FeatureID));
    const overlap = [...ncpIds].filter((id) => vcfIds.has(id));
    for (const id of overlap) {
      if (!fullIds.includes(id)) errors.push(`${label}: unexpected overlap ${id}`);
    }

    const comp = parseKb(plat.fileBase, funcs, evRows);
    const sc = score(vcf, comp);
    const sig = `${sc.full}/${sc.partial}/${sc.no}`;
    signatures.push(`${label} Full/Partial/No=${sig}`);
    console.log(`${label}: map Full=${xw.counts['Full Parity']} Partial=${xw.counts['Partial Parity']} No=${xw.counts['No Parity']} | smoke ${sig}`);
    if (sc.full !== fullIds.length || sc.partial !== partialIds.length || sc.no !== noneIds.length) {
      errors.push(`${label}: smoke ${sig} != map ${fullIds.length}/${partialIds.length}/${noneIds.length}`);
    }
    if (sig === ncpSig) errors.push(`${label}: scoring signature must differ from NCP ${ncpSig}`);
    if (/^VCF_KnowledgeBase/i.test(`${plat.fileBase}_KB_CN_v0.3_Evidence.xlsx`)) {
      errors.push(`${label}: filename would be classified as VCF`);
    }
  }

  signatures.forEach((s) => console.log(' ', s));
  if (errors.length) {
    console.error('\nErrors:');
    errors.forEach((e) => console.error(' -', e));
    process.exit(1);
  }
  console.log('\nPASS core comparator KB validation');
}

main();
