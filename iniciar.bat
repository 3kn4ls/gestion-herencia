@echo off
REM Script de inicio para Windows
REM Ejecuta este archivo para iniciar la aplicacion

echo.
echo ============================================================
echo   SISTEMA DE GESTION DE DATOS CATASTRALES
echo ============================================================
echo.

REM Verificar si Python esta instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python no esta instalado
    echo.
    echo Por favor, instala Python siguiendo INSTALACION.md
    echo.
    pause
    exit /b 1
)

echo [1/3] Verificando Python... OK
echo.

REM Verificar si las dependencias estan instaladas
python -c "import requests, bs4, lxml" >nul 2>&1
if errorlevel 1 (
    echo [2/3] Instalando dependencias...
    pip install requests beautifulsoup4 lxml
    if errorlevel 1 (
        echo [ERROR] No se pudieron instalar las dependencias
        echo.
        pause
        exit /b 1
    )
) else (
    echo [2/3] Dependencias instaladas... OK
)
echo.

REM Verificar si existen datos
if not exist "data\datos_catastrales_consolidados.json" (
    echo [3/3] Generando datos de ejemplo...
    python catastro_scraper_service.py
    if errorlevel 1 (
        echo [ERROR] No se pudieron generar los datos
        echo.
        pause
        exit /b 1
    )
) else (
    echo [3/3] Datos encontrados... OK
)

echo.
echo ============================================================
echo   INICIANDO SERVIDOR
echo ============================================================
echo.
echo El navegador se abrira automaticamente en:
echo http://localhost:8000/frontend/
echo.
echo Para detener el servidor: presiona Ctrl+C
echo.
echo ============================================================
echo.

REM Intentar abrir el navegador automaticamente
timeout /t 2 /nobreak >nul
start http://localhost:8000/frontend/

REM Iniciar el servidor
python server.py

pause
