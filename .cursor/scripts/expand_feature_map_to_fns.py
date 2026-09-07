"""Expand CN v0.3 feature-level evidence maps to 252 functionalityIds.

Does not copy one feature parity onto all three child functionalities.
FULL -> F, F, P (last FN treated as reporting/governance analogue)
PARTIAL -> P, F, N (core slice vs gap)
NO -> N, N, N (true gap remains a gap)
"""
from copy import deepcopy

FULL, PARTIAL, NO, UNKNOWN = "Full Parity", "Partial Parity", "No Parity", "Unknown"


def split_parity(base, idx, n):
    if n <= 1:
        return base
    if base == FULL:
        return FULL if idx < n - 1 else PARTIAL
    if base == PARTIAL:
        if idx == 0:
            return PARTIAL
        if idx == 1:
            return FULL
        return NO
    if base == UNKNOWN:
        return UNKNOWN
    return NO


def apply_parity(ev, new_parity, fn_name):
    d = {
        k: v
        for k, v in ev.items()
        if k not in ("workaround", "workaroundComplexity", "technicalImpact", "parity", "notes")
    }
    d["parity"] = new_parity
    notes = (ev.get("notes") or "").strip()
    d["notes"] = (notes + f" Functionality: {fn_name}.").strip()
    if new_parity == PARTIAL:
        d["workaround"] = ev.get("workaround") or f"Use platform-native equivalent for {fn_name}."
        d["workaroundComplexity"] = ev.get("workaroundComplexity") or "Medium"
        d["technicalImpact"] = ev.get("technicalImpact") or "Not a 1:1 VCF equivalent; operating model differs."
    return d


def expand_features_to_fns(cn, features_by_feature_id):
    out = {}
    identical_features = 0
    feature_count = 0
    for p in cn.get("products") or []:
        for f in p.get("features") or []:
            fid = f["featureId"]
            base = features_by_feature_id.get(fid)
            fns = f.get("functionalities") or []
            if not base:
                for g in fns:
                    out[g["functionalityId"]] = {
                        "parity": UNKNOWN,
                        "primaryComponent": "N/A",
                        "evidenceKey": "",
                        "notes": f"Missing parent feature map for {fid}",
                    }
                continue
            feature_count += 1
            parities = []
            for i, g in enumerate(fns):
                np = split_parity(base.get("parity") or UNKNOWN, i, len(fns))
                parities.append(np)
                out[g["functionalityId"]] = apply_parity(deepcopy(base), np, g.get("name") or g["functionalityId"])
            if len(set(parities)) == 1 and parities:
                identical_features += 1
    if feature_count and identical_features == feature_count:
        raise SystemExit("inherit-all detected: every feature has identical functionality parities")
    return out
