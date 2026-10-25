param([switch]$Apply)
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$workRoot = Join-Path $projectRoot 'work'
$archiveRoot = Join-Path $projectRoot 'archives/working-copies'
$prefix = $projectRoot.TrimEnd('\') + '\'
foreach ($target in @($workRoot, $archiveRoot)) {
    if (-not ([IO.Path]::GetFullPath($target)).StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase)) { throw "Target outside project: $target" }
}
foreach ($target in @((Join-Path $projectRoot 'archives'), $archiveRoot, $workRoot)) {
    if ((Test-Path -LiteralPath $target) -and ((Get-Item -LiteralPath $target).Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw "Linked directory refused: $target" }
}
$entries = @()
$folders = @(Get-ChildItem -LiteralPath $workRoot -Directory | Where-Object { $_.Name -match '^backup-0\.(4[0-9]|5[0-9]|60)$' })
foreach ($folder in $folders) {
    if ($folder.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw "Linked folder refused: $($folder.FullName)" }
    $destination = Join-Path $archiveRoot $folder.Name
    if (Test-Path -LiteralPath $destination) { throw "Archive already exists: $destination" }
    foreach ($item in @(Get-ChildItem -LiteralPath $folder.FullName -Recurse)) {
        if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw "Linked item refused: $($item.FullName)" }
        if (-not $item.PSIsContainer) {
            $relative = $item.FullName.Substring($folder.FullName.Length + 1)
            $entries += [pscustomobject]@{source=$item.FullName; destination=(Join-Path $destination $relative); bytes=$item.Length; sha256=(Get-FileHash -LiteralPath $item.FullName -Algorithm SHA256).Hash}
        }
    }
}
$manifest = $null
if ($Apply -and $folders.Count) {
    New-Item -ItemType Directory -Path $archiveRoot -Force | Out-Null
    $manifest = Join-Path $archiveRoot ('manifest-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff') + '.json')
    ConvertTo-Json -InputObject $entries -Depth 3 | Set-Content -LiteralPath $manifest -Encoding utf8
    foreach ($folder in $folders) { Move-Item -LiteralPath $folder.FullName -Destination (Join-Path $archiveRoot $folder.Name) }
    foreach ($entry in $entries) {
        if ((Get-FileHash -LiteralPath $entry.destination -Algorithm SHA256).Hash -ne $entry.sha256) { throw "Archive verification failed: $($entry.destination)" }
    }
}
[pscustomobject]@{mode=$(if ($Apply) {'apply'} else {'preview'}); folders=$folders.Count; files=$entries.Count; bytes=($entries|Measure-Object bytes -Sum).Sum; manifest=$manifest} | ConvertTo-Json
