#!/bin/bash

###############################################################################
# Script de Deploy para Gestion Herencia en k3s
#
# Este script automatiza el proceso completo de compilación y despliegue de
# la aplicación Angular en un cluster k3s.
#
# Uso:
#   ./deploy.sh [opciones]
#
# Opciones:
#   --skip-build       Omite la compilación de Angular
#   --skip-docker      Omite la construcción de la imagen Docker
#   --skip-import      Omite la importación a k3s
#   --backend-only     Solo despliega el backend
#   --frontend-only    Solo despliega el frontend
#   --namespace NAME   Namespace de k3s (default: herencia)
#   --help             Muestra esta ayuda
#
###############################################################################

set -e  # Salir si hay algún error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración por defecto
SKIP_BUILD=false
SKIP_DOCKER=false
SKIP_IMPORT=false
BACKEND_ONLY=false
FRONTEND_ONLY=false
NAMESPACE="herencia"
FRONTEND_IMAGE="gestion-herencia-frontend"
BACKEND_IMAGE="gestion-herencia-backend"
IMAGE_TAG="latest"

# Función para imprimir mensajes
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
    echo "Uso: ./deploy.sh [opciones]"
    echo ""
    echo "Opciones:"
    echo "  --skip-build       Omite la compilación de Angular"
    echo "  --skip-docker      Omite la construcción de la imagen Docker"
    echo "  --skip-import      Omite la importación a k3s"
    echo "  --backend-only     Solo despliega el backend"
    echo "  --frontend-only    Solo despliega el frontend (default: ambos)"
    echo "  --namespace NAME   Namespace de k3s (default: herencia)"
    echo "  --help             Muestra esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  ./deploy.sh                              # Deploy completo (frontend + backend)"
    echo "  ./deploy.sh --frontend-only              # Solo frontend"
    echo "  ./deploy.sh --backend-only               # Solo backend"
    echo "  ./deploy.sh --skip-build                 # Solo Docker y k8s"
    echo "  ./deploy.sh --namespace mi-namespace     # Deploy en namespace personalizado"
    exit 0
}

# Parsear argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-docker)
            SKIP_DOCKER=true
            shift
            ;;
        --skip-import)
            SKIP_IMPORT=true
            shift
            ;;
        --backend-only)
            BACKEND_ONLY=true
            FRONTEND_ONLY=false
            shift
            ;;
        --frontend-only)
            FRONTEND_ONLY=true
            BACKEND_ONLY=false
            shift
            ;;
        --namespace)
            NAMESPACE="$2"
            shift 2
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

# Determinar qué desplegar
DEPLOY_FRONTEND=true
DEPLOY_BACKEND=true

if [ "$FRONTEND_ONLY" = true ]; then
    DEPLOY_BACKEND=false
fi

if [ "$BACKEND_ONLY" = true ]; then
    DEPLOY_FRONTEND=false
fi

# Banner inicial
clear
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                                   ║${NC}"
echo -e "${GREEN}║            🚀 DEPLOY GESTION HERENCIA - k3s 🚀                   ║${NC}"
echo -e "${GREEN}║                                                                   ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

print_info "Configuración:"
echo "  • Namespace: $NAMESPACE"
echo "  • Desplegar Frontend: $DEPLOY_FRONTEND"
echo "  • Desplegar Backend: $DEPLOY_BACKEND"
echo "  • Skip build: $SKIP_BUILD"
echo "  • Skip docker: $SKIP_DOCKER"
echo "  • Skip import: $SKIP_IMPORT"
echo ""

# Confirmar ejecución
read -p "¿Deseas continuar? (s/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    print_warning "Deploy cancelado por el usuario"
    exit 0
fi

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    print_error "Error: No se encuentra package.json"
    print_error "Asegúrate de ejecutar este script desde el directorio angular-catastro"
    exit 1
fi

# Verificar que existe el Dockerfile
if [ ! -f "Dockerfile" ]; then
    print_error "Error: No se encuentra Dockerfile"
    exit 1
fi

###############################################################################
# PASO 1: Compilar la aplicación Angular (Frontend)
###############################################################################

if [ "$DEPLOY_FRONTEND" = true ] && [ "$SKIP_BUILD" = false ]; then
    print_header "PASO 1: Compilar aplicación Angular (Frontend)"

    print_info "Verificando dependencias de Node.js..."

    if ! command -v node &> /dev/null; then
        print_error "Node.js no está instalado"
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        print_error "npm no está instalado"
        exit 1
    fi

    print_success "Node.js $(node --version)"
    print_success "npm $(npm --version)"

    print_info "Instalando dependencias..."
    npm install

    print_info "Compilando aplicación Angular..."
    npm run build -- --configuration production --base-href /herencia/

    print_success "Compilación completada"

    # Verificar que se generó el build
    if [ ! -d "dist/angular-catastro" ]; then
        print_error "Error: No se generó el directorio dist/angular-catastro"
        exit 1
    fi

    print_success "Build generado en dist/angular-catastro"
elif [ "$DEPLOY_FRONTEND" = false ]; then
    print_header "PASO 1: Compilar aplicación Angular (NO REQUERIDO)"
else
    print_header "PASO 1: Compilar aplicación Angular (OMITIDO)"
fi

###############################################################################
# PASO 2: Construir imágenes Docker
###############################################################################

if [ "$SKIP_DOCKER" = false ]; then
    print_header "PASO 2: Construir imágenes Docker"

    print_info "Verificando Docker..."

    if ! command -v docker &> /dev/null; then
        print_error "Docker no está instalado"
        exit 1
    fi

    print_success "Docker instalado"

    # Construir imagen del frontend
    if [ "$DEPLOY_FRONTEND" = true ]; then
        print_info "Construyendo imagen frontend $FRONTEND_IMAGE:$IMAGE_TAG..."
        print_warning "Esto puede tardar varios minutos en Raspberry Pi..."

        START_TIME=$(date +%s)

        sudo docker build -t $FRONTEND_IMAGE:$IMAGE_TAG .

        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))

        print_success "Imagen frontend construida en $DURATION segundos"

        # Verificar que la imagen se creó
        if ! sudo docker images | grep -q $FRONTEND_IMAGE; then
            print_error "Error: La imagen frontend no se creó correctamente"
            exit 1
        fi

        print_success "Imagen $FRONTEND_IMAGE:$IMAGE_TAG creada"
    fi

    # Construir imagen del backend
    if [ "$DEPLOY_BACKEND" = true ]; then
        print_info "Construyendo imagen backend $BACKEND_IMAGE:$IMAGE_TAG..."

        if [ ! -d "../backend" ]; then
            print_error "Error: No se encuentra el directorio backend"
            exit 1
        fi

        START_TIME=$(date +%s)

        cd ../backend
        sudo docker build -t $BACKEND_IMAGE:$IMAGE_TAG .
        cd ../angular-catastro

        END_TIME=$(date +%s)
        DURATION=$((END_TIME - START_TIME))

        print_success "Imagen backend construida en $DURATION segundos"

        # Verificar que la imagen se creó
        if ! sudo docker images | grep -q $BACKEND_IMAGE; then
            print_error "Error: La imagen backend no se creó correctamente"
            exit 1
        fi

        print_success "Imagen $BACKEND_IMAGE:$IMAGE_TAG creada"
    fi
else
    print_header "PASO 2: Construir imágenes Docker (OMITIDO)"
fi

###############################################################################
# PASO 3: Importar imágenes a k3s
###############################################################################

if [ "$SKIP_IMPORT" = false ]; then
    print_header "PASO 3: Importar imágenes a k3s"

    print_info "Verificando k3s..."

    if ! command -v k3s &> /dev/null; then
        print_error "k3s no está instalado"
        exit 1
    fi

    print_success "k3s instalado"

    # Importar imagen frontend
    if [ "$DEPLOY_FRONTEND" = true ]; then
        print_info "Importando imagen frontend a k3s..."

        sudo docker save $FRONTEND_IMAGE:$IMAGE_TAG | sudo k3s ctr images import -

        print_success "Imagen frontend importada a k3s"

        # Verificar que la imagen está en k3s
        if ! sudo k3s ctr images ls | grep -q $FRONTEND_IMAGE; then
            print_error "Error: La imagen frontend no se importó correctamente a k3s"
            exit 1
        fi

        print_success "Imagen frontend disponible en k3s"
    fi

    # Importar imagen backend
    if [ "$DEPLOY_BACKEND" = true ]; then
        print_info "Importando imagen backend a k3s..."

        sudo docker save $BACKEND_IMAGE:$IMAGE_TAG | sudo k3s ctr images import -

        print_success "Imagen backend importada a k3s"

        # Verificar que la imagen está en k3s
        if ! sudo k3s ctr images ls | grep -q $BACKEND_IMAGE; then
            print_error "Error: La imagen backend no se importó correctamente a k3s"
            exit 1
        fi

        print_success "Imagen backend disponible en k3s"
    fi
else
    print_header "PASO 3: Importar imágenes a k3s (OMITIDO)"
fi

###############################################################################
# PASO 4: Desplegar en k3s
###############################################################################

print_header "PASO 4: Desplegar en k3s"

print_info "Verificando kubectl..."

if ! command -v kubectl &> /dev/null; then
    print_error "kubectl no está instalado"
    exit 1
fi

print_success "kubectl instalado"

# Verificar que existen los manifiestos
if [ ! -d "../k8s" ]; then
    print_error "Error: No se encuentra el directorio k8s"
    exit 1
fi

# Crear namespace si no existe
print_info "Verificando namespace $NAMESPACE..."

if ! sudo kubectl get namespace $NAMESPACE &> /dev/null; then
    print_warning "Namespace $NAMESPACE no existe, creándolo..."
    sudo kubectl create namespace $NAMESPACE
    print_success "Namespace $NAMESPACE creado"
else
    print_success "Namespace $NAMESPACE existe"
fi

# Aplicar manifiestos
print_info "Aplicando manifiestos de Kubernetes..."

# Aplicar manifiestos específicos según lo que se está desplegando
if [ "$DEPLOY_FRONTEND" = true ]; then
    sudo kubectl apply -f ../k8s/deployment.yaml -n $NAMESPACE
    sudo kubectl apply -f ../k8s/service.yaml -n $NAMESPACE
    print_success "Manifiestos frontend aplicados"
fi

if [ "$DEPLOY_BACKEND" = true ]; then
    sudo kubectl apply -f ../k8s/backend-deployment.yaml -n $NAMESPACE
    sudo kubectl apply -f ../k8s/backend-service.yaml -n $NAMESPACE
    print_success "Manifiestos backend aplicados"
fi

# Aplicar Ingress (siempre, ya que define rutas para ambos)
sudo kubectl apply -f ../k8s/ingress.yaml -n $NAMESPACE
print_success "Ingress aplicado"

# Esperar a que los pods estén listos
print_info "Esperando a que los pods estén listos..."

if [ "$DEPLOY_FRONTEND" = true ]; then
    sudo kubectl wait --for=condition=ready pod -l app=gestion-herencia -n $NAMESPACE --timeout=120s || {
        print_warning "Timeout esperando pods frontend. Verificando estado..."
        sudo kubectl get pods -l app=gestion-herencia -n $NAMESPACE
    }
fi

if [ "$DEPLOY_BACKEND" = true ]; then
    sudo kubectl wait --for=condition=ready pod -l app=gestion-herencia-backend -n $NAMESPACE --timeout=120s || {
        print_warning "Timeout esperando pods backend. Verificando estado..."
        sudo kubectl get pods -l app=gestion-herencia-backend -n $NAMESPACE
    }
fi

###############################################################################
# PASO 5: Verificar despliegue
###############################################################################

print_header "PASO 5: Verificar despliegue"

if [ "$DEPLOY_FRONTEND" = true ]; then
    print_info "Estado del deployment frontend:"
    sudo kubectl get deployment gestion-herencia -n $NAMESPACE

    echo ""
    print_info "Pods frontend:"
    sudo kubectl get pods -l app=gestion-herencia -n $NAMESPACE

    echo ""
    print_info "Servicio frontend:"
    sudo kubectl get service gestion-herencia -n $NAMESPACE
fi

if [ "$DEPLOY_BACKEND" = true ]; then
    echo ""
    print_info "Estado del deployment backend:"
    sudo kubectl get deployment gestion-herencia-backend -n $NAMESPACE

    echo ""
    print_info "Pods backend:"
    sudo kubectl get pods -l app=gestion-herencia-backend -n $NAMESPACE

    echo ""
    print_info "Servicio backend:"
    sudo kubectl get service gestion-herencia-backend -n $NAMESPACE
fi

echo ""
print_info "Ingress:"
sudo kubectl get ingress gestion-herencia -n $NAMESPACE

###############################################################################
# RESUMEN FINAL
###############################################################################

print_header "RESUMEN DEL DEPLOY"

echo ""
print_success "Deploy completado exitosamente"
echo ""

if [ "$DEPLOY_FRONTEND" = true ]; then
    # Obtener información del deployment frontend
    FRONTEND_REPLICAS=$(sudo kubectl get deployment gestion-herencia -n $NAMESPACE -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
    FRONTEND_DESIRED=$(sudo kubectl get deployment gestion-herencia -n $NAMESPACE -o jsonpath='{.status.replicas}' 2>/dev/null || echo "0")

    echo "  📦 Frontend:"
    echo "     Imagen:    $FRONTEND_IMAGE:$IMAGE_TAG"
    echo "     Réplicas:  $FRONTEND_REPLICAS/$FRONTEND_DESIRED listas"
fi

if [ "$DEPLOY_BACKEND" = true ]; then
    # Obtener información del deployment backend
    BACKEND_REPLICAS=$(sudo kubectl get deployment gestion-herencia-backend -n $NAMESPACE -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
    BACKEND_DESIRED=$(sudo kubectl get deployment gestion-herencia-backend -n $NAMESPACE -o jsonpath='{.status.replicas}' 2>/dev/null || echo "0")

    echo "  📦 Backend:"
    echo "     Imagen:    $BACKEND_IMAGE:$IMAGE_TAG"
    echo "     Réplicas:  $BACKEND_REPLICAS/$BACKEND_DESIRED listas"
fi

echo ""
echo "  🏷️  Namespace:  $NAMESPACE"
echo ""

# Obtener la IP del nodo
NODE_IP=$(hostname -I | awk '{print $1}')

print_info "Acceso a la aplicación:"
echo ""
if [ "$DEPLOY_FRONTEND" = true ]; then
    echo "  🌐 Frontend Local:  http://localhost/herencia/"
    echo "  🌐 Frontend Red:    http://$NODE_IP/herencia/"
fi
if [ "$DEPLOY_BACKEND" = true ]; then
    echo "  🔧 API Local:       http://localhost/api/"
    echo "  🔧 API Red:         http://$NODE_IP/api/"
    echo "  ❤️  Health Check:   http://localhost/health"
fi
echo ""

print_info "Comandos útiles:"
echo ""
if [ "$DEPLOY_FRONTEND" = true ]; then
    echo "  Ver logs frontend:"
    echo "    sudo kubectl logs -f -l app=gestion-herencia -n $NAMESPACE"
    echo ""
fi
if [ "$DEPLOY_BACKEND" = true ]; then
    echo "  Ver logs backend:"
    echo "    sudo kubectl logs -f -l app=gestion-herencia-backend -n $NAMESPACE"
    echo ""
fi
echo "  Ver estado de pods:"
echo "    sudo kubectl get pods -n $NAMESPACE"
echo ""
if [ "$DEPLOY_FRONTEND" = true ]; then
    echo "  Reiniciar frontend:"
    echo "    sudo kubectl rollout restart deployment/gestion-herencia -n $NAMESPACE"
    echo ""
fi
if [ "$DEPLOY_BACKEND" = true ]; then
    echo "  Reiniciar backend:"
    echo "    sudo kubectl rollout restart deployment/gestion-herencia-backend -n $NAMESPACE"
    echo ""
fi
echo "  Eliminar deployment:"
echo "    sudo kubectl delete -f ../k8s/ -n $NAMESPACE"
echo ""

print_success "¡Disfruta de tu aplicación! 🎉"
echo ""
