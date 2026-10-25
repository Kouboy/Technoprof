@echo off
setlocal DisableDelayedExpansion
rem Pass the directory as data, never interpolate it into PowerShell code.
set "TECHNOPROF_GAME_DIR=%~dp0"
rem Inline -Command also works when downloaded scripts cannot run via -File.
powershell.exe -NoProfile -Command ^
  "$ErrorActionPreference='Stop'; try {" ^
  "$game=Join-Path $env:TECHNOPROF_GAME_DIR 'Jouer-Technoprof-Journee-Atelier.html';" ^
  "if (-not (Test-Path -LiteralPath $game -PathType Leaf)) { exit 1 };" ^
  "$candidates=@($env:ProgramFiles,${env:ProgramFiles(x86)},$env:LOCALAPPDATA) | Where-Object { $_ } | ForEach-Object { Join-Path $_ 'Google\Chrome\Application\chrome.exe' };" ^
  "$chrome=$candidates | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } | Select-Object -First 1;" ^
  "if (-not $chrome) { exit 1 };" ^
  "$url=([Uri]$game).AbsoluteUri+'?musique=essai&fenetre=1';" ^
  "$arguments=@(('--app='+$url),'--window-size=1024,800');" ^
  "Start-Process -FilePath $chrome -ArgumentList $arguments -WindowStyle Normal; exit 0" ^
  "} catch { exit 1 }"
if not errorlevel 1 exit /b 0
rem Keep the HTML/default-browser fallback if Chrome is unavailable.
if exist "%~dp0Jouer-Technoprof-Fenetre.html" (
  @start "" "%~dp0Jouer-Technoprof-Fenetre.html"
) else (
  @if exist "%~dp0Jouer-Technoprof-Journee-Musique.html" (
    @start "" "%~dp0Jouer-Technoprof-Journee-Musique.html"
  ) else (
    @if exist "%~dp0Jouer-Technoprof-Journee-Atelier.html" (
      @start "" "%~dp0Jouer-Technoprof-Journee-Atelier.html"
    ) else (
      @if exist "%~dp0Jouer-Technoprof.html" (
        @start "" "%~dp0Jouer-Technoprof.html"
      ) else (
        @echo Fichiers du jeu introuvables. Extraire tout le dossier avant de lancer.
        @exit /b 1
      )
    )
  )
)
