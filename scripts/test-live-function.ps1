$ErrorActionPreference = 'Stop'
$uri = 'https://pqasdmiqnlyyjwmmqeyc.supabase.co/functions/v1/tow-lead'
$headers = @{ Origin = 'https://evakuator-che.online' }
$testName = -join (0x422, 0x415, 0x421, 0x422 | ForEach-Object { [char]$_ })
$testPlace = -join (0x422, 0x435, 0x441, 0x442 | ForEach-Object { [char]$_ })
$marker = 'tow-live-' + [Guid]::NewGuid().ToString('N')
$lead = @{ name = $testName; phone = '+380000000000'; from = $testPlace; to = $testPlace; privacy = $true; comment = $marker }
function Send-TestLead($value) {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes(($value | ConvertTo-Json -Compress))
    Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -ContentType 'application/json; charset=utf-8' -Body $bytes -TimeoutSec 30
}
$success = Send-TestLead $lead
if ($success.ok -ne $true) { throw 'Valid test lead was not accepted' }
Write-Output 'PASS: valid lead accepted. Verify tg_sent separately with a read-only database query.'
@{ marker = $marker; sentAt = [DateTime]::UtcNow.ToString('o') } | ConvertTo-Json | Set-Content -Encoding UTF8 qa/live-test.json
$missingPhone = $lead.Clone()
$missingPhone.Remove('phone')
$validationStatus = 0
try { Send-TestLead $missingPhone | Out-Null } catch {
    if ($_.Exception.Response) { $validationStatus = [int]$_.Exception.Response.StatusCode } else { throw }
}
if ($validationStatus -ne 400) { throw "Expected 400 for missing phone; received $validationStatus" }
Write-Output 'PASS: missing phone rejected with HTTP 400.'
$spam = $lead.Clone()
$spam.website = 'honeypot-test'
$honeypot = Send-TestLead $spam
if ($honeypot.ok -ne $true) { throw 'Unexpected honeypot response' }
Write-Output 'PASS: honeypot returned silent success. Unit test verifies no Telegram request on this branch.'
$origins = @('https://evakuator-che.online', 'https://www.evakuator-che.online', 'https://tishinatyt.github.io', 'http://localhost:4173')
foreach ($origin in $origins) {
    $preflight = Invoke-WebRequest -UseBasicParsing -Uri $uri -Method Options -Headers @{ Origin = $origin; 'Access-Control-Request-Method' = 'POST'; 'Access-Control-Request-Headers' = 'content-type' } -TimeoutSec 30
    if ($preflight.StatusCode -ne 204 -or $preflight.Headers['Access-Control-Allow-Origin'] -ne $origin) { throw "CORS failed for $origin" }
}
Write-Output 'PASS: all requested CORS origins accepted.'
$ping = Invoke-RestMethod -Uri ($uri + '?ping=1') -TimeoutSec 30
if ($ping.ok -ne $true) { throw 'Ping failed' }
Write-Output 'PASS: ping returned ok.'
