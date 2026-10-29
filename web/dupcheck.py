#!/usr/bin/env python3
"""Top-level const/let/class names declared twice (a SyntaxError in one script)."""
import re, sys, collections
js = open('build/main.js', encoding='utf-8').read()
names = collections.Counter()
for m in re.finditer(r'^(?:const|let|class)\s+([A-Za-z_$][\w$]*)', js, re.M):
    names[m.group(1)] += 1
for m in re.finditer(r'^(?:const|let)\s+([A-Za-z_$][\w$]*\s*=[^;]*?(?:,\s*[A-Za-z_$][\w$]*\s*=))', js, re.M):
    pass
bad = [n for n, c in names.items() if c > 1]
if bad:
    print('DUPLICATE top-level declarations:', bad); sys.exit(1)
print('dupcheck ok', len(names), 'names')
