$ErrorActionPreference = 'Stop'

$cloudflared = Join-Path $PSScriptRoot 'cloudflared.exe'

if (-not (Test-Path -LiteralPath $cloudflared)) {
  throw "cloudflared.exe was not found at $cloudflared"
}

& $cloudflared tunnel --url http://localhost:8188
