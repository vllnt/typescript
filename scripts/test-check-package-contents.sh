#!/usr/bin/env bash
#
# test-check-package-contents.sh — success and failure paths of
# check-package-contents.sh in a throwaway package. Fixtures are assembled
# from fragments so this file never matches a tree denylist.

set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO="$(mktemp -d)"
trap 'rm -rf "$REPO"' EXIT

mkdir -p "$REPO/scripts" "$REPO/dist"
cp "$ROOT/scripts/privacy-denylist.sh" "$ROOT/scripts/check-package-contents.sh" "$REPO/scripts/"
cp "$ROOT/.privacy-denylist" "$ROOT/.privacy-allowlist" "$REPO/"
chmod +x "$REPO/scripts/"*.sh

git -C "$REPO" init -q
git -C "$REPO" config user.email test@example.invalid
git -C "$REPO" config user.name test
git -C "$REPO" config commit.gpgsign false

failures=0
LAST_OUTPUT=""
LAST_STATUS=0

write_pkg() {
  printf '%s\n' "$1" > "$REPO/package.json"
}

plant_readme() {
  printf 'Hello.\n' > "$REPO/README.md"
  printf 'MIT\n' > "$REPO/LICENSE"
  printf 'export {}\n' > "$REPO/dist/index.js"
}

commit_tree() {
  git -C "$REPO" add -A
  git -C "$REPO" commit -q --allow-empty -m "fixture"
}

run() {
  local name="$1" expected="$2"
  shift 2
  LAST_OUTPUT="$(cd "$REPO" && bash scripts/check-package-contents.sh "$@" 2>&1)"
  LAST_STATUS=$?
  if [[ "$LAST_STATUS" != "$expected" ]]; then
    printf 'FAIL %s: expected exit %s, got %s\n%s\n' "$name" "$expected" "$LAST_STATUS" "$LAST_OUTPUT" >&2
    failures=$((failures + 1))
    return
  fi
  printf 'OK    %s\n' "$name"
}

refute() {
  if grep -qF -- "$2" <<< "$LAST_OUTPUT"; then
    printf 'FAIL %s\n' "$1" >&2
    failures=$((failures + 1))
  fi
}

plant_readme
write_pkg '{"name":"fixture-pack","version":"1.0.0","files":["dist"]}'
commit_tree
run "clean dist package passes" 0

write_pkg '{"name":"fixture-pack","version":"1.0.0","files":["dist"]}'
printf 'oops\n' > "$REPO/notes.txt"
# notes.txt is not in files, npm should not pack it; still passes
commit_tree
run "unlisted notes.txt is not packed" 0

# No files field: npm packs more, notes.txt becomes EXTRA
rm -f "$REPO/notes.txt"
write_pkg '{"name":"fixture-pack","version":"1.0.0"}'
printf 'oops\n' > "$REPO/notes.txt"
commit_tree
run "unallowlisted path in default pack fails" 1
grep -q 'EXTRA notes.txt' <<< "$LAST_OUTPUT" || { echo "FAIL extra path not reported" >&2; failures=$((failures + 1)); }

# Test file packed despite files field
rm -f "$REPO/notes.txt"
mkdir -p "$REPO/src"
printf 'export {}\n' > "$REPO/src/index.ts"
printf 'test()\n' > "$REPO/src/index.test.ts"
write_pkg '{"name":"fixture-pack","version":"1.0.0","files":["dist","src"]}'
commit_tree
run "packed test file is denied" 1
grep -q 'DENY  src/index.test.ts' <<< "$LAST_OUTPUT" || { echo "FAIL test path not denied" >&2; failures=$((failures + 1)); }

# ESM and CommonJS TypeScript test and spec files are denied too
for test_file in index.spec.mts index.spec.cts index.test.mts index.test.cts; do
  rm -rf "$REPO/src"
  mkdir -p "$REPO/src"
  printf 'export {}\n' > "$REPO/src/index.ts"
  printf 'test()\n' > "$REPO/src/$test_file"
  commit_tree
  run "packed $test_file is denied" 1
  grep -q "DENY  src/$test_file" <<< "$LAST_OUTPUT" || { echo "FAIL src/$test_file not denied" >&2; failures=$((failures + 1)); }
done

# Denylist hit inside dist
rm -rf "$REPO/src"
write_pkg '{"name":"fixture-pack","version":"1.0.0","files":["dist"]}'
# Fixture assembled from fragments
printf '%s\n' "host: box.example-net.ts"".net" > "$REPO/dist/index.js"
commit_tree
run "denylist hit in packed dist fails" 1
refute "matched hostname leaked to pack-check output" "example-net"
grep -q 'packed tarball failed the privacy denylist' <<< "$LAST_OUTPUT" || { echo "FAIL denylist failure not reported" >&2; failures=$((failures + 1)); }

# Restore a clean dist and confirm example.com emails in README are allowed
printf 'export {}\n' > "$REPO/dist/index.js"
printf 'Contact admin@example.com\n' > "$REPO/README.md"
commit_tree
run "reserved example.com email in packed README passes" 0

# Required paths must be packed
printf 'Hello.\n' > "$REPO/README.md"
printf '%s\n' '# required' 'README.md' 'dist/index.js' > "$REPO/.package-contents-required"
commit_tree
run "required paths present passes" 0

write_pkg '{"name":"fixture-pack","version":"1.0.0","files":["src"]}'
mkdir -p "$REPO/src"
printf 'export {}\n' > "$REPO/src/index.js"
commit_tree
run "required path missing from files fails" 1
grep -q 'MISSING dist/index.js' <<< "$LAST_OUTPUT" || { echo "FAIL missing required path not reported" >&2; failures=$((failures + 1)); }
refute "present required path reported missing" "MISSING README.md"
rm -rf "$REPO/src"
write_pkg '{"name":"fixture-pack","version":"1.0.0","files":["dist"]}'
commit_tree

# A package below the repository root is checked against its own required
# list only; the root list (README.md, dist/index.js) does not apply to it.
SUB="$REPO/packages/sub"
mkdir -p "$SUB/lib"
printf '%s\n' '{"name":"fixture-sub","version":"1.0.0","files":["lib"]}' > "$SUB/package.json"
printf 'export {}\n' > "$SUB/lib/index.js"
printf '%s\n' 'lib/index.js' > "$SUB/.package-contents-required"
commit_tree
run "nested package uses only its own required list" 0 packages/sub
refute "root required list applied to nested package" "MISSING dist/index.js"
printf '%s\n' 'lib/index.js' 'lib/types.d.ts' > "$SUB/.package-contents-required"
commit_tree
run "nested package missing its own required path fails" 1 packages/sub
grep -q 'MISSING lib/types.d.ts' <<< "$LAST_OUTPUT" || { echo "FAIL nested missing required path not reported" >&2; failures=$((failures + 1)); }
rm -rf "$REPO/packages"
commit_tree

# npm 12 prints pack --json as an object keyed by package name
SHIM="$(mktemp -d)"
trap 'rm -rf "$REPO" "$SHIM"' EXIT
REAL_NPM="$(command -v npm)"
cat > "$SHIM/npm" <<SH
#!/usr/bin/env bash
if [[ " \$* " == *" --dry-run "* && " \$* " == *" --json "* ]]; then
  "$REAL_NPM" "\$@" | node -e 'let s="";process.stdin.on("data",c=>s+=c).on("end",()=>{const o={};for(const p of JSON.parse(s))o[p.name]=p;console.log(JSON.stringify(o))})'
else
  exec "$REAL_NPM" "\$@"
fi
SH
chmod +x "$SHIM/npm"
LAST_OUTPUT="$(cd "$REPO" && PATH="$SHIM:$PATH" bash scripts/check-package-contents.sh 2>&1)"
if [[ $? -eq 0 ]] && grep -q 'OK    package contents: 4 file' <<< "$LAST_OUTPUT"; then
  echo "OK    npm 12 object-shaped pack output passes"
else
  printf 'FAIL npm 12 object-shaped pack output\n%s\n' "$LAST_OUTPUT" >&2
  failures=$((failures + 1))
fi

if [[ "$failures" -ne 0 ]]; then
  echo "FAILED $failures test-check-package-contents case(s)" >&2
  exit 1
fi
echo "OK    test-check-package-contents.sh"
exit 0
