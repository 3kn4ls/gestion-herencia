# Guía de Despliegue en k3s (Raspberry Pi 5)

Esta guía te ayudará a desplegar la aplicación Gestión Herencia en un cluster k3s corriendo en Raspberry Pi 5.

## Requisitos Previos

### En la Raspberry Pi 5:

1. **k3s instalado y corriendo**
   ```bash
   # Verificar que k3s está corriendo
   sudo systemctl status k3s

   # Si no está instalado, instalar k3s
   curl -sfL https://get.k3s.io | sh -
   ```

2. **Docker instalado**
   ```bash
   # Verificar Docker
   docker --version

   # Si no está instalado
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   ```

3. **kubectl configurado**
   ```bash
   # k3s incluye kubectl, crear alias si es necesario
   mkdir -p ~/.kube
   sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
   sudo chown $USER:$USER ~/.kube/config

   # O usar el kubectl de k3s directamente
   sudo k3s kubectl get nodes
   ```

### Opcional: Registry Local (Recomendado para desarrollo)

Si quieres usar un registry local para agilizar los deployments:

```bash
# Crear registry local en Docker
docker run -d -p 5000:5000 --restart=always --name registry registry:2

# Configurar k3s para usar registry inseguro
sudo nano /etc/rancher/k3s/registries.yaml
```

Añadir:
```yaml
mirrors:
  "localhost:5000":
    endpoint:
      - "http://localhost:5000"
configs:
  "localhost:5000":
    tls:
      insecure_skip_verify: true
```

Luego reiniciar k3s:
```bash
sudo systemctl restart k3s
```

## Proceso de Despliegue

### 1. Clonar/Actualizar el Repositorio

```bash
# Si aún no has clonado el repo
git clone <tu-repositorio-url> /home/user/gestion-herencia
cd /home/user/gestion-herencia

# Si ya existe, actualizar
cd /home/user/gestion-herencia
git pull origin main
```

### 2. Ir al directorio de la aplicación Angular

```bash
cd angular-catastro
```

### 3. Ejecutar el script de deployment

```bash
./deploy.sh
```

El script hará automáticamente:
- ✅ Verificar que Docker y k3s están disponibles
- ✅ Construir la imagen Docker con la aplicación Angular
- ✅ Subir la imagen al registry local (o importarla a k3s directamente)
- ✅ Aplicar los manifiestos de Kubernetes (Deployment, Service, Ingress)
- ✅ Esperar a que los pods estén listos
- ✅ Mostrar el estado del despliegue

### 4. Verificar el despliegue

```bash
# Ver pods
kubectl get pods -l app=gestion-herencia

# Ver servicios
kubectl get svc -l app=gestion-herencia

# Ver ingress
kubectl get ingress gestion-herencia

# Ver logs
kubectl logs -f deployment/gestion-herencia
```

## Acceder a la Aplicación

Una vez desplegada, la aplicación estará disponible en:

- **Desde la red local:** `https://<IP-RASPBERRY>/gestion-herencia/`
- **Desde el servidor:** `https://localhost/gestion-herencia/`

### Obtener la IP de la Raspberry Pi:

```bash
hostname -I | awk '{print $1}'
```

## Configuración SSL/TLS

Por defecto, k3s viene con Traefik que genera certificados automáticamente. Para producción, puedes:

### Opción 1: Usar cert-manager con Let's Encrypt

```bash
# Instalar cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Crear un ClusterIssuer para Let's Encrypt
# (Ver documentación de cert-manager)
```

### Opción 2: Usar certificados propios

Crear un Secret con tu certificado:

```bash
kubectl create secret tls gestion-herencia-tls \
  --cert=path/to/tls.crt \
  --key=path/to/tls.key \
  -n default
```

Luego descomentar en `k8s/ingress.yaml`:
```yaml
tls:
  - hosts:
    - tu-dominio.com
    secretName: gestion-herencia-tls
```

## Comandos Útiles

### Gestión del Despliegue

```bash
# Ver todos los recursos
kubectl get all -l app=gestion-herencia

# Escalar pods
kubectl scale deployment/gestion-herencia --replicas=3

# Reiniciar deployment (forzar recreación de pods)
kubectl rollout restart deployment/gestion-herencia

# Ver historial de deployments
kubectl rollout history deployment/gestion-herencia

# Rollback a versión anterior
kubectl rollout undo deployment/gestion-herencia
```

### Debugging

```bash
# Ver logs en tiempo real
kubectl logs -f deployment/gestion-herencia

# Ver logs de un pod específico
kubectl logs <pod-name>

# Entrar a un pod
kubectl exec -it <pod-name> -- sh

# Ver eventos
kubectl get events --sort-by='.lastTimestamp'

# Describir recursos para troubleshooting
kubectl describe deployment gestion-herencia
kubectl describe pod <pod-name>
kubectl describe ingress gestion-herencia
```

### Monitorización

```bash
# Ver uso de recursos
kubectl top nodes
kubectl top pods -l app=gestion-herencia

# Ver estado detallado
kubectl get pods -o wide
```

## Re-despliegue

Para redesplegar después de cambios en el código:

```bash
cd /home/user/gestion-herencia
git pull origin main
cd angular-catastro
./deploy.sh
```

El script detectará cambios y actualizará automáticamente el deployment.

## Eliminación

Para eliminar completamente el despliegue:

```bash
# Eliminar todos los recursos
kubectl delete -f k8s/

# O individualmente
kubectl delete deployment gestion-herencia
kubectl delete service gestion-herencia
kubectl delete ingress gestion-herencia
```

## Troubleshooting

### Los pods no inician

```bash
# Ver detalles del pod
kubectl describe pod <pod-name>

# Ver logs
kubectl logs <pod-name>

# Verificar que la imagen está disponible
sudo k3s ctr images ls | grep gestion-herencia
```

### La aplicación no es accesible

```bash
# Verificar que el ingress está configurado
kubectl get ingress gestion-herencia

# Verificar que Traefik está corriendo
kubectl get pods -n kube-system | grep traefik

# Ver logs de Traefik
kubectl logs -n kube-system deployment/traefik
```

### Problemas con el registry

```bash
# Verificar que el registry está corriendo
curl http://localhost:5000/v2/

# Ver imágenes en el registry
curl http://localhost:5000/v2/_catalog

# Reiniciar el registry
docker restart registry
```

### Error "ImagePullBackOff"

Si ves este error, significa que k3s no puede obtener la imagen. Soluciones:

```bash
# Verificar que la imagen existe
docker images | grep gestion-herencia

# Reimportar la imagen manualmente
docker save gestion-herencia:latest -o /tmp/gestion.tar
sudo k3s ctr images import /tmp/gestion.tar
sudo k3s ctr images tag docker.io/library/gestion-herencia:latest localhost:5000/gestion-herencia:latest
rm /tmp/gestion.tar

# Reiniciar el deployment
kubectl rollout restart deployment/gestion-herencia
```

## Configuración Avanzada

### Cambiar número de réplicas

Editar `k8s/deployment.yaml`:
```yaml
spec:
  replicas: 3  # Cambiar este número
```

Aplicar cambios:
```bash
kubectl apply -f k8s/deployment.yaml
```

### Configurar dominio personalizado

Editar `k8s/ingress.yaml`:
```yaml
spec:
  rules:
  - host: gestion.tudominio.com  # Tu dominio
    http:
      paths:
      - path: /gestion-herencia
        ...
```

### Ajustar recursos

Editar `k8s/deployment.yaml`:
```yaml
resources:
  requests:
    memory: "128Mi"  # Mínimo requerido
    cpu: "200m"
  limits:
    memory: "512Mi"  # Máximo permitido
    cpu: "1000m"
```

## Estructura de Archivos

```
angular-catastro/
├── Dockerfile              # Construcción de la imagen Docker
├── nginx.conf              # Configuración de nginx
├── deploy.sh               # Script de despliegue automatizado
├── .dockerignore           # Archivos a ignorar en build
├── k8s/                    # Manifiestos de Kubernetes
│   ├── deployment.yaml     # Definición del Deployment
│   ├── service.yaml        # Definición del Service
│   └── ingress.yaml        # Definición del Ingress
└── DEPLOYMENT.md           # Esta guía
```

## Notas Adicionales

- La aplicación se despliega en el namespace `default`
- Se crean 2 réplicas por defecto para alta disponibilidad
- El health check está configurado en `/health`
- Los assets se cachean por 1 año para mejor rendimiento
- El service worker y manifest no se cachean para actualizaciones rápidas
- La imagen se construye específicamente para ARM64 (Raspberry Pi 5)

## Soporte

Si encuentras problemas, verifica:

1. Logs del deployment: `kubectl logs -f deployment/gestion-herencia`
2. Estado de los pods: `kubectl get pods -l app=gestion-herencia`
3. Eventos del cluster: `kubectl get events --sort-by='.lastTimestamp'`
4. Logs de Traefik: `kubectl logs -n kube-system deployment/traefik`
