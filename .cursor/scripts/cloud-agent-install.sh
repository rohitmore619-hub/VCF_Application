#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
APP_DIR="${ROOT}/v1.39-BaselineRohitHandover/v1.39-BaselineRohitHandover"
TEST_DIR="${ROOT}/01.TestFiles"
TEST_ZIP="${ROOT}/01.TestFiles.zip"

if [[ ! -d "${TEST_DIR}" ]]; then
  unzip -qo "${TEST_ZIP}" -d "${ROOT}"
fi

node "${ROOT}/.cursor/scripts/validate-inline-js.mjs" "${APP_DIR}/index.html"

echo "VCF-AFA environment install complete."
