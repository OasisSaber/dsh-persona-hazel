# HazePersona deploy.ps1 - deploy Haze persona (dsh-persona-hazel plugin) to DSH
# Usage: .\deploy.ps1
# 1) Sync persona\soul-card.md -> plugin\dsh-persona-hazel\persona.txt
# 2) Ensure node_modules junction: profiles\web\node_modules\dsh-persona-hazel
# 3) Idempotently ensure the persona-hazel insert row in profiles\web\cordis.patch.yml
# NOTE: a NEW plugin needs a dsh web restart to load (kill dsh web process,
# then click "restart" in the desktop dialog). persona.txt file changes
# hot-reload via fs.watch afterwards.
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$dshHome = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $env:USERPROFILE '.dsh' }
$webProfile = Join-Path $dshHome 'profiles\web'
$pluginDir = Join-Path $root 'plugin\dsh-persona-hazel'
$link = Join-Path $webProfile 'node_modules\dsh-persona-hazel'
$patch = Join-Path $webProfile 'cordis.patch.yml'

# 1) persona card -> plugin persona.txt
Copy-Item (Join-Path $root 'persona\soul-card.md') (Join-Path $pluginDir 'persona.txt') -Force
Write-Output "1) persona.txt synced ($((Get-Item (Join-Path $pluginDir 'persona.txt')).Length) bytes)"

# 2) junction
if (-not (Test-Path $link)) {
  New-Item -ItemType Junction -Path $link -Target $pluginDir | Out-Null
  Write-Output "2) junction created: $link"
} else {
  Write-Output "2) junction already present"
}

# 3) cordis.patch.yml insert row (idempotent, UTF-8 without BOM)
$content = [System.IO.File]::ReadAllText($patch)
if ($content -notmatch 'dsh-persona-hazel') {
  $row = "- insert:`r`n    - id: persona-hazel`r`n      name: 'dsh-persona-hazel'`r`n"
  $content = $content.TrimEnd("`r", "`n") + "`r`n" + $row
  [System.IO.File]::WriteAllText($patch, $content, (New-Object System.Text.UTF8Encoding($false)))
  Write-Output "3) patch row added"
} else {
  Write-Output "3) patch row already present"
}

Write-Output 'Done. A NEW plugin requires a dsh web restart; afterwards persona.txt changes hot-reload.'
