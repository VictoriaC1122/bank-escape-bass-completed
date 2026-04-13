#!/bin/zsh
set -u
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

ROOT=${0:A:h:h}
LIST="$ROOT/tools/asset-urls.tsv"

while IFS=$'\t' read -r url path; do
  [[ -z "${url:-}" || -z "${path:-}" ]] && continue
  target="$ROOT/$path"
  /bin/mkdir -p "${target:h}"
  if [[ -s "$target" ]]; then
    continue
  fi
  echo "fetch $path"
  /usr/bin/curl -fL --retry 2 --connect-timeout 15 -o "$target" "$url" || echo "missing $url" >> "$ROOT/tools/missing-assets.log"
done < "$LIST"
