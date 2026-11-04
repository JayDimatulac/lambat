# Set up or clean the PRODUCTION database. Your local .env is never changed.
# The two URLs come from Backend\.env.production if it exists, otherwise from hidden prompts.
# Run from Backend:  npm run prod:setup   or   npm run prod:cleanup
param([ValidateSet("setup", "cleanup")][string]$Task = "setup")

function Plain($secure) {
  [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
}
function RefOf($url) { if ($url -match 'postgres\.([a-z0-9]+):') { $Matches[1] } else { "?" } }
function HostOf($url) { if ($url -match '@([^:/]+)') { $Matches[1] } else { "?" } }
function Stop-Here($msg) { Write-Host $msg -ForegroundColor Red; exit 1 }
function FromFile($name) {
  if (-not (Test-Path ".env.production")) { return $null }
  $l = Select-String -Path ".env.production" -Pattern "^\s*$name\s*=" | Select-Object -First 1
  if (-not $l) { return $null }
  return ($l.Line -replace "^\s*$name\s*=\s*", "").Trim().Trim('"')
}

$db = FromFile "DATABASE_URL"
$direct = FromFile "DIRECT_URL"
if (-not $db) { $db = Plain (Read-Host "PRODUCTION DATABASE_URL (the 6543 one)" -AsSecureString) }
if (-not $direct) { $direct = Plain (Read-Host "PRODUCTION DIRECT_URL (the 5432 one)" -AsSecureString) }

if (($db + $direct) -match 'YOUR-PASSWORD|YOUR-PROJECT|REGION|\[') { Stop-Here "A URL still contains a placeholder or brackets. Put the real password in." }
if ($db -notmatch ':6543/' -or $db -notmatch 'pgbouncer=true') { Stop-Here "DATABASE_URL must be the transaction pooler: port 6543 and ?pgbouncer=true" }
if ($direct -notmatch ':5432/') { Stop-Here "DIRECT_URL must be the session pooler: port 5432" }
if ((RefOf $db) -ne (RefOf $direct)) { Stop-Here "The two URLs point at different projects." }

# warn if this is the same project as the local .env
$localRef = "?"
if (Test-Path ".env") {
  $line = Select-String -Path ".env" -Pattern '^\s*DIRECT_URL\s*=' | Select-Object -First 1
  if ($line) { $localRef = RefOf $line.Line }
}
if ($localRef -ne "?" -and $localRef -eq (RefOf $direct)) {
  Write-Host "WARNING: this is the SAME Supabase project as your local .env, not a separate production one." -ForegroundColor Yellow
}

"Target project: $(RefOf $direct)  on  $(HostOf $direct)"
if ((Read-Host "Type yes to continue") -ne "yes") { "Cancelled."; exit 0 }

# these override anything in .env for this run only
$env:DATABASE_URL = $db
$env:DIRECT_URL = $direct

if ($Task -eq "setup") {
  "--- applying migrations ---"
  npx prisma migrate deploy
  if ($LASTEXITCODE -ne 0) { Stop-Here "Migrations failed. Nothing else was run." }

  "--- seeding species ---"
  npx ts-node prisma\seed.ts
  if ($LASTEXITCODE -ne 0) { Stop-Here "Seeding failed." }

  if ((Read-Host "Create the production admin now? (yes/no)") -eq "yes") {
    $mobile = Read-Host "Admin mobile (09XXXXXXXXX)"
    $name = Read-Host "Admin name"
    $pw = Plain (Read-Host "Admin password, 8+ characters, NOT the one you use locally" -AsSecureString)
    npx ts-node prisma\create-admin.ts $mobile $name $pw
  }

  $lines = 0
  if (Test-Path "prisma\pathways.csv") { $lines = @(Get-Content "prisma\pathways.csv").Count }
  if ($lines -gt 1 -and (Read-Host "Import $($lines - 1) pathway rows from pathways.csv? (yes/no)") -eq "yes") {
    npx ts-node prisma\import-pathways.ts
  }
  "Setup finished."
} else {
  "--- dry run, nothing is deleted yet ---"
  npx ts-node prisma\cleanup-test-data.ts
  if ((Read-Host "Delete exactly what is listed above? (yes/no)") -eq "yes") {
    npx ts-node prisma\cleanup-test-data.ts --yes
  }
}