@echo off
title JONY
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo No se encontro Node.js. Instalalo desde https://nodejs.org ^(version LTS^) y vuelve a abrir este archivo.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Instalando dependencias, solo la primera vez...
  call npm install --omit=dev
  if errorlevel 1 (
    echo Fallo la instalacion. Revisa tu conexion a internet.
    pause
    exit /b 1
  )
)
if "%PORT%"=="" set PORT=3000
start "" cmd /c "timeout /t 2 >nul & start http://localhost:%PORT%"
node backend\server.js
pause
