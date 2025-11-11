#!/bin/bash

# Script para configurar un registry local en k3s
# Esto es OPCIONAL pero recomendado para agilizar los deployments

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Configurando registry local para k3s...${NC}"
echo ""

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker no está instalado. Instalando...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo -e "${GREEN}Docker instalado. Por favor, cierra la sesión y vuelve a iniciar para que los cambios surtan efecto.${NC}"
    exit 0
fi

# Verificar si ya existe un registry
if docker ps | grep -q "registry:2"; then
    echo -e "${GREEN}Ya existe un registry corriendo en localhost:5000${NC}"
else
    # Crear registry local
    echo -e "${YELLOW}Creando registry local en puerto 5000...${NC}"
    docker run -d \
        -p 5000:5000 \
        --restart=always \
        --name registry \
        -v registry-data:/var/lib/registry \
        registry:2

    echo -e "${GREEN}Registry creado exitosamente${NC}"
fi

# Configurar k3s para usar registry inseguro
echo -e "${YELLOW}Configurando k3s para usar el registry local...${NC}"

sudo mkdir -p /etc/rancher/k3s

# Crear archivo de configuración
sudo tee /etc/rancher/k3s/registries.yaml > /dev/null <<EOF
mirrors:
  "localhost:5000":
    endpoint:
      - "http://localhost:5000"
  "docker.io":
    endpoint:
      - "https://registry-1.docker.io"
configs:
  "localhost:5000":
    tls:
      insecure_skip_verify: true
EOF

echo -e "${GREEN}Archivo de configuración creado${NC}"

# Reiniciar k3s
echo -e "${YELLOW}Reiniciando k3s para aplicar cambios...${NC}"
sudo systemctl restart k3s

# Esperar a que k3s esté listo
echo -e "${YELLOW}Esperando a que k3s esté listo...${NC}"
sleep 10

# Verificar que k3s está corriendo
if sudo systemctl is-active --quiet k3s; then
    echo -e "${GREEN}k3s está corriendo correctamente${NC}"
else
    echo -e "${RED}Error: k3s no se inició correctamente${NC}"
    echo "Verifica los logs con: sudo journalctl -u k3s -f"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Registry local configurado${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Puedes verificar el registry con:"
echo -e "${BLUE}  curl http://localhost:5000/v2/${NC}"
echo ""
echo -e "Para ver las imágenes en el registry:"
echo -e "${BLUE}  curl http://localhost:5000/v2/_catalog${NC}"
echo ""
