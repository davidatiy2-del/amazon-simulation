#!/bin/bash
# build the game from its parts, then check it: the script parses, no name is declared twice, eslint finds no errors
set -e
cd "$(dirname "$0")"
python3 build.py
node --check build/main.js
node --check dist/www/js/start.js
python3 dupcheck.py
eslint -c eslint.config.mjs build/main.js --max-warnings 9999 > build/lint.txt 2>&1 || { grep -E "error" build/lint.txt | head -40; echo LINT_FAIL; exit 1; }
grep -cE "warning" build/lint.txt | xargs -I{} echo "lint warnings: {}"
echo LINT_OK
