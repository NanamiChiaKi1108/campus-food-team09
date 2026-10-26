@echo off
setlocal DisableDelayedExpansion
set "FOOD_PAGE="
set "FOOD_BROWSER="
if exist "%~dp0demo\index.html" set "FOOD_PAGE=%~dp0demo\index.html"
if not defined FOOD_PAGE for /d %%D in ("%~dp0*") do if exist "%%~fD\demo\index.html" set "FOOD_PAGE=%%~fD\demo\index.html"
if not defined FOOD_PAGE goto missing
for %%B in ("%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" "%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe") do if not defined FOOD_BROWSER if exist "%%~fB" set "FOOD_BROWSER=%%~fB"
if not defined FOOD_BROWSER goto no_browser
if /i "%~1"=="--check" goto checked
start "" "%FOOD_BROWSER%" "%FOOD_PAGE%"
if errorlevel 1 goto launch_failed
exit /b 0
:checked
echo PASS: demo page found.
echo PASS: Edge or Chrome found.
exit /b 0
:missing
echo ERROR: The demo page is missing.
echo Extract the complete project folder before opening this launcher.
if /i "%~1"=="--check" exit /b 1
pause
exit /b 1
:no_browser
echo ERROR: Microsoft Edge or Google Chrome was not found.
echo Open demo\index.html manually with your browser.
if /i "%~1"=="--check" exit /b 2
pause
exit /b 2
:launch_failed
echo ERROR: The browser could not be started.
echo Open demo\index.html manually with Edge or Chrome.
pause
exit /b 3
