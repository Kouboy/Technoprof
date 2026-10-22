param([switch]$Apply)
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$archiveRoot = Join-Path $projectRoot 'archives/versions'
$prefix = $projectRoot.TrimEnd('\') + '\'
if (-not ([IO.Path]::GetFullPath($archiveRoot)).StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase)) {
    throw 'Archive target is outside the project.'
}
foreach ($dir in @((Join-Path $projectRoot 'archives'), $archiveRoot)) {
    if ((Test-Path -LiteralPath $dir) -and ((Get-Item -LiteralPath $dir).Attributes -band [IO.FileAttributes]::ReparsePoint)) {
        throw "Archive directory is a link: $dir"
    }
}
$entries = @(Get-ChildItem -LiteralPath $projectRoot -File | Where-Object {
    $_.Name -match '^Jouer-Technoprof-0\.(4[0-9]|5[0-9]|60)\.html$'
} | ForEach-Object {
    if ($_.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw "Linked source refused: $($_.FullName)" }
    $destination = Join-Path $archiveRoot $_.Name
    if (Test-Path -LiteralPath $destination) { throw "Archive already exists: $destination" }
    [pscustomobject]@{ source = $_.FullName; destination = $destination; bytes = $_.Length;
        sha256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash; moved = $false }
})
$frozen = Join-Path $projectRoot 'Jouer-Technoprof-0.61.html'
$frozenHash = if (Test-Path -LiteralPath $frozen) { (Get-FileHash -LiteralPath $frozen -Algorithm SHA256).Hash } else { $null }
$manifest = $null
if ($Apply -and $entries.Count) {
    New-Item -ItemType Directory -Path $archiveRoot -Force | Out-Null
    $manifest = Join-Path $archiveRoot ("manifest-" + (Get-Date -Format 'yyyyMMdd-HHmmss-fff') + '.json')
    ConvertTo-Json -InputObject $entries -Depth 4 | Set-Content -LiteralPath $manifest -Encoding utf8
    foreach ($entry in $entries) {
        Move-Item -LiteralPath $entry.source -Destination $entry.destination
        if ((Get-FileHash -LiteralPath $entry.destination -Algorithm SHA256).Hash -ne $entry.sha256) {
            throw "Hash mismatch after archive move: $($entry.destination)"
        }
        $entry.moved = $true
        ConvertTo-Json -InputObject $entries -Depth 4 | Set-Content -LiteralPath $manifest -Encoding utf8
    }
    if ($frozenHash -and (Get-FileHash -LiteralPath $frozen -Algorithm SHA256).Hash -ne $frozenHash) {
        throw 'Frozen 0.61 changed unexpectedly.'
    }
}
[pscustomobject]@{ mode = $(if ($Apply) { 'apply' } else { 'preview' }); files = $entries.Count;
    bytes = ($entries | Measure-Object -Property bytes -Sum).Sum; manifest = $manifest;
    frozen061 = $frozenHash } | ConvertTo-Json
