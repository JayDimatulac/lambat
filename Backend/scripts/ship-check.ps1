# Gate before a deploy: is the repository in the state the host will build?
# Run from Backend:  npm run ship-check
$script:pass = 0
$script:fail = 0
function Check($name, $ok, $hint) {
  if ($ok) { $script:pass++; "PASS  $name" }
  else { $script:fail++; "FAIL  $name"; if ($hint) { "      -> $hint" } }
}

$root = git rev-parse --show-toplevel 2>$null
if (-not $root) { "Run this inside the lambat repository."; exit 1 }
Push-Location $root
git fetch origin 2>$null | Out-Null

"--- branch and push state ---"
$branch = git branch --show-current
Check "on the main branch" ($branch -eq "main") "git checkout main, then git pull"
$dirty = @(git status --short | Where-Object { $_ -notmatch 'pathways\.csv' })
Check "nothing uncommitted (pathways.csv is ignored here)" ($dirty.Count -eq 0) "commit or discard what is listed below"
$dirty | ForEach-Object { "      $_" }
Check "everything is pushed" ((git rev-list --count origin/main..HEAD) -eq "0") "git push"
Check "nothing newer on GitHub" ((git rev-list --count HEAD..origin/main) -eq "0") "git pull"

"--- what the host will read ---"
Check "render.yaml is at the repo root" (Test-Path "render.yaml") "create it at the root, next to Backend and frontend"
Check "render.yaml is on GitHub's main" ((git ls-tree --name-only origin/main) -ccontains "render.yaml") "git add render.yaml, commit, push"
Check "the folder is called Backend with a capital B on GitHub" ((git ls-tree --name-only origin/main) -ccontains "Backend") "rename it, the host is case-sensitive"
$yaml = ""
if (Test-Path "render.yaml") { $yaml = Get-Content "render.yaml" -Raw }
Check "API service uses rootDir Backend" ($yaml -cmatch 'rootDir:\s*Backend')
Check "frontend service uses rootDir frontend" ($yaml -cmatch 'rootDir:\s*frontend')
Check "the API is on the free plan" ($yaml -match 'plan:\s*free')
Check "migrations run in the build, start is npm start" ($yaml -match 'prisma migrate deploy' -and $yaml -match 'startCommand:\s*npm start')
Check "old root app files are gone" (-not (git ls-files | Select-String '^(src/|public/|index\.html$|package\.json$|vite\.config\.ts$)')) "git rm them"

"--- secrets ---"
$envTracked = @(git ls-files | Where-Object { $_ -match '(^|/)\.env' -and $_ -notmatch '\.env\.example$' })
Check "no .env file is tracked" ($envTracked.Count -eq 0) "git rm --cached the file, then rotate what was in it"
$keyPattern = 'AIza[0-9A-Za-z_-]{30,}|AQ\.Ab[0-9A-Za-z_-]{20,}'
Check "no API key in tracked files" (-not (git grep -n -I -E $keyPattern 2>$null)) "remove it, then rotate the key"
$conn = @(git grep -n -I -E 'postgres(ql)?://postgres\.[a-z0-9]+:[^@ ]+@' 2>$null | Where-Object { $_ -notmatch 'YOUR-PASSWORD|PASSWORD@|PROJECTREF' })
Check "no database password in tracked files" ($conn.Count -eq 0) "remove it, then reset that database password"
Check "no API key in git history" (-not (git log --all --oneline -G $keyPattern 2>$null)) "a key was committed once: rotate it"
if (Test-Path "Backend\.env.production") { "INFO  Backend\.env.production still exists: delete it once the URLs are pasted into Render" }

Pop-Location
"==== $script:pass passed, $script:fail failed ===="
if ($script:fail -gt 0) { exit 1 }