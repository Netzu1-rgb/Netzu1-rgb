@echo off
REM Levanta NetAI en tu computadora: http://localhost:3000
REM Uso: doble clic, o "iniciar-local.bat --red" para abrirla también desde el celular.
setlocal enabledelayedexpansion
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Falta Node.js. Instalalo desde https://nodejs.org ^(version 20 o superior^) y volve a ejecutar este archivo.
  pause
  exit /b 1
)

if not exist .env.local (
  echo Creando .env.local con valores de prueba...
  for /f "delims=" %%s in ('node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"') do set SECRET=%%s
  > .env.local echo # Solo para probar en tu computadora. No se sube al repositorio.
  >> .env.local echo APP_ACCESS_CODES=familia-local
  >> .env.local echo SESSION_SECRET=!SECRET!
)

if not exist node_modules (
  echo Instalando dependencias ^(solo la primera vez^)...
  call npm install
)

echo.
echo NetAI se esta iniciando.
echo   Inicio:      http://localhost:3000
echo   App:         http://localhost:3000/app
echo   Codigo:      el que figura en .env.local ^(APP_ACCESS_CODES^)
echo.

if "%1"=="--red" (
  echo   Desde el celular: http://IP-DE-ESTA-COMPUTADORA:3000  ^(ver con el comando ipconfig^)
  call npx next dev -H 0.0.0.0 -p 3000
) else (
  call npx next dev -p 3000
)
