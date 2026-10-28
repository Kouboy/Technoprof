$ErrorActionPreference = 'Stop'
$project = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$area = Join-Path $project ('work/checkpoints/shortcut-' + [guid]::NewGuid().ToString('N'))
$shell = New-Object -ComObject WScript.Shell
foreach ($name in @("Dossier d'essai A", "Autre dossier B")) {
    $folder = Join-Path $area $name
    New-Item -ItemType Directory -Path $folder -Force | Out-Null
    foreach ($file in @('Jouer.cmd','Creer-raccourci.cmd','Technoprof.ico')) {
        Copy-Item -LiteralPath (Join-Path $project $file) -Destination (Join-Path $folder $file)
    }
    # Shortcut-only must never try to open this intentionally non-playable HTML.
    Set-Content -LiteralPath (Join-Path $folder 'Jouer-Technoprof-Journee-Atelier.html') -Value '<title>Shortcut fixture</title>'
    if ($name -eq 'Autre dossier B') {
        Copy-Item -LiteralPath (Join-Path $area "Dossier d'essai A/TECHNOPROF.lnk") -Destination (Join-Path $folder 'TECHNOPROF.lnk')
    }
    & (Join-Path $folder 'Creer-raccourci.cmd')
    if ($LASTEXITCODE -ne 0) { throw "Shortcut creation failed: $name" }
    $shortcut = $shell.CreateShortcut((Join-Path $folder 'TECHNOPROF.lnk'))
    if ($shortcut.TargetPath -ne (Join-Path $folder 'Jouer.cmd')) { throw 'Wrong launch target' }
    if ($shortcut.WorkingDirectory.TrimEnd('\') -ne $folder) { throw 'Wrong working directory' }
    if ($shortcut.IconLocation -ne ((Join-Path $folder 'Technoprof.ico') + ',0')) { throw 'Wrong custom icon' }
    if ($shortcut.Arguments) { throw 'Unexpected launch arguments' }
}
Write-Output 'PASS native Windows shortcuts: illustrated icon, correct target, spaces/apostrophe and regeneration after relocation; no game launched'
