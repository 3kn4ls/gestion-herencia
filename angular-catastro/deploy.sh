#!/bin/bash

set -e  # Salir en caso de error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables de configuración
IMAGE_NAME="gestion-herencia"
IMAGE_TAG="latest"
REGISTRY_HOST="localhost:5000"
NAMESPACE="default"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Despliegue de Gestión Herencia${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Función para mostrar mensajes
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    log_error "Este script debe ejecutarse desde el directorio angular-catastro"
    exit 1
fi

# Verificar que Docker está instalado
if ! command -v docker &> /dev/null; then
    log_error "Docker no está instalado. Por favor instala Docker primero."
    exit 1
fi

# Verificar que kubectl está instalado
if ! command -v kubectl &> /dev/null; then
    log_error "kubectl no está instalado. Por favor instala kubectl primero."
    exit 1
fi

# Verificar que k3s está corriendo
if ! kubectl cluster-info &> /dev/null; then
    log_error "No se puede conectar al cluster de k3s. Verifica que k3s está corriendo."
    exit 1
fi

log_info "Verificaciones previas completadas ✓"
echo ""

# Paso 1: Construir la imagen Docker
log_info "Paso 1/5: Construyendo imagen Docker..."
if docker build -t ${IMAGE_NAME}:${IMAGE_TAG} -f Dockerfile .; then
    log_info "Imagen construida exitosamente ✓"
else
    log_error "Error al construir la imagen Docker"
    exit 1
fi
echo ""

# Paso 2: Verificar si hay registry local o usar k3s ctr
log_info "Paso 2/5: Gestionando la imagen en k3s..."

# Verificar si hay un registry local corriendo
if curl -s http://${REGISTRY_HOST}/v2/ > /dev/null 2>&1; then
    log_info "Detectado registry local en ${REGISTRY_HOST}"

    # Etiquetar para el registry local
    docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${REGISTRY_HOST}/${IMAGE_NAME}:${IMAGE_TAG}

    # Subir al registry
    log_info "Subiendo imagen al registry local..."
    if docker push ${REGISTRY_HOST}/${IMAGE_NAME}:${IMAGE_TAG}; then
        log_info "Imagen subida al registry ✓"
    else
        log_error "Error al subir la imagen al registry"
        exit 1
    fi
else
    log_warn "No se detectó registry local, usando k3s ctr directamente"

    # Guardar la imagen en un archivo tar
    log_info "Exportando imagen Docker..."
    docker save ${IMAGE_NAME}:${IMAGE_TAG} -o /tmp/${IMAGE_NAME}.tar

    # Importar la imagen a k3s usando ctr
    log_info "Importando imagen a k3s..."
    if sudo k3s ctr images import /tmp/${IMAGE_NAME}.tar; then
        log_info "Imagen importada a k3s ✓"
        # Etiquetar para el registry local esperado por el deployment
        sudo k3s ctr images tag docker.io/library/${IMAGE_NAME}:${IMAGE_TAG} ${REGISTRY_HOST}/${IMAGE_NAME}:${IMAGE_TAG}
    else
        log_error "Error al importar la imagen a k3s"
        exit 1
    fi

    # Limpiar archivo temporal
    rm -f /tmp/${IMAGE_NAME}.tar
fi
echo ""

# Paso 3: Aplicar manifiestos de Kubernetes
log_info "Paso 3/5: Aplicando manifiestos de Kubernetes..."

# Crear namespace si no existe (aunque usamos default)
kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f - > /dev/null 2>&1

# Aplicar los manifiestos
if kubectl apply -f k8s/deployment.yaml && \
   kubectl apply -f k8s/service.yaml && \
   kubectl apply -f k8s/ingress.yaml; then
    log_info "Manifiestos aplicados exitosamente ✓"
else
    log_error "Error al aplicar los manifiestos"
    exit 1
fi
echo ""

# Paso 4: Esperar a que el deployment esté listo
log_info "Paso 4/5: Esperando a que el deployment esté listo..."
if kubectl rollout status deployment/gestion-herencia -n ${NAMESPACE} --timeout=300s; then
    log_info "Deployment listo ✓"
else
    log_error "Timeout esperando el deployment"
    log_warn "Ejecuta 'kubectl get pods -n ${NAMESPACE}' para ver el estado de los pods"
    exit 1
fi
echo ""

# Paso 5: Verificar el estado
log_info "Paso 5/5: Verificando el estado del despliegue..."
echo ""

# Mostrar pods
log_info "Pods en ejecución:"
kubectl get pods -n ${NAMESPACE} -l app=gestion-herencia

echo ""

# Mostrar servicios
log_info "Servicios:"
kubectl get svc -n ${NAMESPACE} -l app=gestion-herencia

echo ""

# Mostrar ingress
log_info "Ingress:"
kubectl get ingress -n ${NAMESPACE} gestion-herencia

echo ""

# Obtener la IP del nodo
NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Despliegue completado exitosamente${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "La aplicación debería estar accesible en:"
echo -e "${BLUE}  https://${NODE_IP}/gestion-herencia/${NC}"
echo -e "${BLUE}  https://localhost/gestion-herencia/${NC} (si estás en el servidor)"
echo ""
echo -e "Comandos útiles:"
echo -e "  Ver logs:        ${YELLOW}kubectl logs -f deployment/gestion-herencia -n ${NAMESPACE}${NC}"
echo -e "  Ver pods:        ${YELLOW}kubectl get pods -n ${NAMESPACE} -l app=gestion-herencia${NC}"
echo -e "  Escalar:         ${YELLOW}kubectl scale deployment/gestion-herencia --replicas=3 -n ${NAMESPACE}${NC}"
echo -e "  Reiniciar:       ${YELLOW}kubectl rollout restart deployment/gestion-herencia -n ${NAMESPACE}${NC}"
echo -e "  Eliminar:        ${YELLOW}kubectl delete -f k8s/${NC}"
echo ""
