param([string]$BaseUrl = 'http://localhost:3000')

$ErrorActionPreference = 'Stop'
$routes = @('/', '/academics', '/auth', '/messages', '/opportunities', '/notifications', '/profile', '/people', '/settings', '/settings/profile', '/u/tobihcreates', '/search', '/saved', '/verification', '/help')
foreach ($route in $routes) {
  $response = Invoke-WebRequest -UseBasicParsing -TimeoutSec 15 "$BaseUrl$route"
  if ($response.StatusCode -ne 200) { throw "Route $route returned $($response.StatusCode)" }
  Write-Host "OK $route"
}
$health = Invoke-WebRequest -UseBasicParsing -TimeoutSec 15 "$BaseUrl/api/v1/health"
if ($health.StatusCode -ne 200) { throw "API health returned $($health.StatusCode)" }
Write-Host "OK /api/v1/health"
Write-Host 'Smoke tests passed.'
