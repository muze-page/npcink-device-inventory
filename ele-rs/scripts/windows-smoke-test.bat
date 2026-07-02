@echo off
setlocal

set SCRIPT_DIR=%~dp0
set PS_SCRIPT=%SCRIPT_DIR%windows-smoke-test.ps1

if not exist "%PS_SCRIPT%" (
  echo Missing %PS_SCRIPT%
  exit /b 1
)

net session >nul 2>&1
if %errorlevel% neq 0 (
  echo Requesting administrator permission for richer Windows diagnostics...
  powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -ArgumentList '%*' -Verb RunAs"
  exit /b
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%" %*
set EXIT_CODE=%ERRORLEVEL%

echo.
echo Windows smoke test exited with code %EXIT_CODE%.
if not "%NPCINK_NO_PAUSE%"=="1" pause
exit /b %EXIT_CODE%
