@echo off
REM scripts\setup-python.cmd — Install netops-toolkit Python package from GitHub.
REM Called by tauri beforeBuildCommand / beforeDevCommand on Windows.

set REPO_URL=https://github.com/plures/netops-toolkit.git
if "%NETOPS_TOOLKIT_DIR%"=="" set NETOPS_TOOLKIT_DIR=.python-deps\netops-toolkit

echo ==^> Setting up netops-toolkit Python backend...

REM Find Python
where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo WARNING: Python not found — scanning features will use mock data
    exit /b 0
)

for /f "tokens=*" %%i in ('python --version 2^>^&1') do echo     Python: %%i

REM Clone or update
if exist "%NETOPS_TOOLKIT_DIR%\.git" (
    echo     Updating netops-toolkit...
    git -C "%NETOPS_TOOLKIT_DIR%" pull --ff-only 2>nul
) else (
    echo     Cloning netops-toolkit...
    git clone --depth 1 %REPO_URL% "%NETOPS_TOOLKIT_DIR%"
)

REM Install
echo     Installing netops-toolkit...
python -m pip install --quiet --user "%NETOPS_TOOLKIT_DIR%" 2>nul
if %ERRORLEVEL% neq 0 (
    python -m pip install --quiet "%NETOPS_TOOLKIT_DIR%"
)
if %ERRORLEVEL% neq 0 (
    echo WARNING: pip install failed — scanning features will use mock data
    exit /b 0
)

echo     netops-toolkit ready.
