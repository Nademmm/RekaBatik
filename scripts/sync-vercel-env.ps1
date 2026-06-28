# Sync VITE_* variables from local .env to Vercel (Production + Preview)
# Usage: .\scripts\sync-vercel-env.ps1

$envFile = (Resolve-Path (Join-Path $PSScriptRoot "..\.env")).Path

Get-Content $envFile | Where-Object {
  $_ -match '^\s*VITE_' -and $_ -notmatch '^\s*#'
} | ForEach-Object {
  $idx = $_.IndexOf('=')
  if ($idx -lt 1) { return }

  $name = $_.Substring(0, $idx).Trim()
  $value = $_.Substring($idx + 1).Trim()

  foreach ($target in @('production', 'preview')) {
    Write-Host "Setting $name for $target..."
    $value | npx vercel env add $name $target --force | Out-Null
  }
}

Write-Host "Done. Redeploy with: npx vercel deploy --prod --yes"
