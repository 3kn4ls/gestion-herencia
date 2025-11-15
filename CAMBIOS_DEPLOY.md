# Cambios en el Sistema de Despliegue

## Fecha: 2025-11-15

### Problema Original
- El frontend daba errores 404 al intentar acceder a `/herencia/api/propiedades` y `/herencia/api/valores-tasacion`
- El Service Worker causaba problemas de caché
- El middleware de Traefik no estaba configurado correctamente

### Cambios Realizados

#### 1. Service Worker Eliminado
**Archivos modificados:**
- `angular-catastro/angular.json` - Eliminadas líneas `serviceWorker` y `ngswConfigPath`
- `angular-catastro/src/main.ts` - Eliminado `provideServiceWorker`
- `angular-catastro/ngsw-config.json` - Añadida configuración para no cachear API (aunque ya no se usa)

#### 2. Configuración de Kubernetes

**Archivos nuevos:**
- `k8s/ingress-backend.yaml` - Ingress para el API con middleware strip-herencia-api
- `k8s/ingress-frontend.yaml` - Ingress para el frontend sin middleware

**Archivos modificados:**
- `k8s/middleware.yaml` - Cambiado de `/herencia/api` a `/herencia` para el stripPrefix
- `k8s/ingress.yaml` - Renombrado a `ingress.yaml.old` (obsoleto)
- `k8s/ingressroute.yaml` - Renombrado a `ingressroute.yaml.old` (obsoleto)

**Recursos eliminados:**
- IngressRoute `gestion-herencia-https`
- IngressRoute `gestion-herencia-local`

#### 3. Script de Despliegue

**Archivo modificado:**
- `deploy.sh` - Añadida sección "CONFIGURACIÓN KUBERNETES" que aplica:
  - middleware.yaml
  - service.yaml
  - backend-service.yaml
  - deployment.yaml
  - backend-deployment.yaml
  - ingress-frontend.yaml
  - ingress-backend.yaml

### Configuración Final

#### Middleware
```yaml
# k8s/middleware.yaml
prefixes:
  - /herencia
```
Transforma: `/herencia/api/propiedades` → `/api/propiedades`

#### Ingress Backend
- Path: `/herencia/api`
- Middleware: `herencia-strip-herencia-api@kubernetescrd`
- Service: `gestion-herencia-backend:3000`

#### Ingress Frontend
- Path: `/herencia`
- Middleware: Solo `kube-system-https-redirect`
- Service: `gestion-herencia:80`

### Acceso a la Aplicación

- **Frontend:** https://northr3nd.duckdns.org/herencia/
- **API:** https://northr3nd.duckdns.org/herencia/api/propiedades

**Nota:** El middleware `kube-system-https-redirect` redirige automáticamente HTTP → HTTPS

### Comandos Útiles

```bash
# Desplegar completo
./deploy.sh

# Solo frontend
./deploy.sh --frontend-only

# Solo backend
./deploy.sh --backend-only

# Sin rebuild (solo redeploy)
./deploy.sh --no-build

# Ver logs
sudo kubectl logs -f -l app=gestion-herencia -n herencia
sudo kubectl logs -f -l app=gestion-herencia-backend -n herencia

# Ver estado
sudo kubectl get pods -n herencia
sudo kubectl get ingress -n herencia
sudo kubectl get middleware -n herencia
```

### Notas Importantes

1. **Dos Ingress separados:** Backend y Frontend tienen Ingress independientes porque solo el backend necesita el middleware para eliminar el prefijo `/herencia`.

2. **Sin Service Worker:** El Service Worker ha sido completamente eliminado para evitar problemas de caché.

3. **Certificado TLS:** El Ingress usa cert-manager para generar automáticamente certificados Let's Encrypt.

4. **Patrón consistente:** La configuración sigue el mismo patrón que otros servicios en el cluster (k3s-admin, blinds-control, etc.).
