# Configuración de Kubernetes

Este directorio contiene los manifiestos de Kubernetes para desplegar la aplicación Gestión de Herencias.

## Secrets y Configuración Sensible

### ⚠️ IMPORTANTE: No subir credenciales a Git

Los archivos que contienen información sensible **NO deben subirse al repositorio**:
- `secret-mongodb.yaml` - Contiene credenciales reales de MongoDB
- Cualquier otro archivo con sufijo `.yaml` en este directorio que no sea `.example`

### Configuración de MongoDB Secret

1. **Copiar el template:**
   ```bash
   cp secret-mongodb.yaml.example secret-mongodb.yaml
   ```

2. **Codificar tu MongoDB URI en base64:**
   ```bash
   echo -n 'mongodb://USER:PASSWORD@HOST:PORT/DATABASE?authSource=admin' | base64
   ```

3. **Editar `secret-mongodb.yaml`** y reemplazar `<BASE64_ENCODED_MONGODB_URI>` con el valor generado.

4. **Aplicar el secret:**
   ```bash
   kubectl apply -f secret-mongodb.yaml -n herencia
   ```

**Alternativa rápida:**
```bash
kubectl create secret generic mongodb-credentials \
  --from-literal='mongodb-uri=mongodb://USER:PASSWORD@HOST:PORT/DATABASE?authSource=admin' \
  -n herencia
```

## Despliegue

### Orden de aplicación:

1. **Crear namespace** (si no existe):
   ```bash
   kubectl create namespace herencia
   ```

2. **Aplicar secrets:**
   ```bash
   kubectl apply -f secret-mongodb.yaml -n herencia
   ```

3. **Aplicar manifiestos:**
   ```bash
   kubectl apply -f backend-deployment.yaml -n herencia
   kubectl apply -f backend-service.yaml -n herencia
   kubectl apply -f frontend-deployment.yaml -n herencia
   kubectl apply -f frontend-service.yaml -n herencia
   kubectl apply -f middleware.yaml -n herencia
   kubectl apply -f ingress.yaml -n herencia
   kubectl apply -f ingressroute.yaml -n herencia
   ```

### Verificar despliegue:

```bash
kubectl get pods,svc,ingress -n herencia
```

### Ver logs:

```bash
# Backend
kubectl logs -f -l app=gestion-herencia-backend -n herencia

# Frontend
kubectl logs -f -l app=gestion-herencia -n herencia
```

## Actualizar Secrets

Si necesitas actualizar las credenciales de MongoDB:

```bash
kubectl delete secret mongodb-credentials -n herencia
kubectl create secret generic mongodb-credentials \
  --from-literal='mongodb-uri=mongodb://NEW_USER:NEW_PASSWORD@HOST:PORT/DATABASE?authSource=admin' \
  -n herencia
kubectl rollout restart deployment/gestion-herencia-backend -n herencia
```
