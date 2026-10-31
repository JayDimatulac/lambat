# Full API regression test. Start the server first, then run: npm run test:api
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
function Ago($h) { (Get-Date).ToUniversalTime().AddHours(-$h).ToString("o") }
function Ensure-User($body) {
  $r = Api POST "/auth/register" $body
  if ($r.code -eq 409) { $r = Api POST "/auth/login" @{ mobile = $body.mobile; password = $body.password } }
  return $r
}

function Run-Tests {
  if ((Api GET "/health").code -ne 200) { "The server is not running. Start it with npm run dev in Backend, then try again."; return }

  $la = Api POST "/auth/login" @{ mobile = (Read-Host "Admin mobile"); password = (Read-Host "Admin password") }
  if ($la.code -ne 200 -or $la.data.user.role -ne "ADMIN") { "Admin login failed ($($la.code)): $($la.err)"; return }
  $A = $la.data.token

  "--- basics ---"
  $all = (Api GET "/species").data
  $sk = $all | Where-Object { $_.code -eq "skipjack" }
  $other = $all | Where-Object { $_.code -eq "other" }
  Check "11 species, skipjack 192 h histamine, Other 120 h" (@($all).Count -eq 11 -and $sk.l0Min -eq 192 -and $sk.histamine -eq $true -and $other.l0Min -eq 120)
  if (-not $sk -or -not $other) { "Stopping: run npx ts-node prisma\seed.ts first"; return }

  "--- auth ---"
  $fisher = Ensure-User @{ role = "FISHERFOLK"; name = "Reg Fisher"; mobile = "09170000021"; barangay = "Balayan"; password = "password123" }
  $buyer = Ensure-User @{ role = "BUYER"; name = "Reg Buyer"; mobile = "09170000022"; barangay = "Balayan"; password = "password123"; businessName = "Reg Stall"; buyerType = "market" }
  Check "test accounts ready" ($fisher.code -eq 200 -and $buyer.code -eq 200)
  if ($fisher.code -ne 200 -or $buyer.code -ne 200) { "Cannot continue without both test accounts: $($fisher.err) $($buyer.err)"; return }
  $F = $fisher.data.token; $B = $buyer.data.token; $bid = $buyer.data.user.id
  Check "wrong password gives 401" ((Api POST "/auth/login" @{ mobile = "09170000021"; password = "wrongpass1" }).code -eq 401)
  Check "duplicate register gives 409" ((Api POST "/auth/register" @{ role = "FISHERFOLK"; name = "Reg Fisher"; mobile = "09170000021"; barangay = "Balayan"; password = "password123" }).code -eq 409)
  Check "register as ADMIN refused (400)" ((Api POST "/auth/register" @{ role = "ADMIN"; name = "Sneaky"; mobile = "09170000099"; barangay = "x"; password = "password123" }).code -eq 400)
  Check "short password refused (400)" ((Api POST "/auth/register" @{ role = "FISHERFOLK"; name = "Short Pw"; mobile = "09170000098"; barangay = "x"; password = "short" }).code -eq 400)
  Check "/me without token gives 401" ((Api GET "/auth/me").code -eq 401)
  Check "/me with token" ((Api GET "/auth/me" $null $F).data.user.mobile -eq "09170000021")

  "--- buyer approval ---"
  if ($buyer.data.user.status -eq "PENDING") {
    Check "pending buyer cannot post a need (403)" ((Api POST "/needs" @{ speciesId = $sk.id; kilos = 5 } $B).code -eq 403)
  }
  Check "fisherfolk cannot approve (403)" ((Api PATCH "/admin/users/$bid/status" @{ status = "ACTIVE" } $F).code -eq 403)
  Check "admin approves the buyer" ((Api PATCH "/admin/users/$bid/status" @{ status = "ACTIVE" } $A).data.status -eq "ACTIVE")
  Check "admin lists buyers" ((@((Api GET "/admin/users?role=BUYER" $null $A).data).mobile) -contains "09170000022")
  Check "admin stats" ((Api GET "/admin/stats" $null $A).code -eq 200)
  Check "fisherfolk blocked from admin (403)" ((Api GET "/admin/stats" $null $F).code -eq 403)

  "--- catches and engine ---"
  $c1 = Api POST "/catches" @{ speciesId = $sk.id; kilos = 10; iceKg = 20; place = "Balayan"; caughtAt = (Ago 3) } $F
  Check "catch logged, LOW with plenty of ice, placeholder flagged" ($c1.code -eq 200 -and $c1.data.assessment.risk -eq "low" -and $c1.data.assessment.placeholder -eq $true)
  Check "place saved" ($c1.code -eq 200 -and $c1.data.place -eq "Balayan")
  Check "bad kilos refused (400)" ((Api POST "/catches" @{ speciesId = $sk.id; kilos = -1 } $F).code -eq 400)
  Check "buyer cannot log a catch (403)" ((Api POST "/catches" @{ speciesId = $sk.id; kilos = 5 } $B).code -eq 403)
  Check "catch in my list" ((@((Api GET "/catches" $null $F).data).id) -contains $c1.data.id)
  Check "buyer cannot read it (404)" ((Api GET "/catches/$($c1.data.id)" $null $B).code -eq 404)
  $c2 = Api POST "/catches" @{ speciesId = $sk.id; kilos = 10; caughtAt = (Ago 25) } $F
  Check "25 h old, no ice: critical, 0 h left" ($c2.code -eq 200 -and $c2.data.assessment.risk -eq "critical" -and $c2.data.assessment.hoursMin -eq 0)
  $ice = Api POST "/catches/$($c2.data.id)/ice" @{ kg = 500 } $F
  Check "adding ice is recorded (2 events)" ($ice.code -eq 200 -and @($ice.data.iceEvents).Count -eq 2)
  Check "negative ice refused (400)" ((Api POST "/catches/$($c2.data.id)/ice" @{ kg = -5 } $F).code -eq 400)

  "--- catch closure and reopen (Other species) ---"
  $co = Api POST "/catches" @{ speciesId = $other.id; kilos = 5; iceKg = 0; caughtAt = (Ago 1) } $F
  Check "catch of Other species works" ($co.code -eq 200 -and $null -ne $co.data.assessment.risk)
  $out = Api PATCH "/catches/$($co.data.id)/outcome" @{ status = "REDISTRIBUTED" } $F
  Check "outcome stores closedAt and closedRisk" ($out.code -eq 200 -and $out.data.status -eq "REDISTRIBUTED" -and [bool]$out.data.closedAt -and [bool]$out.data.closedRisk)
  Check "buyer cannot reopen (403)" ((Api PATCH "/catches/$($co.data.id)/reopen" $null $B).code -eq 403)
  $re = Api PATCH "/catches/$($co.data.id)/reopen" $null $F
  Check "reopen makes it ACTIVE and clears closure" ($re.code -eq 200 -and $re.data.status -eq "ACTIVE" -and $null -eq $re.data.closedAt -and $null -eq $re.data.closedRisk)
  Check "reopen an active catch refused (409)" ((Api PATCH "/catches/$($co.data.id)/reopen" $null $F).code -eq 409)

  "--- pathways route ---"
  $p1 = Api GET "/catches/$($c1.data.id)/pathways" $null $F
  Check "low catch: pathways answer with label and disclaimer" ($p1.code -eq 200 -and $p1.data.risk -eq "low" -and $p1.data.label -eq "Potential value-added pathway" -and [bool]$p1.data.disclaimer)
  $c4 = Api POST "/catches" @{ speciesId = $sk.id; kilos = 10; caughtAt = (Ago 30) } $F
  $p4 = Api GET "/catches/$($c4.data.id)/pathways" $null $F
  Check "critical catch gets no pathways" ($p4.code -eq 200 -and $p4.data.risk -eq "critical" -and @($p4.data.pathways).Count -eq 0)
  Api PATCH "/catches/$($c4.data.id)/outcome" @{ status = "DISCARDED" } $F | Out-Null
  Check "second outcome refused (409)" ((Api PATCH "/catches/$($c4.data.id)/outcome" @{ status = "SOLD" } $F).code -eq 409)
  Check "closed catch has no assessment" ($null -eq (Api GET "/catches/$($c4.data.id)" $null $F).data.assessment)

  "--- advisories and notifications ---"
  $adv = Api POST "/advisories" @{ title = "Regression test advisory"; body = "Test only."; severity = "WARNING"; audience = "FISHERFOLK" } $A
  Check "admin posts an advisory" ($adv.code -eq 200 -and $adv.data.notified -ge 1)
  Check "fisherfolk cannot post (403)" ((Api POST "/advisories" @{ title = "x"; body = "y" } $F).code -eq 403)
  Check "bad severity refused (400)" ((Api POST "/advisories" @{ title = "x"; body = "y"; severity = "HUGE" } $A).code -eq 400)
  if ($adv.code -eq 200) {
    Check "fisherfolk sees the advisory" ((@((Api GET "/advisories" $null $F).data).id) -contains $adv.data.id)
    Check "buyer does not see a fisherfolk-only advisory" (-not ((@((Api GET "/advisories" $null $B).data).id) -contains $adv.data.id))
    Check "fisherfolk got a notification" ((Api GET "/notifications" $null $F).data.unreadCount -ge 1)
    Check "mark all read, unread is 0" ((Api POST "/notifications/read-all" $null $F).code -eq 200 -and (Api GET "/notifications" $null $F).data.unreadCount -eq 0)
    Check "admin switches it off" ((Api PATCH "/advisories/$($adv.data.id)/deactivate" $null $A).data.active -eq $false)
    Check "switched-off advisory is hidden" (-not ((@((Api GET "/advisories" $null $F).data).id) -contains $adv.data.id))
  }

  "--- marketplace ---"
  $need = Api POST "/needs" @{ speciesId = $sk.id; kilos = 10; pricePerKg = 180 } $B
  Check "buyer posts a need" ($need.code -eq 200 -and $need.data.status -eq "OPEN")
  Check "fisherfolk cannot post a need (403)" ((Api POST "/needs" @{ speciesId = $sk.id; kilos = 10 } $F).code -eq 403)
  Check "bad need kilos refused (400)" ((Api POST "/needs" @{ speciesId = $sk.id; kilos = -3 } $B).code -eq 400)
  $m = Api GET "/needs/matches?catchId=$($c1.data.id)" $null $F
  Check "matches include the need" ($need.code -eq 200 -and $m.code -eq 200 -and (@($m.data).id -contains $need.data.id))
  Check "buyer mobile not exposed" ($m.code -eq 200 -and @($m.data).Count -ge 1 -and -not (@($m.data)[0].buyer.PSObject.Properties.Name -contains "mobile"))
  Check "kilos above the catch refused (400)" ((Api POST "/offers" @{ catchId = $c1.data.id; buyerId = $bid; kilos = 999; pricePerKg = 170 } $F).code -eq 400)
  $o = Api POST "/offers" @{ catchId = $c1.data.id; buyerId = $bid; kilos = 10; pricePerKg = 175; needId = $need.data.id } $F
  Check "fisherfolk sends an offer" ($o.code -eq 200 -and $o.data.status -eq "PENDING")
  Check "duplicate offer refused (409)" ((Api POST "/offers" @{ catchId = $c1.data.id; buyerId = $bid; kilos = 10; pricePerKg = 175 } $F).code -eq 409)
  $mine = @((Api GET "/offers/mine" $null $B).data) | Where-Object { $_.id -eq $o.data.id }
  Check "buyer sees the offer with freshness" ($o.code -eq 200 -and $null -ne $mine -and $mine.catch.assessment.risk -eq "low")
  Check "fisherfolk cannot accept (403)" ((Api PATCH "/offers/$($o.data.id)/accept" $null $F).code -eq 403)
  $acc = Api PATCH "/offers/$($o.data.id)/accept" $null $B
  Check "buyer accepts, order CONFIRMED" ($acc.code -eq 200 -and $acc.data.status -eq "CONFIRMED")
  Check "second accept refused (409)" ((Api PATCH "/offers/$($o.data.id)/accept" $null $B).code -eq 409)
  Check "new offer on a catch with an order refused (409)" ((Api POST "/offers" @{ catchId = $c1.data.id; buyerId = $bid; kilos = 5; pricePerKg = 170 } $F).code -eq 409)
  Check "both sides see the order" ($acc.code -eq 200 -and (@((Api GET "/orders/mine" $null $F).data).id -contains $acc.data.id) -and (@((Api GET "/orders/mine" $null $B).data).id -contains $acc.data.id))
  $nd = @((Api GET "/needs/mine" $null $B).data) | Where-Object { $_.id -eq $need.data.id }
  Check "need is FULFILLED" ($null -ne $nd -and $nd.status -eq "FULFILLED")
  Check "buyer cannot complete (403)" ((Api PATCH "/orders/$($acc.data.id)/complete" $null $B).code -eq 403)
  Check "seller completes the order" ((Api PATCH "/orders/$($acc.data.id)/complete" $null $F).data.status -eq "COMPLETED")
  $sold = Api GET "/catches/$($c1.data.id)" $null $F
  Check "catch is SOLD with closedAt" ($sold.code -eq 200 -and $sold.data.status -eq "SOLD" -and [bool]$sold.data.closedAt)
  Check "sold-by-order catch cannot be reopened (409)" ((Api PATCH "/catches/$($c1.data.id)/reopen" $null $F).code -eq 409)
  $c5 = Api POST "/catches" @{ speciesId = $sk.id; kilos = 8; iceKg = 10 } $F
  $o2 = Api POST "/offers" @{ catchId = $c5.data.id; buyerId = $bid; kilos = 8; pricePerKg = 160 } $F
  Check "buyer declines" ((Api PATCH "/offers/$($o2.data.id)/decline" $null $B).data.status -eq "DECLINED")
  $o3 = Api POST "/offers" @{ catchId = $c5.data.id; buyerId = $bid; kilos = 8; pricePerKg = 160 } $F
  Check "seller withdraws" ((Api PATCH "/offers/$($o3.data.id)/withdraw" $null $F).data.status -eq "WITHDRAWN")

  "--- AI explanation ---"
  $ce = Api POST "/catches" @{ speciesId = $sk.id; kilos = 10; iceKg = 0; caughtAt = (Ago 3) } $F
  $en = Api POST "/catches/$($ce.data.id)/explain" @{ lang = "en" } $F
  Check "English explanation answers (source: $($en.data.source))" ($en.code -eq 200 -and [bool]$en.data.text -and $en.data.source -in "ai", "template" -and [bool]$en.data.disclaimer)
  $fil = Api POST "/catches/$($ce.data.id)/explain" @{ lang = "fil" } $F
  Check "Filipino explanation answers and differs" ($fil.code -eq 200 -and $fil.data.lang -eq "fil" -and $fil.data.text -ne $en.data.text)
  Check "buyer cannot ask (403)" ((Api POST "/catches/$($ce.data.id)/explain" @{ lang = "en" } $B).code -eq 403)
  Check "unknown catch gives 404" ((Api POST "/catches/nope/explain" @{ lang = "en" } $F).code -eq 404)
  Api PATCH "/catches/$($ce.data.id)/outcome" @{ status = "DISCARDED" } $F | Out-Null
  Check "closed catch refused (409)" ((Api POST "/catches/$($ce.data.id)/explain" @{ lang = "en" } $F).code -eq 409)

  "--- weather ---"
  $w = Api GET "/weather" $null $F
  if ($w.code -eq 200) { Check "weather: 7 forecast days" (@($w.data.daily.time).Count -eq 7) }
  elseif ($w.code -eq 503) { "SKIP  weather: Open-Meteo not reachable from here" }
  else { Check "weather answers" $false }
  Check "weather needs login (401)" ((Api GET "/weather").code -eq 401)

  "--- risk notices ---"
  $cr = Api POST "/catches" @{ speciesId = $sk.id; kilos = 7; caughtAt = (Ago 26) } $F
  $n1 = Api GET "/notifications" $null $F
  $mine1 = @($n1.data.items) | Where-Object { $_.type -eq "HIGH_RISK" -and $_.catchId -eq $cr.data.id }
  Check "critical catch raises one HIGH_RISK notice" ($cr.code -eq 200 -and @($mine1).Count -eq 1)
  $n2 = Api GET "/notifications" $null $F
  $mine2 = @($n2.data.items) | Where-Object { $_.type -eq "HIGH_RISK" -and $_.catchId -eq $cr.data.id }
  Check "reading again does not duplicate it" (@($mine2).Count -eq 1)
  Check "buyer gets no risk notices" (-not (@((Api GET "/notifications" $null $B).data.items) | Where-Object { $_.type -eq "HIGH_RISK" }))

  "--- account profile and reapply ---"
  $rf = Ensure-User @{ role = "FISHERFOLK"; name = "Prof Fisher"; mobile = "09170000031"; barangay = "Calan"; password = "password123"; boatOrGear = "motor, net"; fishingArea = "near"; profile = @{ fisher = @{ boat = "motor"; gear = @("net"); ground = "near"; landing = "Balayan" } } }
  $rb = Ensure-User @{ role = "BUYER"; name = "Prof Buyer"; mobile = "09170000032"; barangay = "Poblacion"; password = "password123"; businessName = "Prof Stall"; buyerType = "market"; profile = @{ buyer = @{ address = "Balayan Public Market" } } }
  if ($rf.code -ne 200 -or $rb.code -ne 200) { "Profile test accounts unavailable: $($rf.err) $($rb.err)" }
  else {
    $pid2 = $rb.data.user.id
    Check "fisherfolk profile saved" ($rf.data.user.profile.fisher.boat -eq "motor" -and $rf.data.user.profile.fisher.gear -contains "net")
    $rej = Api PATCH "/admin/users/$pid2/status" @{ status = "REJECTED"; note = "Address is not clear." } $A
    Check "admin rejects with a note" ($rej.code -eq 200 -and $rej.data.status -eq "REJECTED" -and $rej.data.statusNote -eq "Address is not clear.")
    $lb = Api POST "/auth/login" @{ mobile = "09170000032"; password = "password123" }
    Check "rejected buyer can log in and sees the note" ($lb.code -eq 200 -and $lb.data.user.status -eq "REJECTED" -and $lb.data.user.statusNote -eq "Address is not clear.")
    $rea = Api PATCH "/auth/reapply" @{ businessName = "Prof Stall (fixed)"; buyerType = "market"; profile = @{ buyer = @{ address = "Stall 14, Balayan Public Market" } } } $lb.data.token
    Check "reapply sets PENDING and clears the note" ($rea.code -eq 200 -and $rea.data.user.status -eq "PENDING" -and $null -eq $rea.data.user.statusNote)
    Check "reapply again refused (409)" ((Api PATCH "/auth/reapply" @{ businessName = "x" } $lb.data.token).code -eq 409)
    Check "admin cannot reject a fisherfolk (400)" ((Api PATCH "/admin/users/$($rf.data.user.id)/status" @{ status = "REJECTED" } $A).code -eq 400)
    Check "fisherfolk cannot reject anyone (403)" ((Api PATCH "/admin/users/$pid2/status" @{ status = "REJECTED" } $rf.data.token).code -eq 403)
    $okp = Api PATCH "/admin/users/$pid2/status" @{ status = "ACTIVE" } $A
    Check "approval clears the note" ($okp.code -eq 200 -and $okp.data.status -eq "ACTIVE" -and $null -eq $okp.data.statusNote)
    Check "buyer was notified of the decision" ((Api GET "/notifications" $null $lb.data.token).data.unreadCount -ge 1)
  }

  "--- admin pathways and species ---"
  $pname = "TEST pathway $(Get-Random)"
  Check "fisherfolk blocked from pathways (403)" ((Api GET "/admin/pathways" $null $F).code -eq 403)
  $pbody = @{ speciesId = $sk.id; name = $pname; allowedRisks = @("LOW"); requiredConditions = "test"; avoidConditions = ""; recommendation = "test only" }
  $new = Api POST "/admin/pathways" $pbody $A
  Check "admin adds a pathway" ($new.code -eq 200 -and $new.data.name -eq $pname)
  if ($new.code -eq 200) {
    $high = $pbody.Clone(); $high.allowedRisks = @("LOW", "HIGH"); $high.name = "$pname high"
    Check "HIGH risk refused (400)" ((Api POST "/admin/pathways" $high $A).code -eq 400)
    Check "duplicate name refused (409)" ((Api POST "/admin/pathways" $pbody $A).code -eq 409)
    $bad = $pbody.Clone(); $bad.name = "$pname empty"; $bad.recommendation = ""
    Check "empty recommendation refused (400)" ((Api POST "/admin/pathways" $bad $A).code -eq 400)
    Check "admin edits the recommendation" ((Api PATCH "/admin/pathways/$($new.data.id)" @{ recommendation = "changed" } $A).data.recommendation -eq "changed")
    Check "empty edit refused (400)" ((Api PATCH "/admin/pathways/$($new.data.id)" @{} $A).code -eq 400)
    Check "admin switches it off" ((Api PATCH "/admin/pathways/$($new.data.id)" @{ active = $false } $A).data.active -eq $false)
  }
  Check "unknown pathway id gives 404" ((Api PATCH "/admin/pathways/nope" @{ active = $true } $A).code -eq 404)
  Check "fisherfolk cannot edit species (403)" ((Api PATCH "/admin/species/$($sk.id)" @{ l0Min = 100; l0Max = 100 } $F).code -eq 403)
  Check "max below min refused (400)" ((Api PATCH "/admin/species/$($sk.id)" @{ l0Min = 200; l0Max = 100 } $A).code -eq 400)
  Api PATCH "/admin/species/$($sk.id)" @{ l0Min = $null; l0Max = $null } $A | Out-Null
  $cn = Api POST "/catches" @{ speciesId = $sk.id; kilos = 5 } $F
  Check "no shelf-life data gives risk null" ($cn.code -eq 200 -and $null -eq $cn.data.assessment.risk)
  $back = Api PATCH "/admin/species/$($sk.id)" @{ l0Min = 192; l0Max = 192; histamine = $true } $A
  Check "skipjack restored to 192 h" ($back.code -eq 200 -and $back.data.l0Min -eq 192)
}

Run-Tests
"==== $script:pass passed, $script:fail failed ===="
if ($script:fail -gt 0) { exit 1 }