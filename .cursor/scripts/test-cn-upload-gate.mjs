#!/usr/bin/env node
/**
 * Headless CN upload gate test — mirrors v1.40 parseCnWorkbook + validateCnModel.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const MODEL_DIR = join(ROOT, 'v1.39-BaselineRohitHandover/canonical-model');
const MODEL_XLSX = join(MODEL_DIR, 'CN_v0.3_Canonical_Capability_Model.xlsx');
const MODEL_JSON = join(MODEL_DIR, 'CN_v0.3_Canonical_Capability_Model.json');

const EXPECTED_PRODUCTS = [
  'VCF Platform / Fleet / Workload Domains',
  'VCF Installer / SDDC Manager / Lifecycle Services',
  'vSphere Compute & Management',
  'vSAN & Storage Services',
  'NSX Networking / Edge / VPC Services',
  'NSX Security & Firewall Services',
  'VCF Operations & Observability',
  'VCF Automation & Self-Service',
  'vSphere Kubernetes Service & Application Platform',
  'HCX / Import / Converge / Workload Mobility',
  'Protection / Recovery / Resilience',
  'VCF Private AI Services',
];

function cellStr(v) {
  return v == null ? '' : String(v).trim();
}
function normKey(k) {
  return String(k || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}
function sheetRows(wb, name) {
  if (!wb?.Sheets?.[name]) return [];
  return XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: null, raw: false });
}
function pick(row, names) {
  if (!row) return '';
  const map = {};
  Object.keys(row).forEach((k) => {
    map[normKey(k)] = row[k];
  });
  for (const n of names) {
    const v = map[normKey(n)];
    if (v != null && String(v).trim() !== '') return cellStr(v);
  }
  return '';
}
function metadataFromSheet(wb) {
  const meta = {};
  sheetRows(wb, 'Metadata').forEach((row) => {
    const f = pick(row, ['Field', 'field']);
    const v = pick(row, ['Value', 'value']);
    if (f) meta[f] = v;
  });
  return meta;
}

function parseCnWorkbook(wb, fileName) {
  const names = wb.SheetNames || [];
  const productRows = sheetRows(wb, 'Products');
  const featureRows = sheetRows(wb, 'Features');
  let funcRows = sheetRows(wb, 'Functionalities');
  if (!funcRows.length) funcRows = sheetRows(wb, 'FunctionalityIndex');
  const meta = metadataFromSheet(wb);
  const products = [];
  const productById = {};
  productRows.forEach((row, idx) => {
    const id = pick(row, ['productId', 'Product_ID', 'ProductId']);
    const name = pick(row, ['productName', 'Product_Name', 'ProductName', 'name']);
    if (!id && !name) return;
    const pid = id || `PC-${idx + 1}`;
    const p = {
      productId: pid,
      name: name || pid,
      domainName: pick(row, ['domainName', 'DomainName', 'Domain']) || '',
      capabilityName: pick(row, ['capabilityName', 'CapabilityName', 'Capability']) || '',
      sortOrder: Number(pick(row, ['sortOrder', 'Sort_Order']) || idx + 1),
      features: [],
    };
    products.push(p);
    productById[pid] = p;
  });
  const featureById = {};
  featureRows.forEach((row) => {
    const fid = pick(row, ['featureId', 'Feature_ID', 'FeatureId']);
    const pid = pick(row, ['productId', 'Product_ID', 'ProductId']);
    const fname = pick(row, ['featureName', 'Feature_Name', 'FeatureName', 'name']);
    if (!fid) return;
    const parent = productById[pid] || products[0];
    if (!parent) return;
    const feature = {
      featureId: fid,
      name: fname || fid,
      description: pick(row, ['description', 'Feature_Description', 'FeatureDescription']) || '',
      capabilityName: pick(row, ['capabilityName', 'CapabilityName']) || parent.capabilityName || '',
      domainName: pick(row, ['domainName', 'DomainName']) || parent.domainName || '',
      functionalities: [],
    };
    parent.features.push(feature);
    featureById[fid] = feature;
  });
  funcRows.forEach((row) => {
    const gid = pick(row, ['functionalityId', 'Functionality_ID', 'FunctionalityId']);
    const fid = pick(row, ['featureId', 'Feature_ID', 'FeatureId']);
    const gname = pick(row, ['functionalityName', 'Functionality_Name', 'FunctionalityName', 'name']);
    if (!gid) return;
    let feature = featureById[fid];
    if (!feature) {
      const pid = pick(row, ['productId', 'Product_ID', 'ProductId']);
      const parent = productById[pid] || products[0];
      if (!parent) return;
      feature = featureById[fid || gid];
      if (!feature) {
        feature = {
          featureId: fid || `AUTO-${gid}`,
          name: pick(row, ['featureName', 'Feature_Name']) || `Feature for ${gid}`,
          description: '',
          capabilityName: parent.capabilityName || '',
          domainName: parent.domainName || '',
          functionalities: [],
        };
        parent.features.push(feature);
        featureById[feature.featureId] = feature;
      }
    }
    feature.functionalities.push({
      functionalityId: gid,
      name: gname || gid,
      description: pick(row, ['description', 'Functionality_Description']) || '',
      defaultRequirementImportance:
        pick(row, ['defaultRequirementImportance', 'Default_Criticality']) || 'Unknown',
      evidenceRequiredForParityClaim: true,
      notes: pick(row, ['ReviewerNotes', 'Notes']) || '',
    });
  });
  return {
    cnVersion: meta.cnVersion || meta.Model_Version || meta.ModelVersion || 'v0.3',
    cnStatus: meta.cnStatus || meta.Status || 'draft_candidate',
    cnTitle: 'VCF-AFA Canonical Capability Model',
    sourceFileName: fileName || '',
    sourceFormat: 'xlsx',
    metadata: { scoringKey: 'functionalityId', sourceWorkbookSheets: names.slice() },
    products,
    parseWarnings: [],
  };
}

function validateCnModel(obj) {
  const errors = [];
  const warnings = [];
  if (!obj || typeof obj !== 'object') {
    errors.push('CN root must be an object.');
    return { ok: false, errors, warnings, summary: null };
  }
  if (!Array.isArray(obj.products) || !obj.products.length) {
    errors.push('CN products list is missing or empty.');
    return { ok: false, errors, warnings, summary: null };
  }
  if (obj.products.length !== 12) {
    errors.push(`Expected exactly 12 top-level products/components, found ${obj.products.length}.`);
  }
  const names = obj.products.map((p) => String((p && p.name) || ''));
  const exactMatch = EXPECTED_PRODUCTS.every((expected, i) => names[i] === expected);
  if (!exactMatch) {
    warnings.push('Product names differ from the handover 12-area CN v0.3 list.');
  }
  const featureIds = {};
  const functionalityIds = {};
  let featureCount = 0;
  let functionalityCount = 0;
  obj.products.forEach((p) => {
    (p.features || []).forEach((f) => {
      featureCount++;
      const fid = String((f && f.featureId) || '');
      if (!fid) errors.push(`A feature is missing featureId under ${p.name || 'product'}.`);
      else if (featureIds[fid]) errors.push(`Duplicate featureId: ${fid}`);
      else featureIds[fid] = true;
      (f.functionalities || []).forEach((g) => {
        functionalityCount++;
        const gid = String((g && g.functionalityId) || '');
        if (!gid) errors.push(`A functionality is missing functionalityId under ${f.name || fid}.`);
        else if (functionalityIds[gid]) errors.push(`Duplicate functionalityId: ${gid}`);
        else functionalityIds[gid] = true;
      });
    });
  });
  if (featureCount === 0 || functionalityCount === 0) {
    errors.push(`CN has no Features/Functionalities (${featureCount} features / ${functionalityCount} functionalities).`);
  }
  const scoringKey = (obj.metadata || {}).scoringKey || 'functionalityId';
  const ok = errors.length === 0;
  return {
    ok,
    errors,
    warnings,
    summary: {
      cnVersion: obj.cnVersion || '',
      cnStatus: obj.cnStatus || '',
      products: obj.products.length,
      features: featureCount,
      functionalities: functionalityCount,
      scoringKey,
      sourceFormat: obj.sourceFormat || '',
    },
  };
}

function testLabel(label, result) {
  const s = result.summary;
  console.log(`\n${label}: ${result.ok ? 'PASS' : 'FAIL'}`);
  if (s) {
    console.log(`  ${s.products} products / ${s.features} features / ${s.functionalities} functionalities`);
  }
  if (result.errors.length) result.errors.forEach((e) => console.error(`  ERROR: ${e}`));
  if (result.warnings.length) result.warnings.forEach((w) => console.log(`  WARN: ${w}`));
  return result.ok;
}

const wb = XLSX.read(readFileSync(MODEL_XLSX), { type: 'buffer' });
const fromXlsx = parseCnWorkbook(wb, 'CN_v0.3_Canonical_Capability_Model.xlsx');
const xlsxOk = testLabel('Excel CN gate', validateCnModel(fromXlsx));

const fromJson = JSON.parse(readFileSync(MODEL_JSON, 'utf8'));
fromJson.sourceFormat = 'json';
const jsonOk = testLabel('JSON CN gate', validateCnModel(fromJson));

if (!xlsxOk || !jsonOk) process.exit(1);
console.log('\nAll CN upload gate tests passed.');
