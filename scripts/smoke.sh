#!/bin/bash
# smoke.sh — 所有作品外連與四個官方連結全 200/30x
set -u
fail=0
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
urls=$(node -e "
  global.window={};
  require('$SCRIPT_DIR/../data/sites.js');
  require('$SCRIPT_DIR/../data/exams.js');
  const u=[...window.HMJS_SITES.filter(s=>s.url).map(s=>s.url),
           ...window.HMJS_EXAMS.map(e=>e.officialUrl)];
  console.log([...new Set(u)].join('\n'));
")
while read -r u; do
  code=$(curl -sL -o /dev/null -w '%{http_code}' --max-time 20 "$u")
  if [ "$code" -ge 400 ] || [ "$code" -eq 000 ]; then echo "FAIL $code $u"; fail=1;
  else echo "ok   $code $u"; fi
done <<< "$urls"
[ $fail -eq 0 ] && echo "ALL CLEAN" || exit 1
