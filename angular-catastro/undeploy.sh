#!/bin/bash

###############################################################################
# Script de Undeploy para Gestion Herencia en k3s
#
# Este script elimina el deployment de la aplicación del cluster k3s
#
# Uso:
#   ./undeploy.sh [opciones]
#
# Opciones:
#   --namespace NAME   Namespace de k3s (default: herencia)
#   --delete-images    Elimina también las imágenes Docker/k3s
#   --delete-namespace Elimina el namespace completo
#   --force            No pide confirmación
#   --help             Muestra esta ayuda
#
###############################################################################

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuración por defecto
NAMESPACE="herencia"
DELETE_IMAGES=false
DELETE_NAMESPACE=false
FORCE=false
IMAGE_NAME="gestion-herencia-frontend"
IMAGE_TAG="latest"

# Funciones de impresión
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Función para mostrar ayuda
show_help() {
    echo "Uso: ./undeploy.sh [opciones]"
    echo ""
    echo "Opciones:"
    echo "  --namespace NAME       Namespace de k3s (default: herencia)"
    echo "  --delete-images        Elimina también las imágenes Docker/k3s"
    echo "  --delete-namespace     Elimina el namespace completo"
    echo "  --force                No pide confirmación"
    echo "  --help                 Muestra esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  ./undeploy.sh                              # Elimina solo el deployment"
    echo "  ./undeploy.sh --delete-images              # Elimina deployment e imágenes"
    echo "  ./undeploy.sh --delete-namespace --force   # Elimina todo sin confirmación"
    exit 0
}

# Parsear argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        --namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        --delete-images)
            DELETE_IMAGES=true
            shift
            ;;
        --delete-namespace)
            DELETE_NAMESPACE=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --help)
            show_help
            ;;
        *)
            print_error "Opción desconocida: $1"
            show_help
            ;;
    esac
done

# Banner
clear
echo ""
echo -e "${RED}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║                                                                   ║${NC}"
echo -e "${RED}║            🗑️  UNDEPLOY GESTION HERENCIA - k3s 🗑️                ║${NC}"
echo -e "${RED}║                                                                   ║${NC}"
echo -e "${RED}╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

print_warning "ADVERTENCIA: Esta operación eliminará el deployment"
echo ""
print_info "Configuración:"
echo "  • Namespace: $NAMESPACE"
echo "  • Eliminar imágenes: $DELETE_IMAGES"
echo "  • Eliminar namespace: $DELETE_NAMESPACE"
echo ""

# Verificar que el namespace existe
if ! sudo kubectl get namespace $NAMESPACE &> /dev/null; then
    print_error "El namespace $NAMESPACE no existe"
    exit 1
fi

# Mostrar recursos actuales
print_info "Recursos actuales en namespace $NAMESPACE:"
echo ""
sudo kubectl get all -n $NAMESPACE
echo ""

# Confirmar eliminación
if [ "$FORCE" = false ]; then
    read -p "¿Estás seguro de que deseas eliminar estos recursos? (s/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        print_warning "Undeploy cancelado por el usuario"
        exit 0
    fi
fi

###############################################################################
# PASO 1: Eliminar recursos de Kubernetes
###############################################################################

print_header "PASO 1: Eliminar recursos de Kubernetes"

if [ ! -d "../k8s" ]; then
    print_warning "No se encuentra el directorio k8s, eliminando por labels..."
    sudo kubectl delete deployment,service,ingress -l app=gestion-herencia -n $NAMESPACE
else
    print_info "Eliminando recursos usando manifiestos..."
    sudo kubectl delete -f ../k8s/ -n $NAMESPACE --ignore-not-found=true
fi

print_success "Recursos de Kubernetes eliminados"

###############################################################################
# PASO 2: Eliminar imágenes (opcional)
###############################################################################

if [ "$DELETE_IMAGES" = true ]; then
    print_header "PASO 2: Eliminar imágenes Docker/k3s"

    print_info "Eliminando imagen de k3s..."
    sudo k3s ctr images rm docker.io/library/$IMAGE_NAME:$IMAGE_TAG 2>/dev/null || true
    print_success "Imagen eliminada de k3s"

    print_info "Eliminando imagen de Docker..."
    sudo docker rmi $IMAGE_NAME:$IMAGE_TAG 2>/dev/null || true
    print_success "Imagen eliminada de Docker"
else
    print_header "PASO 2: Eliminar imágenes (OMITIDO)"
    print_info "Las imágenes Docker/k3s se mantienen"
fi

###############################################################################
# PASO 3: Eliminar namespace (opcional)
###############################################################################

if [ "$DELETE_NAMESPACE" = true ]; then
    print_header "PASO 3: Eliminar namespace"

    print_warning "Eliminando namespace $NAMESPACE..."
    print_warning "Esto eliminará TODOS los recursos en el namespace"

    if [ "$FORCE" = false ]; then
        read -p "¿Estás ABSOLUTAMENTE seguro? (s/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Ss]$ ]]; then
            print_warning "Eliminación de namespace cancelada"
        else
            sudo kubectl delete namespace $NAMESPACE
            print_success "Namespace $NAMESPACE eliminado"
        fi
    else
        sudo kubectl delete namespace $NAMESPACE
        print_success "Namespace $NAMESPACE eliminado"
    fi
else
    print_header "PASO 3: Eliminar namespace (OMITIDO)"
    print_info "El namespace $NAMESPACE se mantiene"
fi

###############################################################################
# RESUMEN
###############################################################################

print_header "RESUMEN"

print_success "Undeploy completado"
echo ""

if [ "$DELETE_NAMESPACE" = false ]; then
    print_info "Verificando recursos restantes en $NAMESPACE:"
    echo ""
    sudo kubectl get all -n $NAMESPACE || print_info "No hay recursos en el namespace"
    echo ""
fi

if [ "$DELETE_IMAGES" = false ]; then
    print_info "Imágenes Docker disponibles:"
    echo ""
    sudo docker images | grep $IMAGE_NAME || print_info "No hay imágenes Docker"
    echo ""
fi

print_info "Para volver a desplegar:"
echo "  ./deploy.sh"
echo ""

print_success "¡Operación completada! 👋"
echo ""
