# Pre-flight check before a commit or a deploy. Run from Backend: npm run preflight
$script:pass = 0
$script:fail = 0
function Check($name, $ok, $hint) {
  if ($ok) { $script:pass++; "PASS  $name" }
  else { $script:fail++; "FAIL  $name"; if ($hint) { "      -> $hint" } }
}

$root = (git rev-parse --show-toplevel 2>$null)
if (-not $root) { "Run this inside the lambat repository."; exit 1 }

"--- environment (names only, values are never printed) ---"
$envFile = Join-Path (Get-Location).Path ".env"
Check ".env exists in Backend" (Test-Path $envFile) "copy .env.example to .env and fill it in"
$vars = @{}
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$') { $vars[$Matches[1]] = $Matches[2].Trim().Trim('"') }
  }
}
foreach ($n in "DATABASE_URL", "DIRECT_URL", "JWT_SECRET") {
  Check "$n is set" ($vars.ContainsKey($n) -and $vars[$n] -ne "") "add it to Backend\.env"
}
Check "JWT_SECRET is at least 32 characters" ($vars.ContainsKey("JWT_SECRET") -and $vars["JWT_SECRET"].Length -ge 32) "generate one: node -e ""console.log(require('crypto').randomBytes(48).toString('hex'))"""
Check "DATABASE_URL is the pooler on port 6543" ($vars.ContainsKey("DATABASE_URL") -and $vars["DATABASE_URL"] -match ':6543/' -and $vars["DATABASE_URL"] -match 'pgbouncer=true') "use the Transaction pooler string from Supabase, with ?pgbouncer=true"
Check "DIRECT_URL is the session pooler on port 5432" ($vars.ContainsKey("DIRECT_URL") -and $vars["DIRECT_URL"] -match ':5432/') "use the Session pooler string from Supabase"
Check "database URLs do not contain a placeholder" (-not (($vars["DATABASE_URL"] + $vars["DIRECT_URL"]) -match 'YOUR-PASSWORD|YOUR-PROJECT|REGION')) "replace the placeholders with your real values"
if ($vars.ContainsKey("LLM_API_KEY") -and $vars["LLM_API_KEY"] -ne "") {
  Check "LLM_BASE_URL and LLM_MODEL are set (key is set)" ($vars.ContainsKey("LLM_BASE_URL") -and $vars["LLM_BASE_URL"] -ne "" -and $vars.ContainsKey("LLM_MODEL") -and $vars["LLM_MODEL"] -ne "") "set both, or empty the key to use template text"
} else {
  "INFO  LLM_API_KEY is empty: explanations will use the template text"
}

"--- git and secrets ---"
git check-ignore -q ".env" 2>$null | Out-Null
Check ".env is ignored by git" ($LASTEXITCODE -eq 0) "add .env to Backend\.gitignore"
$everCommitted = git -C $root log --all --oneline -- "Backend/.env" 2>$null
Check ".env was never committed" (-not $everCommitted) "rotate every secret in it, then ask me how to clean the history"
$keyPattern = 'AIza[0-9A-Za-z_-]{30,}|AQ\.Ab[0-9A-Za-z_-]{20,}'
$inFiles = git -C $root grep -n -I -E $keyPattern 2>$null
Check "no API key in tracked files" (-not $inFiles) "remove it from the file named below, then rotate the key"
if ($inFiles) { $inFiles | ForEach-Object { "      $($_.Split(':')[0]):$($_.Split(':')[1])" } }
$inHistory = git -C $root log --all --oneline -G $keyPattern 2>$null
Check "no API key in git history" (-not $inHistory) "a key was committed at some point: rotate it"
$example = Get-Content (Join-Path (Get-Location).Path ".env.example") -Raw -ErrorAction SilentlyContinue
Check ".env.example holds placeholders only" ($example -and $example -match 'YOUR-PASSWORD' -and $example -notmatch $keyPattern) "overwrite .env.example with the placeholder version"
$dirty = git status --short -- . 2>$null
Check "no uncommitted changes in Backend" (-not $dirty) "commit them, or ignore this line before a deploy only if intended"
if ($dirty) { $dirty | ForEach-Object { "      $_" } }

"--- code and database ---"
$tsc = npx tsc -p tsconfig.build.json --noEmit 2>&1 | Out-String
Check "TypeScript compiles" ($LASTEXITCODE -eq 0) "paste the errors below to me"
if ($LASTEXITCODE -ne 0) { ($tsc -split "`n" | Select-Object -First 8) | ForEach-Object { "      $_" } }
$mig = npx prisma migrate status 2>&1 | Out-String
Check "database schema is up to date, no pending migration" ($mig -match 'Database schema is up to date') "run: npx prisma migrate deploy"
"--- project pieces ---"
function Has($file, $pattern) { (Test-Path $file) -and [bool](Select-String -Path $file -Pattern $pattern -Quiet) }
Check "live account check in the middleware" (Has "src\middleware\auth.ts" "passwordChangedAt")
Check "change-password route" (Has "src\routes\auth.ts" "change-password")
Check "admin password reset route" (Has "src\routes\admin.ts" "users/:id/password")
Check "admin moderation routes" (Has "src\routes\admin.ts" "needs/:id/cancel")
Check "risk notices in notifications" (Has "src\routes\notifications.ts" "raiseRiskNotices")
Check "account security checks in the regression test" (Has "scripts\regression.ps1" "account security")
Check "admin moderation checks in the regression test" (Has "scripts\regression.ps1" "admin moderation")
Check "README exists" (Test-Path "README.md")
Check "pathway importer has check mode" (Has "prisma\import-pathways.ts" "--check")
Check "production setup script exists" (Test-Path "scripts\prod-setup.ps1")
$csvLines = 0
if (Test-Path "prisma\pathways.csv") { $csvLines = @(Get-Content "prisma\pathways.csv").Count }
if ($csvLines -gt 1) { "INFO  pathways.csv has $($csvLines - 1) data rows" } else { "INFO  pathways.csv is empty or missing: the app will say there is no pathway yet" }
"--- running server (optional) ---"
try {
  $h = Invoke-RestMethod "http://localhost:4000/api/health" -TimeoutSec 3
  Check "server answers on port 4000" ($h.ok -eq $true)
} catch {
  "SKIP  server is not running (start it with npm run dev to include this check)"
}

"==== $script:pass passed, $script:fail failed ===="
if ($script:fail -gt 0) { exit 1 }