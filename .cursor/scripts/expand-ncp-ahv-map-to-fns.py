#!/usr/bin/env python3
"""Expand NCP_AHV feature-level evidence map to 252 functionalityIds."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from expand_feature_map_to_fns import expand_features_to_fns

ROOT = Path("/workspace/v1.39-BaselineRohitHandover")
CN = json.loads((ROOT / "canonical-model/CN_v0.3_Canonical_Capability_Model.json").read_text())
PATH = ROOT / "kbs/NCP_AHV_Evidence_Map_v1.json"


def main():
    obj = json.loads(PATH.read_text())
    feats = obj.get("features") or {}
    sample = next(iter(feats), "")
    if sample and "-FN" in sample and len(feats) == 252:
        print("NCP map already has 252 functionality keys")
        return
    functions = expand_features_to_fns(CN, feats)
    if len(functions) != 252:
        raise SystemExit(f"expected 252, got {len(functions)}")
    obj["features"] = functions
    obj["scoringKey"] = "functionalityId"
    PATH.write_text(json.dumps(obj, indent=2) + "\n")
    counts = {}
    for v in functions.values():
        counts[v["parity"]] = counts.get(v["parity"], 0) + 1
    print("NCP_AHV", counts, "keys", len(functions))


if __name__ == "__main__":
    main()
