param(
    [string]$OutputDirectory = 'work/checkpoints/release',
    [switch]$Force
)
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$projectPrefix = $projectRoot.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
$output = [IO.Path]::GetFullPath((Join-Path $projectRoot $OutputDirectory))
if (-not $output.StartsWith($projectPrefix, [StringComparison]::OrdinalIgnoreCase)) { throw 'Output must stay inside the project.' }
# Refuse linked parents: the generated archive must not escape through a junction.
$cursor = $output
while ($cursor.Length -ge $projectRoot.Length) {
    if ((Test-Path -LiteralPath $cursor) -and ((Get-Item -LiteralPath $cursor).Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw "Linked destination refused: $cursor" }
    if ($cursor -eq $projectRoot) { break }
    $cursor = Split-Path -Parent $cursor
}
Push-Location $projectRoot
try {
    $music = (& node -e 'console.log(JSON.stringify(require("./tools/pages-assets.cjs").musicFiles(process.cwd())))' | ConvertFrom-Json)
    if ($LASTEXITCODE -ne 0 -or $music.Count -ne 17) { throw 'Expected the 17 approved audio files.' }
    $gitRoot = $projectRoot.Replace('\', '/')
    $commit = [string](& git -c "safe.directory=$gitRoot" rev-parse HEAD)
    $commit = $commit.Trim()
    if ($LASTEXITCODE -ne 0 -or $commit -notmatch '^[0-9a-f]{40}$') { throw 'Build commit unavailable.' }
    $build = Get-Content -LiteralPath (Join-Path $projectRoot 'dist-day/local-build-info.json') -Raw | ConvertFrom-Json
    if ($build.commit -ne $commit) { throw 'Day HTML belongs to another commit. Run npm run build:journee first.' }
    foreach ($artifact in @(@('Jouer-Technoprof-Journee-Atelier.html', $build.htmlSha256), @('Jouer-Technoprof-Fenetre.html', $build.launcherSha256), @('Technoprof.ico', $build.iconSha256))) {
        if ((Get-FileHash -LiteralPath (Join-Path $projectRoot $artifact[0]) -Algorithm SHA256).Hash.ToLowerInvariant() -ne $artifact[1]) { throw "Built artifact changed: $($artifact[0])" }
    }
    $files = @('Jouer-Technoprof-Fenetre.html', 'Jouer-Technoprof-Journee-Atelier.html', 'Jouer.cmd', 'Creer-raccourci.cmd', 'Technoprof.ico', 'LIRE-MOI-LOCAL.txt', 'RETOURS-TEST.txt') + $music
    foreach ($file in $files) {
        if ($file.Contains('..') -or [IO.Path]::IsPathRooted($file)) { throw "Unsafe relative path: $file" }
        if (-not (Test-Path -LiteralPath (Join-Path $projectRoot $file) -PathType Leaf)) { throw "Build the day first; missing file: $file" }
    }
    New-Item -ItemType Directory -Path $output -Force | Out-Null
    $archive = Join-Path $output 'Technoprof-local.zip'
    foreach ($target in @($archive, ($archive + '.sha256'))) {
        if ((Test-Path -LiteralPath $target) -and ((Get-Item -LiteralPath $target).Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw "Linked output file refused: $target" }
    }
    if (Test-Path -LiteralPath $archive) {
        if (-not $Force) { throw 'Generated ZIP already exists. Use -Force to rebuild it.' }
        if ((Get-Item -LiteralPath $archive).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Linked ZIP refused.' }
        Remove-Item -LiteralPath $archive
    }
    $stage = Join-Path $output ('_stage_' + [guid]::NewGuid().ToString('N'))
    $payload = Join-Path $stage 'Technoprof'
    New-Item -ItemType Directory -Path $payload -Force | Out-Null
    try {
        $entries = @()
        foreach ($file in $files) {
            $source = Join-Path $projectRoot $file
            $destination = Join-Path $payload $file
            New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force | Out-Null
            Copy-Item -LiteralPath $source -Destination $destination
            $entries += [ordered]@{path=$file; bytes=(Get-Item -LiteralPath $destination).Length; sha256=(Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash.ToLowerInvariant()}
        }
        $manifest = [ordered]@{profile='journee-musicale-locale'; commit=$commit; createdAt=[DateTime]::UtcNow.ToString('o'); launch='Jouer-Technoprof-Fenetre.html'; files=$entries}
        $manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $payload 'BUILD-INFO.json') -Encoding utf8NoBOM
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [IO.Compression.ZipFile]::CreateFromDirectory($payload, $archive, [IO.Compression.CompressionLevel]::Optimal, $true)
        $sha256 = (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant()
        ($sha256 + '  Technoprof-local.zip') | Set-Content -LiteralPath ($archive + '.sha256') -Encoding utf8NoBOM
        [ordered]@{archive=$archive; bytes=(Get-Item -LiteralPath $archive).Length; sha256=$sha256; commit=$commit; payloadFiles=$entries.Count + 1} | ConvertTo-Json
    } finally {
        $stageAbsolute = [IO.Path]::GetFullPath($stage)
        $outputPrefix = $output.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
        if (-not $stageAbsolute.StartsWith($outputPrefix, [StringComparison]::OrdinalIgnoreCase) -or (Split-Path -Leaf $stageAbsolute) -notmatch '^_stage_[0-9a-f]{32}$') { throw 'Invalid staging cleanup target.' }
        Remove-Item -LiteralPath $stageAbsolute -Recurse -Force
    }
} finally { Pop-Location }
