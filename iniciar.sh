#!/bin/bash
# Script de inicio para macOS/Linux
# Ejecuta este archivo para iniciar la aplicación

echo ""
echo "============================================================"
echo "  SISTEMA DE GESTIÓN DE DATOS CATASTRALES"
echo "============================================================"
echo ""

# Detectar el comando de Python correcto
PYTHON_CMD=""
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "[ERROR] Python no está instalado"
    echo ""
    echo "Por favor, instala Python siguiendo INSTALACION.md"
    echo ""
    exit 1
fi

echo "[1/3] Verificando Python... OK (usando $PYTHON_CMD)"
echo ""

# Verificar si las dependencias están instaladas
$PYTHON_CMD -c "import requests, bs4, lxml" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "[2/3] Instalando dependencias..."
    pip3 install requests beautifulsoup4 lxml
    if [ $? -ne 0 ]; then
        echo "[ERROR] No se pudieron instalar las dependencias"
        echo ""
        echo "Intenta con: sudo pip3 install requests beautifulsoup4 lxml"
        echo "O con: pip3 install --user requests beautifulsoup4 lxml"
        echo ""
        exit 1
    fi
else
    echo "[2/3] Dependencias instaladas... OK"
fi
echo ""

# Verificar si existen datos
if [ ! -f "data/datos_catastrales_consolidados.json" ]; then
    echo "[3/3] Generando datos de ejemplo..."
    $PYTHON_CMD catastro_scraper_service.py
    if [ $? -ne 0 ]; then
        echo "[ERROR] No se pudieron generar los datos"
        echo ""
        exit 1
    fi
else
    echo "[3/3] Datos encontrados... OK"
fi

echo ""
echo "============================================================"
echo "  INICIANDO SERVIDOR"
echo "============================================================"
echo ""
echo "El navegador debería abrirse automáticamente en:"
echo "http://localhost:8000/frontend/"
echo ""
echo "Si no se abre, copia y pega esa URL en tu navegador"
echo ""
echo "Para detener el servidor: presiona Ctrl+C"
echo ""
echo "============================================================"
echo ""

# Intentar abrir el navegador automáticamente
sleep 2

# Detectar el sistema operativo y abrir el navegador
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open http://localhost:8000/frontend/ 2>/dev/null
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:8000/frontend/ 2>/dev/null
    fi
fi

# Iniciar el servidor
$PYTHON_CMD server.py
