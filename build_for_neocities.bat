@echo off
TITLE JPEGifier Builder for Neocities
CLS

ECHO ========================================================
ECHO       JPEGifier - Neocities Deployment Prep
ECHO ========================================================
ECHO.
ECHO This script will:
ECHO 1. Install necessary build tools (Vite, React, TypeScript)
ECHO 2. Compile your code into standard HTML/JS
ECHO 3. Create a 'dist' folder ready for upload
ECHO.

REM Check if Node is installed
node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    ECHO [ERROR] Node.js is not installed!
    ECHO Please download and install Node.js from https://nodejs.org/
    PAUSE
    EXIT /B
)

ECHO [1/3] Installing Dependencies (this may take a minute)...
CALL npm install
IF %ERRORLEVEL% NEQ 0 (
    ECHO [ERROR] Failed to install dependencies.
    PAUSE
    EXIT /B
)

ECHO.
ECHO [2/3] Building Project...
CALL npm run build
IF %ERRORLEVEL% NEQ 0 (
    ECHO [ERROR] Build failed. Check the errors above.
    PAUSE
    EXIT /B
)

ECHO.
ECHO [3/3] Build Complete!
ECHO.
ECHO ========================================================
ECHO                 READY FOR UPLOAD
ECHO ========================================================
ECHO.
ECHO A folder named "dist" has been created in this directory.
ECHO.
ECHO 1. Go to Neocities.org dashboard.
ECHO 2. Drag and drop all files INSIDE the "dist" folder.
ECHO    (index.html, assets folder, etc.)
ECHO.
PAUSE
start .