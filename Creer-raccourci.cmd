@echo off
setlocal DisableDelayedExpansion
call "%~dp0Jouer.cmd" --raccourci
if errorlevel 1 (
  echo Impossible de creer le raccourci. Garder Technoprof.ico a cote de Jouer.cmd.
  pause
  exit /b 1
)
exit /b 0
