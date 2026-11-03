#!/usr/bin/env bash
# Пересборка deploy.sh из исходных файлов локали (RU/EN).
#
# Использование:
#   ./build-deploy.sh          # пересобрать RU и EN
#   ./build-deploy.sh RU EN    # только указанные локали
#
# Каждый heredoc-блок `write_file "$DST/<path>" <<'DEPLOY_EOF_<MARKER>'`
# заменяется содержимым исходника `<локаль>/<path>`. Источник обязан существовать.
set -euo pipefail
cd "$(dirname "$0")"

LOCS=("$@")
[ ${#LOCS[@]} -eq 0 ] && LOCS=(RU EN)

for loc in "${LOCS[@]}"; do
  loc="$(printf '%s' "$loc" | tr '[:lower:]' '[:upper:]')"
  deploy="$loc/deploy.sh"
  [ -f "$deploy" ] || { echo "ОШИБКА: $deploy не найден" >&2; exit 1; }

  awk -v srcdir="$loc" '
    BEGIN { q = sprintf("%c", 39); skip = 0 }
    skip == 1 {
      if ($0 == marker) skip = 0
      next
    }
    /^write_file "\$DST\// {
      path = $0
      sub(/^write_file "\$DST\//, "", path)
      sub(/" <<.*$/, "", path)
      m = $0
      sub(/^.*<</, "", m)
      gsub("^" q "+|" q "+$", "", m)
      marker = m
      file = srcdir "/" path
      if ((getline line < file) < 0) {
        printf "ОШИБКА: источник не найден: %s\n", file > "/dev/stderr"
        exit 1
      }
      print
      do { print line } while ((getline line < file) > 0)
      close(file)
      print marker
      skip = 1
      next
    }
    { print }
  ' "$deploy" > "$deploy.tmp"

  if cmp -s "$deploy" "$deploy.tmp"; then
    echo "$deploy: без изменений (вшитые копии синхронны)"
    rm -f "$deploy.tmp"
  else
    chmod +x "$deploy.tmp"
    mv "$deploy.tmp" "$deploy"
    echo "$deploy: пересобран"
  fi
done
