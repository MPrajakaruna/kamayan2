@echo off
REM Quick start script for print server (Windows)

echo ========================================
echo KAMAYAN POS Print Server
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if .env exists
if not exist .env (
    echo Creating .env file from env.example...
    copy env.example .env
    echo Please edit .env file with your configuration
)

REM Install dependencies if needed
if not exist node_modules (
    echo Installing dependencies...
    call npm install
)

REM Start server
echo Starting server...
echo.
node index.js

pause

