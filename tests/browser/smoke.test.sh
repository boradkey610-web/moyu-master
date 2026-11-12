#!/usr/bin/env bash
set -eu
TAB_ID="${1:?Pass the tab ID of the deployed game or dance review page}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
myflicker-browser wait_for --tab-id "$TAB_ID" --selector 'canvas[data-art-status="ready"]' --timeout-ms 15000
myflicker-browser evaluate --tab-id "$TAB_ID" --expression-file "$ROOT/tests/browser/scripts/site-smoke.js" --timeout-ms 20000
myflicker-browser console_messages --tab-id "$TAB_ID" --limit 20
myflicker-browser network_requests --tab-id "$TAB_ID" --limit 30
