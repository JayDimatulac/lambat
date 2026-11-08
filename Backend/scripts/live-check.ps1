# Checks a deployed API and frontend from the outside. Run from Backend:  npm run live-check
param([string]$Api, [string]$App)
$script:pass = 0
$script:fail = 0
function Check($name, $ok, $hint) {
  if ($ok) { $script:pass++; "PASS  $name" }
  else { $script:fail++; "FAIL  $name"; if ($hint) { "      -> $hint" } }
}
function Get-Url($url, $headers) {
  try {
    $r = Invoke-WebRequest -Uri $url -Headers $headers -UseBasicParsing -TimeoutSec 120
    return @{ code = [int]$r.StatusCode; headers = $r.Headers; body = $r.Content }
  } catch {
    $c = 0
    $body = ""
    if ($_.Exception.Response) { $c = [int]$_.Exception.Response.StatusCode }
    if ($_.ErrorDetails -and $_.ErrorDetails.Message) { $body = $_.ErrorDetails.Message }
    elseif ($_.Exception.Response) {
      try { $body = (New-Object IO.StreamReader($_.Exception.Response.GetResponseStream())).ReadToEnd() } catch { }
    }
    return @{ code = $c; headers = @{}; body = $body }
  }
}

if (-not $Api) { $Api = Read-Host "API address (like https://lambat-api.onrender.com)" }
if (-not $App) { $App = Read-Host "Frontend address (like https://lambat-app.onrender.com)" }
$Api = $Api.Trim().TrimEnd('/')
if ($Api -notmatch '/api$') { $Api = "$Api/api" }
$App = $App.Trim().TrimEnd('/')

"--- API ---"
$sw = [Diagnostics.Stopwatch]::StartNew()
$h = Get-Url "$Api/health"
$sw.Stop()
Check "health answers (took $([math]::Round($sw.Elapsed.TotalSeconds, 1)) s; a sleeping free host needs about a minute)" ($h.code -eq 200 -and $h.body -match '"ok":\s*true') "open the service's Logs tab on Render"
if ($h.code -ne 200) { "The API is not answering, so the other checks are skipped."; exit 1 }

try { $sp = Invoke-RestMethod "$Api/species"; Check "11 species are in the production database" ($sp.Count -eq 11) "run: npm run prod:setup" }
catch { Check "species route answers" $false "check the database URLs in Render's settings" }

$allowed = Get-Url "$Api/health" @{ Origin = $App }
Check "the frontend address is allowed (CORS)" ([string]$allowed.headers['Access-Control-Allow-Origin'] -eq $App) "set CORS_ORIGINS on the API to exactly $App with no trailing slash, then redeploy the API"
$stranger = Get-Url "$Api/health" @{ Origin = "https://evil.example" }
Check "a stranger's address is not allowed" (-not $stranger.headers['Access-Control-Allow-Origin'])
Check "protected routes need a login (401)" ((Get-Url "$Api/auth/me").code -eq 401)
$nf = Get-Url "$Api/nope"
Check "an unknown address answers in JSON (404)" ($nf.code -eq 404 -and $nf.body -match '"error"')

$mobile = Read-Host "PRODUCTION admin mobile"
$sec = Read-Host "PRODUCTION admin password" -AsSecureString
$pw = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))
$role = ""
try {
  $r = Invoke-RestMethod -Method Post -Uri "$Api/auth/login" -ContentType "application/json" -Body (@{ mobile = $mobile; password = $pw } | ConvertTo-Json)
  $role = $r.user.role
} catch { }
$pw = $null
Check "the production admin can log in" ($role -eq "ADMIN") "use the admin you made with npm run prod:setup"

"--- frontend ---"
$index = Get-Url $App
Check "the frontend loads" ($index.code -eq 200 -and $index.body -match '<div id="root"') "check the app service's build log on Render"
Check "page addresses work after a refresh (/register)" ((Get-Url "$App/register").code -eq 200) "the rewrite rule in render.yaml is missing"
$js = [regex]::Match($index.body, 'src="(/assets/[^"]+\.js)"').Groups[1].Value
if ($js) {
  $bundle = Get-Url "$App$js"
  Check "the frontend is not pointing at localhost" (-not ($bundle.body -match 'localhost:4000')) "VITE_API_URL was missing when it was built: set it, then redeploy the app service"
  Check "the frontend points at this API" ($bundle.body.Contains($Api)) "VITE_API_URL must be exactly $Api"
}

"==== $script:pass passed, $script:fail failed ===="
"Next: npm run test:api -- -Base $Api   and then   npm run prod:cleanup"
if ($script:fail -gt 0) { exit 1 }