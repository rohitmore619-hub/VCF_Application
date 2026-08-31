#!/usr/bin/env node
/**
 * Validate CN v0.3 canonical model JSON + flat functionality index.
 * Checks duplicate IDs, orphan references, prefix rules, and index alignment.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const CN_PATH = join(
  ROOT,
  'v1.39-BaselineRohitHandover/canonical-model/CN_v0.3_Canonical_Capability_Model.json',
);
const INDEX_PATH = join(
  ROOT,
  'v1.39-BaselineRohitHandover/canonical-model/CN_v0.3_Functionality_Index.json',
);

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
}

function dupes(ids, label, errors) {
  const seen = new Map();
  for (const id of ids) {
    if (!id) {
      errors.push(`${label}: missing empty ID`);
      continue;
    }
    seen.set(id, (seen.get(id) || 0) + 1);
  }
  for (const [id, count] of seen) {
    if (count > 1) errors.push(`${label}: duplicate ID ${id} (${count}x)`);
  }
}

function main() {
  const errors = [];
  const warnings = [];

  let cn;
  let index;
  try {
    cn = loadJson(CN_PATH);
    index = loadJson(INDEX_PATH);
  } catch (e) {
    console.error('Failed to load CN artifacts:', e.message);
    process.exit(1);
  }

  const domains = cn.domains || [];
  const capabilities = cn.capabilities || [];
  const products = cn.products || [];

  if (!domains.length) errors.push('domains registry is missing or empty');
  if (!capabilities.length) errors.push('capabilities registry is missing or empty');
  if (products.length !== 12) {
    errors.push(`expected 12 products, found ${products.length}`);
  }

  const domainIds = domains.map((d) => d.domainId);
  const capabilityIds = capabilities.map((c) => c.capabilityId);
  const productIds = products.map((p) => p.productId);
  const featureIds = [];
  const functionalityIds = [];

  dupes(domainIds, 'domainId', errors);
  dupes(capabilityIds, 'capabilityId', errors);
  dupes(productIds, 'productId', errors);

  const domainSet = new Set(domainIds);
  const capabilitySet = new Set(capabilityIds);
  const productSet = new Set(productIds);
  const referencedDomains = new Set();
  const referencedCapabilities = new Set();

  for (const cap of capabilities) {
    if (!domainSet.has(cap.domainId)) {
      errors.push(`capability ${cap.capabilityId} references orphan domainId ${cap.domainId}`);
    }
  }

  for (const p of products) {
    if (!p.domainId) errors.push(`product ${p.productId} missing domainId`);
    if (!p.capabilityId) errors.push(`product ${p.productId} missing capabilityId`);
    if (p.domainId && !domainSet.has(p.domainId)) {
      errors.push(`product ${p.productId} references orphan domainId ${p.domainId}`);
    }
    if (p.capabilityId && !capabilitySet.has(p.capabilityId)) {
      errors.push(`product ${p.productId} references orphan capabilityId ${p.capabilityId}`);
    }
    referencedDomains.add(p.domainId);
    referencedCapabilities.add(p.capabilityId);

    const nn = p.productId?.split('-')[1];
    const expectedDomain = `VCF-D${nn}`;
    const expectedCap = `VCF-C${nn}`;
    if (p.domainId !== expectedDomain) {
      errors.push(`product ${p.productId} domainId ${p.domainId} != expected ${expectedDomain}`);
    }
    if (p.capabilityId !== expectedCap) {
      errors.push(`product ${p.productId} capabilityId ${p.capabilityId} != expected ${expectedCap}`);
    }

    for (const feat of p.features || []) {
      featureIds.push(feat.featureId);
      if (!feat.featureId?.startsWith(`${p.productId}-`)) {
        errors.push(`feature ${feat.featureId} does not prefix-match product ${p.productId}`);
      }
      if (feat.domainId !== p.domainId) {
        errors.push(`feature ${feat.featureId} domainId mismatch with product`);
      }
      if (feat.capabilityId !== p.capabilityId) {
        errors.push(`feature ${feat.featureId} capabilityId mismatch with product`);
      }
      if (feat.productId !== p.productId) {
        errors.push(`feature ${feat.featureId} productId mismatch with product`);
      }

      for (const fn of feat.functionalities || []) {
        functionalityIds.push(fn.functionalityId);
        if (!fn.functionalityId?.startsWith(`${feat.featureId}-`)) {
          errors.push(
            `functionality ${fn.functionalityId} does not prefix-match feature ${feat.featureId}`,
          );
        }
        if (fn.domainId !== p.domainId) {
          errors.push(`functionality ${fn.functionalityId} domainId mismatch`);
        }
        if (fn.capabilityId !== p.capabilityId) {
          errors.push(`functionality ${fn.functionalityId} capabilityId mismatch`);
        }
        if (fn.productId !== p.productId) {
          errors.push(`functionality ${fn.functionalityId} productId mismatch`);
        }
        if (fn.featureId !== feat.featureId) {
          errors.push(`functionality ${fn.functionalityId} featureId mismatch`);
        }
      }
    }
  }

  dupes(featureIds, 'featureId', errors);
  dupes(functionalityIds, 'functionalityId', errors);

  for (const d of domainIds) {
    if (!referencedDomains.has(d)) warnings.push(`domain registry entry ${d} is not referenced by any product`);
  }
  for (const c of capabilityIds) {
    if (!referencedCapabilities.has(c)) {
      warnings.push(`capability registry entry ${c} is not referenced by any product`);
    }
  }

  const nestedFuncSet = new Set(functionalityIds);
  const indexFuncSet = new Set(index.map((r) => r.functionalityId));

  if (index.length !== functionalityIds.length) {
    errors.push(
      `index row count ${index.length} != nested functionality count ${functionalityIds.length}`,
    );
  }

  for (const id of nestedFuncSet) {
    if (!indexFuncSet.has(id)) errors.push(`functionality ${id} missing from flat index`);
  }
  for (const id of indexFuncSet) {
    if (!nestedFuncSet.has(id)) errors.push(`flat index functionality ${id} missing from nested tree`);
  }

  for (const row of index) {
    for (const field of [
      'domainId',
      'domainName',
      'capabilityId',
      'capabilityName',
      'productId',
      'productName',
      'featureId',
      'featureName',
      'functionalityId',
      'functionalityName',
    ]) {
      if (!row[field]) errors.push(`index row ${row.functionalityId || '?'} missing ${field}`);
    }
  }

  console.log('CN v0.3 validation');
  console.log(`  domains: ${domains.length}`);
  console.log(`  capabilities: ${capabilities.length}`);
  console.log(`  products: ${products.length}`);
  console.log(`  features: ${featureIds.length}`);
  console.log(`  functionalities: ${functionalityIds.length}`);
  console.log(`  index rows: ${index.length}`);

  if (warnings.length) {
    console.log('\nWarnings:');
    warnings.forEach((w) => console.log(`  - ${w}`));
  }

  if (errors.length) {
    console.error('\nErrors:');
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log('\nPASS: no duplicate or orphan IDs detected.');
}

main();
