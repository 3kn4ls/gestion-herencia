# Guía de Despliegue en k3s (Raspberry Pi)

Esta guía te ayudará a desplegar la aplicación de Gestión de Herencias en un cluster k3s montado en una Raspberry Pi, accesible desde `HOST/herencia`.

## 📋 Requisitos Previos

### En el Servidor (Raspberry Pi)

1. **k3s instalado y funcionando**
   ```bash
   # Verificar que k3s está corriendo
   sudo systemctl status k3s

   # Verificar acceso a kubectl
   sudo kubectl get nodes
   ```

2. **Docker o containerd** (k3s viene con containerd por defecto)

3. **Git** para clonar el repositorio
   ```bash
   sudo apt-get update
   sudo apt-get install -y git
   ```

### En tu Máquina de Desarrollo (opcional)

- Node.js 18 o superior (si quieres compilar localmente)
- Docker (si quieres construir la imagen localmente)

## 🚀 Proceso de Despliegue

### Opción A: Build y Deploy Directo en el Servidor

Este es el método recomendado para Raspberry Pi, ya que construye la imagen directamente en la arquitectura ARM.

#### 1. Clonar el Repositorio en el Servidor

```bash
# Conectar al servidor por SSH
ssh usuario@tu-raspberry-pi

# Clonar el repositorio
cd ~
git clone https://github.com/3kn4ls/gestion-herencia.git
cd gestion-herencia
```

#### 2. Construir la Imagen Docker

```bash
# Navegar al directorio del frontend
cd angular-catastro

# Construir la imagen (esto puede tardar en Raspberry Pi)
sudo docker build -t gestion-herencia-frontend:latest .

# Verificar que la imagen se creó correctamente
sudo docker images | grep gestion-herencia
```

**Nota**: El build puede tardar entre 10-30 minutos en una Raspberry Pi dependiendo del modelo.

#### 3. Importar la Imagen a k3s

k3s usa containerd por defecto, así que necesitamos importar la imagen:

```bash
# Opción 1: Guardar y cargar la imagen
sudo docker save gestion-herencia-frontend:latest | sudo k3s ctr images import -

# Opción 2: Si usas ctr-tool directamente
sudo docker save gestion-herencia-frontend:latest -o /tmp/herencia.tar
sudo k3s ctr images import /tmp/herencia.tar
rm /tmp/herencia.tar

# Verificar que la imagen está disponible en k3s
sudo k3s ctr images ls | grep gestion-herencia
```

#### 4. Crear Namespace (Opcional pero Recomendado)

```bash
# Volver al directorio raíz del proyecto
cd /home/usuario/gestion-herencia

# Crear namespace para la aplicación
sudo kubectl create namespace herencia

# O usar el namespace default (no recomendado)
```

#### 5. Desplegar los Manifiestos de Kubernetes

```bash
# Si creaste un namespace
sudo kubectl apply -f k8s/ -n herencia

# Si usas el namespace default
sudo kubectl apply -f k8s/
```

#### 6. Verificar el Despliegue

```bash
# Ver los pods
sudo kubectl get pods -n herencia

# Ver el deployment
sudo kubectl get deployment -n herencia

# Ver el servicio
sudo kubectl get service -n herencia

# Ver el ingress
sudo kubectl get ingress -n herencia

# Ver logs de los pods
sudo kubectl logs -f deployment/gestion-herencia -n herencia

# Describir el pod para ver posibles errores
sudo kubectl describe pod -l app=gestion-herencia -n herencia
```

Deberías ver algo como:
```
NAME                                READY   STATUS    RESTARTS   AGE
gestion-herencia-xxxxxxxxx-xxxxx    1/1     Running   0          30s
gestion-herencia-xxxxxxxxx-xxxxx    1/1     Running   0          30s
```

#### 7. Acceder a la Aplicación

La aplicación debería estar accesible en:

```
http://TU_RASPBERRY_PI_IP/herencia/
```

Por ejemplo:
- `http://192.168.1.100/herencia/`
- `http://raspberrypi.local/herencia/`
- `http://tu-dominio.com/herencia/`

### Opción B: Build en Máquina Local y Push a Registry

Si tienes un registry privado o quieres usar Docker Hub:

#### 1. Build Multi-arquitectura (en tu máquina local)

```bash
cd angular-catastro

# Build para ARM64 (Raspberry Pi 4) y AMD64
docker buildx build --platform linux/arm64,linux/amd64 \
  -t tu-usuario/gestion-herencia-frontend:latest \
  --push .
```

#### 2. Modificar deployment.yaml

```yaml
# Cambiar en k8s/deployment.yaml
spec:
  template:
    spec:
      containers:
      - name: frontend
        image: tu-usuario/gestion-herencia-frontend:latest
        imagePullPolicy: Always  # Cambiar a Always
```

#### 3. Aplicar en el Servidor

```bash
ssh usuario@raspberry-pi
cd ~/gestion-herencia
sudo kubectl apply -f k8s/ -n herencia
```

## 🔧 Configuración Avanzada

### Configurar un Dominio Específico

Si quieres que la aplicación solo responda a un dominio específico:

```yaml
# En k8s/ingress.yaml
spec:
  rules:
  - host: mi-dominio.com  # Añadir esta línea
    http:
      paths:
      - path: /herencia
        pathType: Prefix
        backend:
          service:
            name: gestion-herencia
            port:
              number: 80
```

### Habilitar HTTPS con Let's Encrypt

```bash
# Instalar cert-manager
sudo kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Crear emisor de certificados (cambiar tu-email@ejemplo.com)
cat <<EOF | sudo kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: tu-email@ejemplo.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: traefik
EOF

# Modificar ingress.yaml para usar TLS
# Añadir estas anotaciones:
metadata:
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    traefik.ingress.kubernetes.io/router.entrypoints: websecure
    traefik.ingress.kubernetes.io/router.tls: "true"
spec:
  tls:
  - hosts:
    - mi-dominio.com
    secretName: herencia-tls
  rules:
  - host: mi-dominio.com
    http:
      paths:
      - path: /herencia
        pathType: Prefix
        backend:
          service:
            name: gestion-herencia
            port:
              number: 80
```

### Ajustar Recursos para Raspberry Pi

Si tu Raspberry Pi tiene recursos limitados:

```yaml
# En k8s/deployment.yaml
spec:
  replicas: 1  # Reducir a 1 réplica
  template:
    spec:
      containers:
      - name: frontend
        resources:
          requests:
            cpu: 25m      # Reducir CPU
            memory: 32Mi  # Reducir memoria
          limits:
            cpu: 100m
            memory: 64Mi
```

## 🔄 Actualizar la Aplicación

Cuando hagas cambios en el código:

```bash
# 1. Rebuild la imagen
cd ~/gestion-herencia/angular-catastro
sudo docker build -t gestion-herencia-frontend:latest .

# 2. Reimportar a k3s
sudo docker save gestion-herencia-frontend:latest | sudo k3s ctr images import -

# 3. Reiniciar el deployment
sudo kubectl rollout restart deployment/gestion-herencia -n herencia

# 4. Ver el progreso
sudo kubectl rollout status deployment/gestion-herencia -n herencia
```

## 🐛 Troubleshooting

### Los Pods no Inician

```bash
# Ver eventos del pod
sudo kubectl describe pod -l app=gestion-herencia -n herencia

# Ver logs
sudo kubectl logs -l app=gestion-herencia -n herencia

# Verificar que la imagen existe
sudo k3s ctr images ls | grep gestion-herencia
```

### La Aplicación no es Accesible

```bash
# Verificar el ingress
sudo kubectl get ingress -n herencia
sudo kubectl describe ingress gestion-herencia -n herencia

# Verificar Traefik
sudo kubectl get pods -n kube-system | grep traefik

# Ver logs de Traefik
sudo kubectl logs -n kube-system -l app.kubernetes.io/name=traefik

# Probar acceso directo al servicio (port-forward)
sudo kubectl port-forward -n herencia svc/gestion-herencia 8080:80
# Luego abre http://localhost:8080/herencia/
```

### Error 404 en Rutas Internas de Angular

Si las rutas de Angular dan 404, verifica:

1. El `base href` en `index.html` debe ser `/herencia/`
2. El Ingress debe tener `pathType: Prefix`
3. Nginx debe tener el `try_files` configurado correctamente

### La Aplicación Muestra Errores de Assets

```bash
# Verificar que los archivos se construyeron correctamente
sudo docker run --rm gestion-herencia-frontend:latest ls -la /usr/share/nginx/html/herencia/

# Debería mostrar index.html, assets/, etc.
```

### Problemas de Memoria en Raspberry Pi

```bash
# Ver uso de recursos
sudo kubectl top nodes
sudo kubectl top pods -n herencia

# Si es necesario, reducir las réplicas
sudo kubectl scale deployment/gestion-herencia --replicas=1 -n herencia
```

## 🗑️ Eliminar el Despliegue

```bash
# Eliminar todos los recursos
sudo kubectl delete -f k8s/ -n herencia

# Eliminar el namespace (si lo creaste)
sudo kubectl delete namespace herencia

# Eliminar la imagen de k3s
sudo k3s ctr images rm docker.io/library/gestion-herencia-frontend:latest

# Eliminar la imagen de Docker
sudo docker rmi gestion-herencia-frontend:latest
```

## 📝 Resumen de Comandos Rápidos

```bash
# Build y despliegue rápido
cd ~/gestion-herencia/angular-catastro
sudo docker build -t gestion-herencia-frontend:latest .
sudo docker save gestion-herencia-frontend:latest | sudo k3s ctr images import -
cd ..
sudo kubectl apply -f k8s/ -n herencia

# Verificar estado
sudo kubectl get all -n herencia

# Ver logs
sudo kubectl logs -f -l app=gestion-herencia -n herencia

# Acceder: http://TU_IP/herencia/
```

## 📚 Recursos Adicionales

- [Documentación de k3s](https://docs.k3s.io/)
- [Documentación de Traefik](https://doc.traefik.io/traefik/)
- [Documentación de Angular](https://angular.io/docs)
- [Best Practices para Kubernetes](https://kubernetes.io/docs/concepts/configuration/overview/)

## ⚠️ Notas Importantes

1. **Seguridad**: Esta configuración es básica. Para producción, considera:
   - Habilitar HTTPS con certificados SSL
   - Configurar Network Policies
   - Limitar acceso con autenticación
   - Realizar backups regulares

2. **Performance**: En Raspberry Pi:
   - El build inicial puede tardar mucho tiempo
   - Considera construir en una máquina más potente y usar registry
   - Ajusta los recursos según tu modelo de Raspberry Pi

3. **Base Path**: La aplicación está configurada para `/herencia/`. Si necesitas cambiarla:
   - Modifica `base href` en `src/index.html`
   - Modifica el path en `k8s/ingress.yaml`
   - Modifica la configuración de Nginx en `nginx.conf`
   - Rebuild la imagen

## 🎉 ¡Listo!

Tu aplicación debería estar corriendo en `http://TU_IP/herencia/`

Si tienes problemas, revisa la sección de Troubleshooting o abre un issue en el repositorio.
