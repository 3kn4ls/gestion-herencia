# Gestión de Herencias - Sistema de Valoración Catastral

Sistema completo para la gestión y valoración de referencias catastrales para herencias, con frontend Angular y backend Express.js + MongoDB.

## 🚀 Despliegue Rápido

### Prerrequisitos

- Node.js 18+
- Docker
- k3s (Kubernetes)
- MongoDB (en ejecución)

### 📦 Primer Despliegue

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/3kn4ls/gestion-herencia.git
   cd gestion-herencia
   ```

2. **Configurar MongoDB Secret:**
   ```bash
   # Crear el secret de Kubernetes
   kubectl create secret generic mongodb-credentials \
     --from-literal='mongodb-uri=mongodb://USER:PASSWORD@HOST:PORT/DATABASE?authSource=admin' \
     -n herencia
   ```

3. **Configurar variables de entorno del backend:**
   ```bash
   cp backend/.env.example backend/.env
   # Editar backend/.env con tus credenciales
   ```

4. **Desplegar todo:**
   ```bash
   ./deploy.sh
   ```

## 🔄 Despliegue tras Cambios

### Opción 1: Desplegar Frontend y Backend (Cambios en ambos)
```bash
./deploy.sh
```

### Opción 2: Solo Frontend (Cambios solo en Angular)
```bash
./deploy.sh --frontend-only
```

### Opción 3: Solo Backend (Cambios solo en API)
```bash
./deploy.sh --backend-only
```

### Opción 4: Deploy rápido sin rebuild
Si ya tienes un build reciente y solo quieres actualizar la imagen:
```bash
./deploy.sh --no-build
```

## 📋 Opciones del Script de Deploy

```bash
./deploy.sh [opciones]

Opciones:
  --frontend-only    Solo desplegar frontend
  --backend-only     Solo desplegar backend
  --no-build         Saltar compilación (usar build existente)
  --help            Mostrar ayuda

Sin opciones: despliega frontend y backend completos
```

## 🌐 URLs de Acceso

Después del despliegue, la aplicación estará disponible en:

- **Frontend Local:** http://192.168.1.95/herencia/
- **API Local:** http://192.168.1.95/herencia/api/propiedades
- **Frontend Externo:** https://northr3nd.duckdns.org/herencia/
- **API Externa:** https://northr3nd.duckdns.org/herencia/api/

## 📁 Estructura del Proyecto

```
gestion-herencia/
├── angular-catastro/       # Frontend Angular 18
│   ├── src/               # Código fuente Angular
│   ├── nginx.conf         # Configuración nginx
│   ├── Dockerfile         # Imagen Docker frontend
│   └── deploy.sh          # Script deploy legacy (usar el del root)
├── backend/               # Backend Express.js
│   ├── routes/           # Rutas API
│   ├── models/           # Modelos Mongoose
│   ├── controllers/      # Controladores
│   ├── .env.example      # Template variables entorno
│   └── Dockerfile        # Imagen Docker backend
├── k8s/                  # Manifiestos Kubernetes
│   ├── README.md         # Documentación k8s detallada
│   ├── backend-deployment.yaml
│   ├── frontend-deployment.yaml
│   ├── ingress.yaml
│   ├── ingressroute.yaml
│   ├── middleware.yaml
│   └── secret-mongodb.yaml.example
└── deploy.sh             # ⭐ Script principal de despliegue
```

## 🛠️ Comandos Útiles

### Ver estado de pods
```bash
sudo kubectl get pods -n herencia
```

### Ver logs en tiempo real
```bash
# Frontend
sudo kubectl logs -f -l app=gestion-herencia -n herencia

# Backend
sudo kubectl logs -f -l app=gestion-herencia-backend -n herencia
```

### Reiniciar deployments
```bash
# Frontend
sudo kubectl rollout restart deployment/gestion-herencia -n herencia

# Backend
sudo kubectl rollout restart deployment/gestion-herencia-backend -n herencia
```

### Ver estado de servicios
```bash
sudo kubectl get svc,ingress -n herencia
```

## 🔒 Seguridad

Las credenciales sensibles se manejan mediante:
- **Kubernetes Secrets** para MongoDB URI
- **`.env` ignorado en git** (usar `.env.example` como plantilla)
- **Templates `.example`** para configuración

Ver `k8s/README.md` para más detalles sobre gestión de secrets.

## 📝 Workflow de Desarrollo

1. **Hacer cambios** en el código (frontend o backend)
2. **Probar localmente** si es necesario
3. **Commit y push** a git
4. **Desplegar** usando `./deploy.sh` con las opciones apropiadas

## ⚡ Solución de Problemas Comunes

### Frontend muestra versión antigua (caché)
1. Abrir DevTools (F12)
2. Application → Service Workers → Unregister
3. Application → Clear storage → Clear site data
4. Recargar con Ctrl+Shift+R

### Backend no se conecta a MongoDB
```bash
# Verificar que el secret existe
sudo kubectl get secret mongodb-credentials -n herencia

# Revisar logs del backend
sudo kubectl logs -l app=gestion-herencia-backend -n herencia
```

### Pods en CrashLoopBackOff
```bash
# Ver logs del pod problemático
sudo kubectl describe pod <pod-name> -n herencia
sudo kubectl logs <pod-name> -n herencia
```

## 📚 Documentación Adicional

- `k8s/README.md` - Guía detallada de Kubernetes y Secrets
- `MIGRACION.md` - Guía de migración a MongoDB (si existe)
- `backend/README.md` - Documentación API (si existe)

## 🤝 Contribuir

1. Hacer fork del proyecto
2. Crear branch para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto es privado.
