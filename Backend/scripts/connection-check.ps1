# Checks the buyer <-> fisherfolk link end to end. Start the server first, then run: npm run check:link
param([string]$Base = "http://localhost:4000/api")

$script:pass = 0
$script:fail = 0

function Api($method, $path, $body, $token) {
  $params = @{ Method = $method; Uri = "$Base$path"; ContentType = "application/json"; Headers = @{} }
  if ($token) { $params.Headers.Authorization = "Bearer $token" }
  if ($body) { $params.Body = ($body | ConvertTo-Json -Depth 6) }
  try { return @{ code = 200; data = (Invoke-RestMethod @params); err = $null } }
  catch {
    $status = 0
    if ($_.Exception.Response) { $status = [int]$_.Exception.Response.StatusCode }
    return @{ code = $status; data = $null; err = $_.ErrorDetails.Message }
  }
}
function Check($name, $ok) {
  if ($ok) { $script:pass++; "PASS  $name" } else { $script:fail++; "FAIL  $name" }
}
function Plain($secure) {
  [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
}
function Login($label) {
  $mobile = Read-Host "$label mobile"
  $secure = Read-Host "$label password" -AsSecureString
  return Api POST "/auth/login" @{ mobile = $mobile; password = (Plain $secure) }
}

if ((Api GET "/health").code -ne 200) { "The server is not running. Start it with npm run dev in Backend, then try again."; return }

$lf = Login "Fisherfolk"
if ($lf.code -ne 200) { "Fisherfolk login failed ($($lf.code)): $($lf.err)"; return }
$lb = Login "Buyer"
if ($lb.code -ne 200) { "Buyer login failed ($($lb.code)): $($lb.err)"; return }
$F = $lf.data.token; $B = $lb.data.token
$fid = $lf.data.user.id; $bid = $lb.data.user.id

$catches = @((Api GET "/catches?status=ACTIVE" $null $F).data)
if ($catches.Count -eq 0) { "The fisherfolk has no active catch. Log one in the app, then run this again."; return }

# the server refuses a second pending offer from the same fisherfolk to the same buyer on one catch (409),
# and a catch that already has an order cannot take any offer, so pick a catch with neither
$busy = @((Api GET "/offers/mine" $null $F).data) | Where-Object { $_.status -eq "PENDING" -and $_.buyerId -eq $bid } | ForEach-Object { $_.catchId }
$sold = @((Api GET "/orders/mine" $null $F).data) | Where-Object { $_.status -eq "CONFIRMED" -or $_.status -eq "COMPLETED" } | ForEach-Object { $_.catchId }
$c = $catches | Where-Object { $busy -notcontains $_.id -and $sold -notcontains $_.id } | Select-Object -First 1
if (-not $c) { "Every active catch already has a pending offer or an order. Finish or cancel them in the app, then run this again."; return }
$kg = [Math]::Min(1, [double]$c.kilos)
"Using the catch $($c.id) ($($c.kilos) kg)"

"--- need -> radar ---"
$need = Api POST "/needs" @{ speciesId = $c.species.id; kilos = 5; pricePerKg = 100 } $B
Check "buyer posts a need" ($need.code -eq 200 -or $need.code -eq 201)
if (-not $need.data.id) { "Stopping: code=$($need.code) $($need.err)"; return }
$m = Api GET "/needs/matches?catchId=$($c.id)" $null $F
Check "fisherfolk radar sees the buyer's need" (@($m.data).id -contains $need.data.id)

"--- offer -> buyer ---"
$o = Api POST "/offers" @{ catchId = $c.id; buyerId = $bid; needId = $need.data.id; kilos = $kg; pricePerKg = 100 } $F
Check "fisherfolk sends an offer" ($o.data.status -eq "PENDING")
if ($o.data.status -ne "PENDING") {
  "  server said: code=$($o.code) $($o.err)"
  "  need:  id=$($need.data.id) species=$($need.data.speciesId) status=$($need.data.status) buyer=$($need.data.buyerId)"
  "  catch: id=$($c.id) species=$($c.species.id)   buyer used in the offer: $bid"
  Api PATCH "/needs/$($need.data.id)/cancel" $null $B | Out-Null
  "Stopping. The test need was cancelled."
  return
}
$seen = @((Api GET "/offers/mine" $null $B).data) | Where-Object { $_.id -eq $o.data.id }
Check "buyer sees the same offer" ($null -ne $seen)
Check "kilos and price are identical on both sides" ($null -ne $seen -and $seen.kilos -eq $o.data.kilos -and $seen.pricePerKg -eq $o.data.pricePerKg)
Check "offer is from the right fisherfolk" ($null -ne $seen -and $seen.fisher.id -eq $fid)
Check "buyer has an unread notification" ((Api GET "/notifications" $null $B).data.unreadCount -ge 1)

"--- answer -> fisherfolk ---"
$d = Api PATCH "/offers/$($o.data.id)/decline" $null $B
Check "buyer declines" ($d.data.status -eq "DECLINED")
$back = @((Api GET "/offers/mine" $null $F).data) | Where-Object { $_.id -eq $o.data.id }
Check "fisherfolk sees DECLINED" ($null -ne $back -and $back.status -eq "DECLINED")
Check "fisherfolk has an unread notification" ((Api GET "/notifications" $null $F).data.unreadCount -ge 1)

"--- clean up ---"
Check "buyer cancels the test need" ((Api PATCH "/needs/$($need.data.id)/cancel" $null $B).data.status -eq "CANCELLED")

"==== $script:pass passed, $script:fail failed ===="