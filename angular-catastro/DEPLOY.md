# 🚀 Guía de Deploy - Gestion Herencia

Scripts automatizados para desplegar la aplicación Angular en k3s/Kubernetes.

## 📋 Requisitos Previos

### En el Servidor (Raspberry Pi / k3s)

- **k3s** instalado y funcionando
- **Docker** instalado
- **Node.js** 18+ y npm (para compilar)
- **kubectl** configurado

Verificar instalación:
```bash
k3s --version
docker --version
node --version
npm --version
kubectl version
```

## 🎯 Scripts Disponibles

### 1. `deploy.sh` - Deploy Completo

Automatiza todo el proceso de deploy:
1. ✅ Compila la aplicación Angular
2. 🐳 Construye la imagen Docker
3. 📦 Importa la imagen a k3s
4. ☸️ Despliega en Kubernetes
5. ✔️ Verifica el estado

**Uso básico:**
```bash
./deploy.sh
```

**Opciones disponibles:**
```bash
./deploy.sh --help                            # Mostrar ayuda

# Omitir pasos específicos
./deploy.sh --skip-build                       # No compilar Angular (usar build existente)
./deploy.sh --skip-docker                      # No construir imagen Docker (usar imagen existente)
./deploy.sh --skip-import                      # No importar a k3s (ya está importada)

# Namespace personalizado
./deploy.sh --namespace produccion             # Desplegar en namespace 'produccion'

# Combinar opciones
./deploy.sh --skip-build --namespace staging   # Build existente en namespace staging
```

**Proceso de deploy paso a paso:**

```
╔═══════════════════════════════════════════════════════════════════╗
║            🚀 DEPLOY GESTION HERENCIA - k3s 🚀                   ║
╚═══════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PASO 1: Compilar aplicación Angular
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ️  Instalando dependencias...
ℹ️  Compilando aplicación Angular...
✅ Compilación completada

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PASO 2: Construir imagen Docker
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ️  Construyendo imagen gestion-herencia-frontend:latest...
⚠️  Esto puede tardar varios minutos en Raspberry Pi...
✅ Imagen construida en 847 segundos

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PASO 3: Importar imagen a k3s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ️  Importando imagen a k3s...
✅ Imagen importada a k3s

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PASO 4: Desplegar en k3s
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ️  Aplicando manifiestos de Kubernetes...
✅ Manifiestos aplicados

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RESUMEN DEL DEPLOY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Deploy completado exitosamente

  📦 Imagen:     gestion-herencia-frontend:latest
  🏷️  Namespace:  herencia
  📊 Réplicas:   2/2 listas

ℹ️  Acceso a la aplicación:

  🌐 URL Local:   http://localhost/herencia/
  🌐 URL Red:     http://192.168.1.100/herencia/

✅ ¡Disfruta de tu aplicación! 🎉
```

### 2. `undeploy.sh` - Eliminar Deploy

Elimina el deployment de k3s de forma segura.

**Uso básico:**
```bash
./undeploy.sh
```

**Opciones disponibles:**
```bash
./undeploy.sh --help                           # Mostrar ayuda

# Eliminación completa
./undeploy.sh --delete-images                  # Elimina deployment + imágenes Docker/k3s
./undeploy.sh --delete-namespace               # Elimina namespace completo
./undeploy.sh --delete-images --delete-namespace --force  # Eliminación total sin confirmación

# Namespace personalizado
./undeploy.sh --namespace produccion           # Eliminar de namespace 'produccion'

# Sin confirmación
./undeploy.sh --force                          # No pide confirmación
```

**Proceso de undeploy:**

```
╔═══════════════════════════════════════════════════════════════════╗
║            🗑️  UNDEPLOY GESTION HERENCIA - k3s 🗑️                ║
╚═══════════════════════════════════════════════════════════════════╝

⚠️  ADVERTENCIA: Esta operación eliminará el deployment

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PASO 1: Eliminar recursos de Kubernetes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Recursos de Kubernetes eliminados

✅ Undeploy completado
```

## 📚 Ejemplos de Uso Común

### Deploy Inicial
```bash
# Primera vez - Deploy completo
./deploy.sh

# Acceder a la aplicación
# http://TU_IP/herencia/
```

### Actualización de Código
```bash
# Opción 1: Deploy completo (recomendado)
./deploy.sh

# Opción 2: Solo rebuild y redeploy
./deploy.sh --skip-install
```

### Deploy Rápido (imagen ya construida)
```bash
# Si ya tienes la imagen construida
./deploy.sh --skip-build --skip-docker
```

### Cambio de Namespace
```bash
# Deploy en namespace personalizado
./deploy.sh --namespace produccion

# Undeploy del namespace personalizado
./undeploy.sh --namespace produccion
```

### Limpieza Completa
```bash
# Eliminar todo (deployment + imágenes + namespace)
./undeploy.sh --delete-images --delete-namespace

# O con confirmación automática
./undeploy.sh --delete-images --delete-namespace --force
```

## 🔍 Comandos Útiles Post-Deploy

### Ver Logs en Tiempo Real
```bash
sudo kubectl logs -f -l app=gestion-herencia -n herencia
```

### Ver Estado de Pods
```bash
sudo kubectl get pods -n herencia
```

### Ver Todos los Recursos
```bash
sudo kubectl get all -n herencia
```

### Describir Pod (para debugging)
```bash
sudo kubectl describe pod <pod-name> -n herencia
```

### Reiniciar Deployment
```bash
sudo kubectl rollout restart deployment/gestion-herencia -n herencia
```

### Ver Historia de Rollouts
```bash
sudo kubectl rollout history deployment/gestion-herencia -n herencia
```

### Escalar Réplicas
```bash
# Aumentar a 3 réplicas
sudo kubectl scale deployment/gestion-herencia --replicas=3 -n herencia

# Reducir a 1 réplica (para Raspberry Pi con pocos recursos)
sudo kubectl scale deployment/gestion-herencia --replicas=1 -n herencia
```

### Ver Logs de un Pod Específico
```bash
sudo kubectl logs <pod-name> -n herencia --tail=100
```

### Acceder al Shell del Pod
```bash
sudo kubectl exec -it <pod-name> -n herencia -- /bin/sh
```

## 🐛 Troubleshooting

### Los Pods no Inician

```bash
# Ver eventos del deployment
sudo kubectl describe deployment gestion-herencia -n herencia

# Ver eventos del pod
sudo kubectl describe pod <pod-name> -n herencia

# Ver logs del pod
sudo kubectl logs <pod-name> -n herencia
```

**Problemas comunes:**
- **ImagePullBackOff**: La imagen no está en k3s → Re-ejecutar `./deploy.sh --skip-build`
- **CrashLoopBackOff**: Error en la aplicación → Verificar logs con `kubectl logs`
- **Pending**: Falta recursos → Reducir réplicas o liberar recursos

### La Imagen no se Importa

```bash
# Verificar que Docker tiene la imagen
sudo docker images | grep gestion-herencia

# Verificar que k3s tiene la imagen
sudo k3s ctr images ls | grep gestion-herencia

# Re-importar manualmente
sudo docker save gestion-herencia-frontend:latest | sudo k3s ctr images import -
```

### Error 404 en /herencia/

```bash
# Verificar el ingress
sudo kubectl get ingress -n herencia
sudo kubectl describe ingress gestion-herencia -n herencia

# Verificar logs de Traefik
sudo kubectl logs -n kube-system -l app.kubernetes.io/name=traefik
```

### Port-Forward para Debug

```bash
# Acceder directamente al pod sin pasar por Ingress
sudo kubectl port-forward -n herencia svc/gestion-herencia 8080:80

# Luego abrir: http://localhost:8080/herencia/
```

## ⚙️ Configuración Avanzada

### Modificar Recursos (CPU/Memoria)

Editar `../k8s/deployment.yaml`:

```yaml
resources:
  requests:
    cpu: 25m      # Reducir para Raspberry Pi
    memory: 32Mi
  limits:
    cpu: 100m
    memory: 64Mi
```

Luego re-desplegar:
```bash
./deploy.sh --skip-build --skip-docker
```

### Cambiar Número de Réplicas

Editar `../k8s/deployment.yaml`:

```yaml
spec:
  replicas: 1  # Cambiar de 2 a 1 para ahorrar recursos
```

### Variables de Entorno

Añadir en `../k8s/deployment.yaml`:

```yaml
spec:
  template:
    spec:
      containers:
      - name: frontend
        env:
        - name: ENV_VAR
          value: "valor"
```

## 📊 Monitoreo

### Dashboard de k3s

```bash
# Si tienes el dashboard instalado
sudo kubectl proxy
# Abrir: http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/
```

### Métricas de Recursos

```bash
# Ver uso de CPU/Memoria de pods
sudo kubectl top pods -n herencia

# Ver uso de nodos
sudo kubectl top nodes
```

## 🔄 Workflow de Desarrollo

### Desarrollo Local → Production

1. **Desarrollo local:**
   ```bash
   npm start  # http://localhost:4200
   ```

2. **Test build:**
   ```bash
   npm run build
   ```

3. **Deploy a k3s:**
   ```bash
   ./deploy.sh
   ```

4. **Verificar:**
   ```bash
   http://TU_IP/herencia/
   ```

5. **Si hay problemas:**
   ```bash
   # Ver logs
   sudo kubectl logs -f -l app=gestion-herencia -n herencia

   # Undeploy y fix
   ./undeploy.sh
   # Fix del código
   ./deploy.sh
   ```

## 💡 Tips y Mejores Prácticas

### 1. **Builds Incrementales**
```bash
# Solo re-deploy sin rebuild (si no cambiaste código)
./deploy.sh --skip-build
```

### 2. **Cache de Docker**
Docker usa cache entre builds. Si cambias solo código Angular:
```bash
# El build será más rápido gracias al cache de dependencias
./deploy.sh
```

### 3. **Deploy en Múltiples Namespaces**
```bash
# Desarrollo
./deploy.sh --namespace desarrollo

# Staging
./deploy.sh --namespace staging

# Producción
./deploy.sh --namespace produccion
```

### 4. **Backup del Namespace**
```bash
# Exportar configuración
sudo kubectl get all -n herencia -o yaml > backup-herencia.yaml

# Restaurar
sudo kubectl apply -f backup-herencia.yaml
```

### 5. **Automatización con Cron**
```bash
# Añadir a crontab para deploy automático
# 0 2 * * * cd /path/to/angular-catastro && ./deploy.sh --force
```

## 📝 Logs y Debugging

### Ver Logs de Build
```bash
# Durante deploy, los logs se muestran en tiempo real
# Si necesitas re-ver logs:
npm run build 2>&1 | tee build.log
```

### Ver Logs Completos de Deploy
```bash
./deploy.sh 2>&1 | tee deploy.log
```

### Debugging de Nginx dentro del Pod
```bash
# Acceder al pod
sudo kubectl exec -it <pod-name> -n herencia -- /bin/sh

# Verificar archivos
ls -la /usr/share/nginx/html/herencia/

# Ver logs de Nginx
cat /var/log/nginx/error.log
cat /var/log/nginx/access.log
```

## 🆘 Soporte

Si encuentras problemas:

1. **Verificar logs:**
   ```bash
   sudo kubectl logs -f -l app=gestion-herencia -n herencia
   ```

2. **Ver estado:**
   ```bash
   sudo kubectl get all -n herencia
   ```

3. **Describir recursos:**
   ```bash
   sudo kubectl describe deployment gestion-herencia -n herencia
   ```

4. **Consultar documentación:**
   - [DESPLIEGUE-K3S.md](../DESPLIEGUE-K3S.md) - Guía completa de k3s
   - [README.md](../README.md) - Documentación general

## 🎉 ¡Listo!

Ahora tienes scripts automatizados para desplegar tu aplicación en k3s de forma rápida y confiable.

```bash
# Deploy completo
./deploy.sh

# Accede a tu app
# http://TU_IP/herencia/
```

¡Feliz deploy! 🚀
