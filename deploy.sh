#!/bin/bash

# Script de despliegue simplificado para Gestión Herencia
# Uso: ./deploy.sh [opciones]
#
# Opciones:
#   --frontend-only    Solo desplegar frontend
#   --backend-only     Solo desplegar backend
#   --no-build         Saltar compilación (usar build existente)
#   --help            Mostrar ayuda

set -e  # Salir si hay errores

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuración
NAMESPACE="herencia"
FRONTEND_DIR="angular-catastro"
BACKEND_DIR="backend"
K8S_DIR="k8s"

# Valores por defecto
DEPLOY_FRONTEND=true
DEPLOY_BACKEND=true
DO_BUILD=true

# Parsear argumentos
for arg in "$@"; do
    case $arg in
        --frontend-only)
            DEPLOY_BACKEND=false
            shift
            ;;
        --backend-only)
            DEPLOY_FRONTEND=false
            shift
            ;;
        --no-build)
            DO_BUILD=false
            shift
            ;;
        --help)
            echo "Uso: $0 [opciones]"
            echo ""
            echo "Opciones:"
            echo "  --frontend-only    Solo desplegar frontend"
            echo "  --backend-only     Solo desplegar backend"
            echo "  --no-build         Saltar compilación"
            echo "  --help            Mostrar esta ayuda"
            echo ""
            echo "Sin opciones: despliega frontend y backend completos"
            exit 0
            ;;
        *)
            echo -e "${RED}Opción desconocida: $arg${NC}"
            echo "Usa --help para ver opciones disponibles"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                                   ║${NC}"
echo -e "${BLUE}║         🚀 DEPLOY GESTIÓN HERENCIA - Simplificado 🚀            ║${NC}"
echo -e "${BLUE}║                                                                   ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -d "$FRONTEND_DIR" ] || [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}Error: Debes ejecutar este script desde el directorio raíz del proyecto${NC}"
    exit 1
fi

#############################################
# FRONTEND
#############################################
if [ "$DEPLOY_FRONTEND" = true ]; then
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  📦 FRONTEND${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    cd "$FRONTEND_DIR"
    
    if [ "$DO_BUILD" = true ]; then
        echo -e "${YELLOW}🔨 Compilando frontend...${NC}"
        npm run build
        echo -e "${GREEN}✅ Frontend compilado${NC}"
    else
        echo -e "${YELLOW}⏭️  Saltando compilación frontend${NC}"
    fi
    
    echo -e "${YELLOW}🐳 Construyendo imagen Docker frontend...${NC}"
    docker build -t gestion-herencia-frontend:latest .
    echo -e "${GREEN}✅ Imagen frontend construida${NC}"
    
    echo -e "${YELLOW}📦 Importando imagen a k3s...${NC}"
    docker save gestion-herencia-frontend:latest | sudo k3s ctr images import -
    echo -e "${GREEN}✅ Imagen frontend importada${NC}"
    
    echo -e "${YELLOW}🚀 Desplegando frontend en k3s...${NC}"
    sudo kubectl rollout restart deployment/gestion-herencia -n "$NAMESPACE"
    echo -e "${GREEN}✅ Frontend desplegado${NC}"
    
    cd ..
fi

#############################################
# BACKEND
#############################################
if [ "$DEPLOY_BACKEND" = true ]; then
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  ⚙️  BACKEND${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    cd "$BACKEND_DIR"
    
    if [ "$DO_BUILD" = true ]; then
        echo -e "${YELLOW}📦 Instalando dependencias backend...${NC}"
        npm install
        echo -e "${GREEN}✅ Dependencias instaladas${NC}"
    fi
    
    echo -e "${YELLOW}🐳 Construyendo imagen Docker backend...${NC}"
    docker build -t gestion-herencia-backend:latest .
    echo -e "${GREEN}✅ Imagen backend construida${NC}"
    
    echo -e "${YELLOW}📦 Importando imagen a k3s...${NC}"
    docker save gestion-herencia-backend:latest | sudo k3s ctr images import -
    echo -e "${GREEN}✅ Imagen backend importada${NC}"
    
    echo -e "${YELLOW}🚀 Desplegando backend en k3s...${NC}"
    sudo kubectl rollout restart deployment/gestion-herencia-backend -n "$NAMESPACE"
    echo -e "${GREEN}✅ Backend desplegado${NC}"
    
    cd ..
fi

#############################################
# VERIFICACIÓN
#############################################
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  ✅ VERIFICACIÓN${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${YELLOW}⏳ Esperando a que los pods estén listos...${NC}"
sleep 5

echo ""
echo -e "${BLUE}Estado de los pods:${NC}"
sudo kubectl get pods -n "$NAMESPACE"

echo ""
echo -e "${GREEN}✅ ¡Deploy completado!${NC}"
echo ""
echo -e "${BLUE}🌐 Acceso a la aplicación:${NC}"
echo -e "  Frontend: ${GREEN}http://192.168.1.95/herencia/${NC}"
echo -e "  API:      ${GREEN}http://192.168.1.95/herencia/api/propiedades${NC}"
echo ""
echo -e "${BLUE}📝 Comandos útiles:${NC}"
echo -e "  Ver logs frontend: ${YELLOW}sudo kubectl logs -f -l app=gestion-herencia -n herencia${NC}"
echo -e "  Ver logs backend:  ${YELLOW}sudo kubectl logs -f -l app=gestion-herencia-backend -n herencia${NC}"
echo -e "  Ver pods:          ${YELLOW}sudo kubectl get pods -n herencia${NC}"
echo ""
