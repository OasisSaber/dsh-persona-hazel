# Thin wrapper around codex-keysmith for deploying persona/soul-card.md
# to a Windows Codex dir. No custom deploy logic lives here: this script only
# assembles arguments, records hooks.json SHA256 before/after (to prove the
# mnemon hooks were NOT isolated), and calls keysmith.
#
# Prerequisites:
#   - Windows Python 3 available as `py -3` (keysmith must run on Windows;
#     WSL/DrvFs breaks its atomic rename).
#   - codex-instruct-v*.py downloaded from the official Releases page with
#     SHA256SUMS verified. Default location can be overridden via KEYSMITH_PY.
#
# Usage:
#   pwsh -NoProfile -File scripts/deploy-codex.ps1 -DryRun
#   pwsh -NoProfile -File scripts/deploy-codex.ps1 -Yes
#
# See docs/codex-deployment.md for red lines and rollback.
param(
    [string]$KeysmithPy,
    [string]$CodexDir = "C:\Users\Oasis\.codex",
    [string]$SoulCard,
    [string]$Name = "hazel-persona",
    [switch]$DryRun,
    [switch]$Yes
)

$ErrorActionPreference = 'Stop'

if (-not $KeysmithPy) {
    if ($env:KEYSMITH_PY) { $KeysmithPy = $env:KEYSMITH_PY }
    else { $KeysmithPy = "D:\Project\SandBox\keysmith\codex-instruct-v0.3.9.py" }
}
if (-not $SoulCard) {
    $SoulCard = Join-Path $PSScriptRoot '..\persona\soul-card.md'
}
if (-not (Test-Path $KeysmithPy)) { throw "keysmith script not found: $KeysmithPy" }
$resolvedCard = (Resolve-Path $SoulCard).Path
$hooksJson = Join-Path $CodexDir 'hooks.json'
if (-not (Test-Path $CodexDir)) { throw "codex dir not found: $CodexDir" }

$before = $null
if (Test-Path $hooksJson) {
    $before = (Get-FileHash $hooksJson -Algorithm SHA256).Hash
    Write-Host "[pre ] hooks.json sha256 = $before"
}
else {
    Write-Host "[pre ] hooks.json not present in target"
}

if ($DryRun -eq $false -and $Yes -eq $false) {
    throw "refusing to run without -DryRun or -Yes (explicit intent required)"
}

$pyArgs = @(
    $KeysmithPy,
    '--codex-dir', $CodexDir,
    '--file', $resolvedCard,
    '--name', $Name,
    '--skip-hooks-isolation'
)
if ($DryRun) { $pyArgs += '--dry-run' }
else { $pyArgs += '--yes' }

& py -3 @pyArgs
$code = $LASTEXITCODE

$after = $null
if (Test-Path $hooksJson) {
    $after = (Get-FileHash $hooksJson -Algorithm SHA256).Hash
    Write-Host "[post] hooks.json sha256 = $after"
}

if ($null -ne $before -and $null -ne $after -and $before -ne $after) {
    Write-Warning "hooks.json CHANGED during deployment - mnemon hooks may have been isolated! Inspect the target dir immediately."
}

exit $code
