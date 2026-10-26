@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "TASK_NODE=node"
if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" set "TASK_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
"%TASK_NODE%" --test tests/core.test.cjs tests/cloud.test.cjs tests/native.test.cjs tests/notify.test.cjs tests/iteration.test.cjs tests/refinement.test.cjs tests/server.test.cjs tests/campus.test.cjs tests/requirements.test.cjs
if errorlevel 1 goto failed
"%TASK_NODE%" tools/check.cjs
if errorlevel 1 goto failed
echo All checks passed.
pause
exit /b 0
:failed
echo Checks failed. Install Node.js 18+ if Node was not found.
pause
exit /b 1
