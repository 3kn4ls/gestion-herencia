#!/bin/bash

# Script para verificar que el entorno está listo para deployment

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Verificación del Entorno k3s${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Función para verificar comandos
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 está instalado"
        if [ ! -z "$2" ]; then
            echo -e "  Versión: $($1 $2 2>&1 | head -n1)"
        fi
        return 0
    else
        echo -e "${RED}✗${NC} $1 NO está instalado"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# Verificar comandos esenciales
echo -e "${BLUE}1. Verificando comandos requeridos:${NC}"
check_command "docker" "--version"
check_command "kubectl" "version --client --short"
check_command "git" "--version"
echo ""

# Verificar k3s
echo -e "${BLUE}2. Verificando k3s:${NC}"
if sudo systemctl is-active --quiet k3s; then
    echo -e "${GREEN}✓${NC} k3s está corriendo"

    # Verificar conectividad
    if kubectl cluster-info &> /dev/null; then
        echo -e "${GREEN}✓${NC} kubectl puede conectarse al cluster"

        # Mostrar nodos
        echo -e "  Nodos disponibles:"
        kubectl get nodes -o wide | sed 's/^/    /'
    else
        echo -e "${RED}✗${NC} kubectl NO puede conectarse al cluster"
        echo -e "${YELLOW}  Intenta configurar kubeconfig:${NC}"
        echo -e "    mkdir -p ~/.kube"
        echo -e "    sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config"
        echo -e "    sudo chown \$USER:\$USER ~/.kube/config"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}✗${NC} k3s NO está corriendo"
    echo -e "${YELLOW}  Inicia k3s con:${NC} sudo systemctl start k3s"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Verificar Traefik (Ingress Controller)
echo -e "${BLUE}3. Verificando Traefik (Ingress Controller):${NC}"
if kubectl get pods -n kube-system | grep -q "traefik.*Running"; then
    echo -e "${GREEN}✓${NC} Traefik está corriendo"
    kubectl get pods -n kube-system | grep traefik | sed 's/^/  /'
else
    echo -e "${YELLOW}⚠${NC} Traefik no está corriendo o no está disponible"
    echo -e "  k3s debería incluir Traefik por defecto"
fi
echo ""

# Verificar registry local (opcional)
echo -e "${BLUE}4. Verificando registry local (opcional):${NC}"
if curl -s http://localhost:5000/v2/ > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Registry local está corriendo en localhost:5000"

    # Mostrar imágenes
    IMAGES=$(curl -s http://localhost:5000/v2/_catalog | grep -o '"repositories":\[.*\]' | grep -o '\[.*\]')
    if [ "$IMAGES" != "[]" ]; then
        echo -e "  Imágenes disponibles: $IMAGES"
    else
        echo -e "  Registry vacío (sin imágenes aún)"
    fi

    # Verificar configuración de k3s
    if [ -f "/etc/rancher/k3s/registries.yaml" ]; then
        echo -e "${GREEN}✓${NC} k3s está configurado para usar el registry local"
    else
        echo -e "${YELLOW}⚠${NC} k3s NO está configurado para usar el registry local"
        echo -e "  Ejecuta: ${BLUE}./setup-registry.sh${NC}"
    fi
else
    echo -e "${YELLOW}⚠${NC} Registry local NO está corriendo (esto es opcional)"
    echo -e "  El deployment usará importación directa con k3s ctr"
    echo -e "  Para configurar un registry local: ${BLUE}./setup-registry.sh${NC}"
fi
echo ""

# Verificar Docker
echo -e "${BLUE}5. Verificando Docker:${NC}"
if docker ps &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker está funcionando correctamente"
    echo -e "  Contenedores corriendo: $(docker ps -q | wc -l)"
else
    echo -e "${YELLOW}⚠${NC} Docker requiere permisos sudo o el usuario debe estar en el grupo docker"
    echo -e "  Agrega tu usuario al grupo docker: ${BLUE}sudo usermod -aG docker \$USER${NC}"
    echo -e "  Luego cierra sesión e inicia de nuevo"
fi
echo ""

# Verificar recursos del sistema
echo -e "${BLUE}6. Verificando recursos del sistema:${NC}"
TOTAL_MEM=$(free -h | awk '/^Mem:/ {print $2}')
FREE_MEM=$(free -h | awk '/^Mem:/ {print $7}')
DISK_AVAIL=$(df -h . | awk 'NR==2 {print $4}')

echo -e "  Memoria total: $TOTAL_MEM"
echo -e "  Memoria disponible: $FREE_MEM"
echo -e "  Espacio en disco disponible: $DISK_AVAIL"

# Verificar CPU (para Raspberry Pi específicamente)
if [ -f "/proc/cpuinfo" ]; then
    CPU_MODEL=$(grep "Model" /proc/cpuinfo | head -n1 | cut -d: -f2 | xargs)
    if [ ! -z "$CPU_MODEL" ]; then
        echo -e "  CPU: $CPU_MODEL"
    fi
fi
echo ""

# Verificar archivos necesarios
echo -e "${BLUE}7. Verificando archivos de deployment:${NC}"
FILES=("Dockerfile" "nginx.conf" "deploy.sh" "k8s/deployment.yaml" "k8s/service.yaml" "k8s/ingress.yaml")
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file NO encontrado"
        ERRORS=$((ERRORS + 1))
    fi
done
echo ""

# Verificar configuración de red
echo -e "${BLUE}8. Verificando configuración de red:${NC}"
NODE_IP=$(hostname -I | awk '{print $1}')
echo -e "  IP del nodo: ${GREEN}$NODE_IP${NC}"
echo -e "  La aplicación será accesible en: ${BLUE}https://$NODE_IP/gestion-herencia/${NC}"
echo ""

# Resumen
echo -e "${BLUE}========================================${NC}"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}  ✓ Sistema listo para deployment${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo -e "Puedes proceder con el deployment ejecutando:"
    echo -e "${GREEN}  ./deploy.sh${NC}"
else
    echo -e "${RED}  ✗ Se encontraron $ERRORS error(es)${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo -e "Por favor, corrige los errores antes de continuar"
fi
echo ""
