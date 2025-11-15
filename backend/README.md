# 🚀 Backend API - Gestión de Herencias

Backend RESTful API con Express.js y MongoDB para la gestión de propiedades catastrales, valores de tasación y repartos de herencia.

## 📋 Características

- ✅ API REST completa
- ✅ MongoDB con Mongoose
- ✅ CRUD para Propiedades
- ✅ CRUD para Repartos
- ✅ Actualización de Valores de Tasación
- ✅ CORS habilitado
- ✅ Health checks
- ✅ Validaciones de datos
- ✅ Manejo de errores

## 🛠️ Tecnologías

- **Node.js** 18+
- **Express.js** 4.x
- **Mongoose** 8.x
- **MongoDB** (en 192.168.1.95:27017)

## 📁 Estructura

```
backend/
├── server.js              # Servidor principal
├── config/
│   └── database.js        # Configuración MongoDB
├── models/
│   ├── Propiedad.js       # Modelo de propiedades
│   ├── ValoresTasacion.js # Modelo de valores de tasación
│   └── Reparto.js         # Modelo de repartos
├── routes/
│   ├── propiedades.js     # Rutas de propiedades
│   ├── valoresTasacion.js # Rutas de valores
│   └── repartos.js        # Rutas de repartos
├── controllers/
│   ├── propiedadesController.js
│   ├── valoresTasacionController.js
│   └── repartosController.js
├── package.json
├── Dockerfile
└── .env.example
```

## 🚀 Instalación y Uso

### Desarrollo Local

```bash
# Instalar dependencias
npm install

# Copiar .env.example a .env
cp .env.example .env

# Editar .env con tus configuraciones
nano .env

# Iniciar servidor de desarrollo
npm run dev

# O iniciar servidor de producción
npm start
```

El servidor estará disponible en: `http://localhost:3000`

### Docker

```bash
# Build
docker build -t gestion-herencia-backend:latest .

# Run
docker run -d -p 3000:3000 \
  -e MONGODB_URI=mongodb://192.168.1.95:27017/herencia \
  gestion-herencia-backend:latest
```

## 📡 API Endpoints

### Propiedades

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/propiedades` | Obtener todas las propiedades |
| GET | `/api/propiedades/:id` | Obtener propiedad por ID |
| GET | `/api/propiedades/referencia/:ref` | Obtener por referencia catastral |
| POST | `/api/propiedades` | Crear nueva propiedad |
| POST | `/api/propiedades/search` | Buscar propiedades con filtros |
| PUT | `/api/propiedades/:id` | Actualizar propiedad |
| DELETE | `/api/propiedades/:id` | Eliminar propiedad |

### Valores de Tasación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/valores-tasacion` | Obtener valores (único documento) |
| PUT | `/api/valores-tasacion` | Actualizar valores |
| POST | `/api/valores-tasacion/reset` | Información sobre reset |

### Repartos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/repartos` | Obtener todos los repartos |
| GET | `/api/repartos/:id` | Obtener reparto por ID |
| GET | `/api/repartos/search/:nombre` | Buscar por nombre |
| POST | `/api/repartos` | Crear nuevo reparto |
| PUT | `/api/repartos/:id` | Actualizar reparto |
| DELETE | `/api/repartos/:id` | Eliminar reparto |

### Health Check

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/health` | Health check del servidor |
| GET | `/` | Info del API |

## 📝 Ejemplos de Uso

### Obtener todas las propiedades

```bash
curl http://localhost:3000/api/propiedades
```

### Crear una propiedad

```bash
curl -X POST http://localhost:3000/api/propiedades \
  -H "Content-Type: application/json" \
  -d '{
    "referencia_catastral": "03106A002000090000YL",
    "localizacion": {
      "provincia": "Alicante",
      "municipio": "Planes"
    },
    "datos_inmueble": {
      "clase": "Rústico",
      "superficie_construida": 5000
    }
  }'
```

### Actualizar valores de tasación

```bash
curl -X PUT http://localhost:3000/api/valores-tasacion \
  -H "Content-Type: application/json" \
  -d @valores-tasacion.json
```

### Crear un reparto

```bash
curl -X POST http://localhost:3000/api/repartos \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Reparto Familia García",
    "descripcion": "Reparto de herencia 2025",
    "herederos": [...]
  }'
```

## 🔧 Configuración

### Variables de Entorno

```bash
# .env
PORT=3000
MONGODB_URI=mongodb://192.168.1.95:27017/herencia
NODE_ENV=production
```

### MongoDB

Base de datos: `herencia`

Colecciones:
- `propiedad`: Propiedades catastrales
- `valores_tasacion`: Valores de tasación (único documento)
- `reparto`: Repartos guardados

## 🐳 Despliegue en Kubernetes

Ver documentación en el directorio raíz: `DESPLIEGUE-K3S.md`

Los manifiestos están en `/k8s`:
- `backend-deployment.yaml`
- `backend-service.yaml`
- `ingress.yaml` (actualizado con rutas API)

```bash
# Deploy
kubectl apply -f ../k8s/backend-deployment.yaml
kubectl apply -f ../k8s/backend-service.yaml
kubectl apply -f ../k8s/ingress.yaml

# Verificar
kubectl get pods -l app=gestion-herencia-backend
```

## 🔍 Monitoring

### Logs

```bash
# Docker
docker logs -f <container-id>

# Kubernetes
kubectl logs -f deployment/gestion-herencia-backend -n herencia
```

### Health Check

```bash
curl http://localhost:3000/health
```

Respuesta esperada:
```json
{
  "success": true,
  "message": "Backend API funcionando correctamente",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

## 🐛 Troubleshooting

### Error de conexión a MongoDB

```bash
# Verificar que MongoDB está corriendo
telnet 192.168.1.95 27017

# Verificar logs
docker logs <container-id>
```

### Puerto ya en uso

```bash
# Cambiar puerto en .env
PORT=3001
```

### CORS errors

Ya está habilitado por defecto. Si tienes problemas, verifica que:
- El frontend está usando la URL correcta del API
- No hay firewall bloqueando las peticiones

## 📄 Licencia

MIT

## 👥 Contribuir

Pull requests son bienvenidos.

---

**API funcionando** ✅

Accede a `http://localhost:3000` para ver la info del API.
