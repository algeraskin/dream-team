#!/usr/bin/env bash
#
# deploy.sh — deploy the virtual software development team architecture
#             (this directory, EN/) into another opencode project.
#
# Copies the multi-agent team into <target>:
#   .opencode/agent/      12 agent files
#   .opencode/command/    4 team commands
#   .opencode/plugins/    team-tokens plugin
#   .opencode/skill/      10 role skills
#   AGENTS.md             team charter (as AGENTS.md, or AGENTS-team.md
#                         if the target already has its own AGENTS.md)
#   agent-team-spec.md    full specification (referenced by the charter)
#   TEAM-README.txt       team readme
#
# Merges into the target opencode.json (never overwrites it):
#   - instructions: + "<charter file>"
#   - default_agent: "team-lead" (only with --with-default-agent)
# If the target has no opencode.json, this project's one is copied as is.
#
# Never touched: target's team-workspace/, tokens.log, its own agents and
# commands not part of the team (existing team files are skipped unless
# --force; with --force they are backed up first).
#
# Usage:
#   ./deploy.sh <target-dir> [options]
#
# Options:
#   --force               overwrite existing team files (backup is kept)
#   --dry-run             show the plan without writing anything
#   --no-charter          do not copy AGENTS.md (charter)
#   --no-spec             do not copy agent-team-spec.md
#   --with-default-agent  set default_agent: team-lead in the target config
#   -h, --help            show this help
#
set -euo pipefail

SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() { sed -n '2,40p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; }

die() { echo "ERROR: $*" >&2; exit 1; }

TARGET=""
FORCE=0
DRYRUN=0
NO_CHARTER=0
NO_SPEC=0
SET_DEFAULT_AGENT=0

while [ $# -gt 0 ]; do
  case "$1" in
    --force) FORCE=1 ;;
    --dry-run) DRYRUN=1 ;;
    --no-charter) NO_CHARTER=1 ;;
    --no-spec) NO_SPEC=1 ;;
    --with-default-agent) SET_DEFAULT_AGENT=1 ;;
    -h|--help) usage; exit 0 ;;
    -*) die "unknown option: $1 (see --help)" ;;
    *)
      [ -z "$TARGET" ] || die "target directory specified twice"
      TARGET="$1"
      ;;
  esac
  shift
done

[ -n "$TARGET" ] || { usage; echo; die "target directory is required"; }
[ -d "$SOURCE_DIR/.opencode/agent" ] || die "source is broken: $SOURCE_DIR/.opencode/agent not found"

if [ "$DRYRUN" -eq 1 ]; then
  _parent="$(dirname "$TARGET")"
  if [ -d "$_parent" ]; then
    TARGET="$(cd "$_parent" && pwd)/$(basename "$TARGET")"
  fi
  echo "DRY RUN — no files will be written"
else
  mkdir -p "$TARGET"
  TARGET="$(cd "$TARGET" && pwd)"
fi
[ "$TARGET" != "$SOURCE_DIR" ] || die "target equals source ($SOURCE_DIR)"
[ ! -d "$SOURCE_DIR/.git" ] || true

echo "Source: $SOURCE_DIR"
echo "Target: $TARGET"
echo

# ---------------------------------------------------------------- counters
COPIED=0
SKIPPED=0
BACKUPS=0
BACKUP_DIR="$TARGET/.team-deploy-backup-$(date +%Y%m%d-%H%M%S)"

say() { printf '  %s\n' "$1"; }

# backup <file>: keep a copy before overwriting
backup() {
  local f="$1"
  mkdir -p "$BACKUP_DIR/$(dirname "${f#"$TARGET"/}")"
  cp -p "$f" "$BACKUP_DIR/${f#"$TARGET"/}"
  BACKUPS=$((BACKUPS + 1))
}

# copy_file <src> <dst>
copy_file() {
  local src="$1" dst="$2" rel="${2#"$TARGET"/}"
  if [ -e "$dst" ]; then
    if [ "$FORCE" -ne 1 ]; then
      say "SKIP  $rel (exists; use --force to overwrite)"
      SKIPPED=$((SKIPPED + 1))
      return
    fi
    [ "$DRYRUN" -eq 1 ] || backup "$dst"
    say "BACKUP+OVERWRITE $rel"
  else
    say "ADD   $rel"
  fi
  if [ "$DRYRUN" -ne 1 ]; then
    mkdir -p "$(dirname "$dst")"
    cp -p "$src" "$dst"
  fi
  COPIED=$((COPIED + 1))
}

# deploy_tree <rel-dir> — recursively deploy a directory under the target
deploy_tree() {
  local dir="$1" src="$SOURCE_DIR/$1" f rel
  [ -d "$src" ] || die "missing source directory: $1"
  while IFS= read -r f; do
    rel="${f#"$SOURCE_DIR"/}"
    copy_file "$f" "$TARGET/$rel"
  done < <(find "$src" -type f | sort)
}

# ---------------------------------------------------------------- plan
echo "Deploying team files:"
deploy_tree ".opencode/agent"
deploy_tree ".opencode/command"
deploy_tree ".opencode/plugins"
deploy_tree ".opencode/skill"

CHARTER_MARKER="Virtual Software Development Team"

is_team_charter() { # <file> — true if the file is a copy of the team charter
  [ -f "$1" ] && grep -q "$CHARTER_MARKER" "$1"
}

CHARTER_DST="$TARGET/AGENTS.md"
CHARTER_NAME="AGENTS.md"
if [ "$NO_CHARTER" -eq 0 ]; then
  if [ -e "$CHARTER_DST" ] && ! is_team_charter "$CHARTER_DST" && [ "$FORCE" -ne 1 ]; then
    CHARTER_DST="$TARGET/AGENTS-team.md"
    CHARTER_NAME="AGENTS-team.md"
  fi
  echo "Charter:"
  copy_file "$SOURCE_DIR/AGENTS.md" "$CHARTER_DST"
else
  CHARTER_NAME=""
  echo "Charter: skipped (--no-charter)"
fi

if [ "$NO_SPEC" -eq 0 ]; then
  echo "Specification:"
  copy_file "$SOURCE_DIR/agent-team-spec.md" "$TARGET/agent-team-spec.md"
else
  echo "Specification: skipped (--no-spec)"
fi

if [ -f "$SOURCE_DIR/readme.txt" ]; then
  echo "Readme:"
  copy_file "$SOURCE_DIR/readme.txt" "$TARGET/TEAM-README.txt"
fi

# ---------------------------------------------------------------- opencode.json
echo "opencode.json:"
TARGET_CFG="$TARGET/opencode.json"
if [ ! -e "$TARGET_CFG" ]; then
  copy_file "$SOURCE_DIR/opencode.json" "$TARGET_CFG"
elif command -v python3 >/dev/null 2>&1; then
  MERGE_OK=1
  if [ "$DRYRUN" -eq 1 ]; then
    say "MERGE  opencode.json: instructions += ${CHARTER_NAME:-<none>}$([ "$SET_DEFAULT_AGENT" -eq 1 ] && echo ', default_agent=team-lead') (dry run)"
  else
    [ -e "$TARGET_CFG" ] || true
    [ "$FORCE" -eq 1 ] && backup "$TARGET_CFG"
    python3 - "$TARGET_CFG" "$CHARTER_NAME" "$SET_DEFAULT_AGENT" <<'PYEOF' || MERGE_OK=0
import json, sys, shutil

path, charter, force_default = sys.argv[1], sys.argv[2], sys.argv[3] == "1"
backup = path + ".pre-team-merge"
shutil.copyfile(path, backup)
with open(path, encoding="utf-8") as f:
    cfg = json.load(f)

changed = []
if charter:
    instr = cfg.get("instructions", [])
    if isinstance(instr, str):
        instr = [instr]
    if charter not in instr:
        instr.append(charter)
        cfg["instructions"] = instr
        changed.append(f"instructions += {charter}")
if force_default and cfg.get("default_agent") != "team-lead":
    cfg["default_agent"] = "team-lead"
    changed.append("default_agent = team-lead")

if changed:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print("  MERGE  opencode.json: " + "; ".join(changed) + f" (backup: {backup})")
else:
    print("  MERGE  opencode.json: already up to date")
PYEOF
  [ "$MERGE_OK" -eq 1 ] || say "MERGE  opencode.json FAILED — merge it manually (instructions += $CHARTER_NAME)"
fi
else
  say "SKIP  opencode.json exists and python3 is unavailable — add manually:"
  say "      instructions += $CHARTER_NAME"
fi

# ---------------------------------------------------------------- verify
echo
echo "Verification:"
if [ "$DRYRUN" -eq 0 ]; then
  n_agent=$(find "$TARGET/.opencode/agent" -name '*.md' 2>/dev/null | wc -l | tr -d ' ')
  n_cmd=$(find "$TARGET/.opencode/command" -name '*.md' 2>/dev/null | wc -l | tr -d ' ')
  n_skill=$(find "$TARGET/.opencode/skill" -name 'SKILL.md' 2>/dev/null | wc -l | tr -d ' ')
  n_plugin=$(find "$TARGET/.opencode/plugins" -name '*.js' 2>/dev/null | wc -l | tr -d ' ')
  echo "  agents:   $n_agent/12"
  echo "  commands: $n_cmd/4"
  echo "  skills:   $n_skill/10"
  echo "  plugins:  $n_plugin/1"
  [ "$n_agent" -ge 12 ] && [ "$n_cmd" -ge 4 ] && [ "$n_skill" -ge 10 ] && [ "$n_plugin" -ge 1 ] \
    || die "verification failed — expected file counts not reached"
  if command -v node >/dev/null 2>&1; then
    node --check "$TARGET/.opencode/plugins/team-tokens.js" \
      && echo "  plugin syntax: OK" || die "plugin syntax check failed"
  fi
  if [ -f "$TARGET_CFG" ] && command -v python3 >/dev/null 2>&1; then
    python3 -c "import json;json.load(open('$TARGET_CFG'))" \
      && echo "  opencode.json: valid JSON" || die "opencode.json is not valid JSON"
  fi
else
  echo "  (skipped in dry-run)"
fi

# ---------------------------------------------------------------- summary
echo
echo "Summary: copied=$COPIED skipped=$SKIPPED backups=$BACKUPS$([ "$BACKUPS" -gt 0 ] && echo " (in $BACKUP_DIR)")"
echo
echo "Next steps in $(basename "$TARGET"):"
echo "  1. Start opencode from the project directory."
echo "  2. Run /team-setup <project-slug> — assign models and create the workspace."
echo "  3. Restart opencode to apply the assigned models."
echo "  4. Hand the ToR to the team-lead."
[ "$DRYRUN" -eq 0 ] || true
