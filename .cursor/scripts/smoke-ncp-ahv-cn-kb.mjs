#!/usr/bin/env node
/**
 * Smoke-test FeatureID scoring behavior for CN-aligned VCF + NCP KBs.
 * Mirrors app parse/scoring rules: exact match=Full, near name=Partial, else=No.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const KBS = join(ROOT, 'v1.39-BaselineRohitHandover/kbs');
const CN_XLSX = join(
  ROOT,
  'v1.39-BaselineRohitHandover/canonical-model/CN_v0.3_Canonical_Capability_Model.xlsx',
);

function sheetToJson(wb, name) {
  if (!wb.Sheets[name]) return [];
  return XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: '' });
}

function val(r, k) {
  return r?.[k] == null ? '' : String(r[k]).trim();
}

function parseKbWorkbook(fileName, wb) {
  const type = /^VCF_KnowledgeBase/i.test(fileName) ? 'VCF' : 'Comparator';
  const functions = sheetToJson(wb, '02_FunctionalityMaster');
  const evidence = sheetToJson(wb, '03_FeatureEvidenceRegister');
  const featureMap = {};
  functions.forEach((r) => {
    const fid = val(r, 'FeatureID');
    if (!fid) return;
    if (!featureMap[fid]) {
      featureMap[fid] = {
        FeatureID: fid,
        functions: 0,
        functionNames: [],
        DomainName: val(r, 'DomainName'),
        CapabilityName: val(r, 'CapabilityName'),
        FeatureName: val(r, 'FeatureName'),
      };
    }
    featureMap[fid].functions++;
    const n = val(r, 'FunctionalityName');
    if (n) featureMap[fid].functionNames.push(n);
  });
  evidence.forEach((r) => {
    const fid = val(r, 'FeatureID');
    if (!fid) return;
    if (!featureMap[fid]) {
      featureMap[fid] = {
        FeatureID: fid,
        functions: 0,
        functionNames: [],
        DomainName: '',
        CapabilityName: '',
        FeatureName: val(r, 'FeatureName'),
      };
    }
    if (val(r, 'FeatureName')) featureMap[fid].FeatureName = val(r, 'FeatureName');
  });
  const features = Object.values(featureMap);
  const featureIndex = {};
  features.forEach((f) => {
    featureIndex[f.FeatureID] = f;
  });
  return { fileName, type, features, featureIndex, functions };
}

function displayFeature(f) {
  return f.FeatureName || f.FeatureID || '';
}
function displayCapability(f) {
  return f.CapabilityName || '';
}

function nearFeatureMatch(c, f) {
  const target = (displayFeature(f) + ' ' + displayCapability(f)).toLowerCase();
  return c.features.find((cf) => {
    const s = (displayFeature(cf) + ' ' + displayCapability(cf)).toLowerCase();
    return s.includes(displayFeature(f).toLowerCase()) || target.includes(displayFeature(cf).toLowerCase());
  });
}

function runAnalysis(vcf, comp) {
  let full = 0;
  let partial = 0;
  let no = 0;
  const byPrefix = {};
  vcf.features.forEach((f) => {
    const match = comp.featureIndex[f.FeatureID];
    let parity = 'No Parity';
    if (match) {
      parity = 'Full Parity';
      full++;
    } else {
      const near = nearFeatureMatch(comp, f);
      if (near) {
        parity = 'Partial Parity';
        partial++;
      } else no++;
    }
    const prefix = f.FeatureID.split('-').slice(0, 2).join('-'); // VCF-01
    byPrefix[prefix] = byPrefix[prefix] || { full: 0, partial: 0, no: 0 };
    if (parity === 'Full Parity') byPrefix[prefix].full++;
    else if (parity === 'Partial Parity') byPrefix[prefix].partial++;
    else byPrefix[prefix].no++;
  });
  return { full, partial, no, byPrefix };
}

function main() {
  const vcfWb = XLSX.readFile(join(KBS, 'VCF_KnowledgeBase_CN_v0.3.xlsx'));
  const ncpWb = XLSX.readFile(join(KBS, 'NCP_AHV_KB_CN_v0.3.xlsx'));
  const cnWb = XLSX.readFile(CN_XLSX);

  const vcf = parseKbWorkbook('VCF_KnowledgeBase_CN_v0.3.xlsx', vcfWb);
  const ncp = parseKbWorkbook('NCP_AHV_KB_CN_v0.3.xlsx', ncpWb);

  if (vcf.type !== 'VCF') throw new Error('VCF file not classified as VCF');
  if (ncp.type !== 'Comparator') throw new Error('NCP file not classified as Comparator');
  if (vcf.features.length !== 84) throw new Error(`VCF features ${vcf.features.length} != 84`);

  // CN workbook still parses (Products sheet present)
  if (!cnWb.SheetNames.includes('Products') || !cnWb.SheetNames.includes('Functionalities')) {
    throw new Error('CN workbook missing expected sheets');
  }

  const result = runAnalysis(vcf, ncp);
  console.log('Classification: VCF OK, Comparator OK');
  console.log(
    `Analysis totals: Full=${result.full} Partial=${result.partial} No=${result.no} (of ${vcf.features.length})`,
  );
  console.log('By product prefix:');
  Object.keys(result.byPrefix)
    .sort()
    .forEach((k) => {
      const x = result.byPrefix[k];
      console.log(`  ${k}: Full=${x.full} Partial=${x.partial} No=${x.no}`);
    });

  // Expectations from ASSUMED-DRAFT encoding
  if (result.byPrefix['VCF-03']?.full !== 7) {
    throw new Error(`VCF-03 expected 7 Full, got ${JSON.stringify(result.byPrefix['VCF-03'])}`);
  }
  if (result.byPrefix['VCF-02']?.no !== 7) {
    throw new Error(`VCF-02 expected 7 No, got ${JSON.stringify(result.byPrefix['VCF-02'])}`);
  }
  if (result.byPrefix['VCF-01']?.partial !== 7) {
    throw new Error(`VCF-01 expected 7 Partial, got ${JSON.stringify(result.byPrefix['VCF-01'])}`);
  }
  if (result.full !== 7 || result.partial !== 70 || result.no !== 7) {
    throw new Error(`Unexpected totals Full/Partial/No=${result.full}/${result.partial}/${result.no}`);
  }

  console.log('\nPASS: FeatureID scoring smoke test matches ASSUMED-DRAFT encoding.');
}

main();
