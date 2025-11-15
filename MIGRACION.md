# 📋 Guía de Migración - Versión sin Backend → Versión con Backend + MongoDB

Esta guía te ayudará a actualizar tu instalación existente de Gestión de Herencias (sin backend) a la nueva versión con backend Express.js y MongoDB.

## 🎯 Resumen de Cambios

### Antes (Versión Antigua)
- ✅ Frontend Angular standalone
- ✅ Datos en assets (JSON estáticos)
- ✅ Sin persistencia de datos
- ❌ No se pueden crear/editar/eliminar propiedades
- ❌ No se pueden guardar repartos

### Ahora (Versión Nueva)
- ✅ Frontend Angular con backend API
- ✅ Datos en MongoDB (persistentes)
- ✅ CRUD completo de propiedades
- ✅ Guardar/cargar repartos
- ✅ Valores de tasación en base de datos
- ✅ Fallback automático a assets si backend no disponible

## 📦 Componentes Nuevos

### Backend
```
backend/
├── server.js              # API Express.js
├── models/                # Modelos Mongoose
├── routes/                # Rutas del API
├── controllers/           # Lógica de negocio
└── Dockerfile            # Build del backend
```

### Kubernetes
```
k8s/
├── backend-deployment.yaml   # Deployment del backend
├── backend-service.yaml      # Service del backend
└── ingress.yaml             # Actualizado con ruta /api
```

### Frontend
```
angular-catastro/src/app/services/
└── api.service.ts       # Nuevo servicio HTTP para backend
```

## 🚀 Proceso de Migración

### PASO 1: Preparar MongoDB

#### Opción A: MongoDB ya instalado en 192.168.1.95

Si ya tienes MongoDB corriendo:

```bash
# Conectar a MongoDB
mongo

# Crear base de datos
use herencia

# Verificar
show dbs
```

#### Opción B: Instalar MongoDB nuevo

```bash
# En el servidor 192.168.1.95
sudo apt-get update
sudo apt-get install -y mongodb

# Iniciar servicio
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Verificar
sudo systemctl status mongodb

# Permitir conexiones remotas
sudo nano /etc/mongodb.conf
# Cambiar: bind_ip = 127.0.0.1
# Por:     bind_ip = 0.0.0.0

# Reiniciar
sudo systemctl restart mongodb
```

#### Verificar conectividad desde tu Raspberry Pi

```bash
# Desde la Raspberry Pi con k3s
telnet 192.168.1.95 27017

# Debería conectar. Presiona Ctrl+] y luego quit
```

### PASO 2: Hacer Backup de la Versión Actual

**IMPORTANTE:** Antes de actualizar, haz backup de tu deployment actual:

```bash
# En tu Raspberry Pi con k3s
cd ~/gestion-herencia

# Backup de manifiestos
sudo kubectl get all -n herencia -o yaml > backup-herencia-$(date +%Y%m%d).yaml

# Backup de la imagen (opcional)
sudo docker save gestion-herencia-frontend:latest > backup-frontend-$(date +%Y%m%d).tar

# Guardar en lugar seguro
mkdir -p ~/backups
mv backup-*.yaml ~/backups/
mv backup-*.tar ~/backups/
```

### PASO 3: Actualizar el Código

```bash
# Ir al directorio del proyecto
cd ~/gestion-herencia

# Hacer pull de los últimos cambios
git fetch origin
git checkout claude/incomplete-request-01W8SieayKyvB8yZtNHENM7n
git pull origin claude/incomplete-request-01W8SieayKyvB8yZtNHENM7n

# Verificar que tienes el directorio backend
ls -la backend/
```

### PASO 4: Migrar Datos Iniciales a MongoDB

Necesitas importar tus datos existentes (de assets) a MongoDB:

```bash
# En tu Raspberry Pi, crear script de importación
cd ~/gestion-herencia
nano import-data.js
```

**Contenido de `import-data.js`:**

```javascript
const MongoClient = require('mongodb').MongoClient;
const fs = require('fs');

const mongoUrl = 'mongodb://192.168.1.95:27017';
const dbName = 'herencia';

async function importData() {
  const client = await MongoClient.connect(mongoUrl, { useUnifiedTopology: true });
  const db = client.db(dbName);

  console.log('✅ Conectado a MongoDB');

  // 1. Importar propiedades
  console.log('📦 Importando propiedades...');
  const propiedadesJson = JSON.parse(
    fs.readFileSync('./angular-catastro/src/assets/datos_catastrales_mergeados.json', 'utf8')
  );

  // Limpiar colección existente (opcional)
  await db.collection('propiedad').deleteMany({});

  // Insertar propiedades
  if (propiedadesJson.length > 0) {
    await db.collection('propiedad').insertMany(propiedadesJson);
    console.log(`✅ ${propiedadesJson.length} propiedades importadas`);
  }

  // 2. Importar valores de tasación
  console.log('📊 Importando valores de tasación...');
  const valoresJson = JSON.parse(
    fs.readFileSync('./angular-catastro/src/assets/valores-tasacion-cultivos.json', 'utf8')
  );

  // Limpiar colección existente
  await db.collection('valores_tasacion').deleteMany({});

  // Insertar valores (solo un documento)
  await db.collection('valores_tasacion').insertOne(valoresJson);
  console.log('✅ Valores de tasación importados');

  console.log('🎉 Importación completada');

  client.close();
}

importData().catch(console.error);
```

**Ejecutar importación:**

```bash
# Instalar MongoDB client (si no está)
npm install mongodb

# Ejecutar script
node import-data.js
```

**Salida esperada:**
```
✅ Conectado a MongoDB
📦 Importando propiedades...
✅ 25 propiedades importadas
📊 Importando valores de tasación...
✅ Valores de tasación importados
🎉 Importación completada
```

### PASO 5: Build del Backend

```bash
cd ~/gestion-herencia/backend

# Crear archivo .env
cp .env.example .env

# Editar .env
nano .env
```

**Contenido de `.env`:**
```bash
PORT=3000
MONGODB_URI=mongodb://192.168.1.95:27017/herencia
NODE_ENV=production
```

**Build de la imagen Docker:**

```bash
# Desde el directorio backend
sudo docker build -t gestion-herencia-backend:latest .

# Verificar
sudo docker images | grep gestion-herencia-backend
```

**Importar a k3s:**

```bash
sudo docker save gestion-herencia-backend:latest | sudo k3s ctr images import -

# Verificar
sudo k3s ctr images ls | grep gestion-herencia-backend
```

### PASO 6: Rebuild del Frontend

El frontend también necesita rebuild para incluir el nuevo servicio API:

```bash
cd ~/gestion-herencia/angular-catastro

# Instalar nuevas dependencias (si es necesario)
npm install

# Build de producción
npm run build -- --configuration production --base-href /herencia/

# Build de la imagen Docker
sudo docker build -t gestion-herencia-frontend:latest .

# Reimportar a k3s
sudo docker save gestion-herencia-frontend:latest | sudo k3s ctr images import -
```

### PASO 7: Desplegar Backend en k3s

```bash
cd ~/gestion-herencia

# Aplicar manifiestos del backend
sudo kubectl apply -f k8s/backend-deployment.yaml -n herencia
sudo kubectl apply -f k8s/backend-service.yaml -n herencia

# Verificar estado
sudo kubectl get pods -l app=gestion-herencia-backend -n herencia

# Ver logs
sudo kubectl logs -f -l app=gestion-herencia-backend -n herencia
```

**Salida esperada en logs:**
```
╔════════════════════════════════════════════════════════════╗
║        🚀 API GESTIÓN HERENCIA INICIADA 🚀                ║
╚════════════════════════════════════════════════════════════╝

✅ MongoDB conectado: 192.168.1.95
✅ Servidor escuchando en puerto 3000
📡 http://localhost:3000
```

### PASO 8: Actualizar Ingress

El Ingress ya está actualizado en el código, solo necesitas aplicarlo:

```bash
# Aplicar Ingress actualizado
sudo kubectl apply -f k8s/ingress.yaml -n herencia

# Verificar
sudo kubectl get ingress -n herencia
sudo kubectl describe ingress gestion-herencia -n herencia
```

**Verifica que tenga dos rutas:**
- `/api` → gestion-herencia-backend:3000
- `/herencia` → gestion-herencia:80

### PASO 9: Reiniciar Frontend

```bash
# Reiniciar deployment del frontend
sudo kubectl rollout restart deployment/gestion-herencia -n herencia

# Esperar a que esté listo
sudo kubectl rollout status deployment/gestion-herencia -n herencia
```

### PASO 10: Verificación

#### Verificar Backend

```bash
# Desde la Raspberry Pi
curl http://localhost/api/propiedades

# O desde tu navegador
http://TU_IP/api/propiedades
```

**Respuesta esperada:**
```json
{
  "success": true,
  "count": 25,
  "data": [ ... propiedades ... ]
}
```

#### Verificar Health Check

```bash
curl http://localhost/api/../health

# O
http://TU_IP/health
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Backend API funcionando correctamente",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

#### Verificar Frontend

Abre en tu navegador:
```
http://TU_IP/herencia/
```

**Deberías ver:**
- ✅ Aplicación carga normalmente
- ✅ En consola del navegador: "✅ X propiedades cargadas"
- ✅ Sin errores de red en la consola

## 🔍 Troubleshooting

### Problema 1: Backend no puede conectar a MongoDB

```bash
# Verificar conectividad
telnet 192.168.1.95 27017

# Verificar firewall
sudo ufw status
sudo ufw allow 27017/tcp

# Ver logs del backend
sudo kubectl logs -f -l app=gestion-herencia-backend -n herencia
```

### Problema 2: Frontend muestra "Backend no disponible"

```bash
# Verificar que el backend está corriendo
sudo kubectl get pods -l app=gestion-herencia-backend -n herencia

# Verificar logs del backend
sudo kubectl logs -l app=gestion-herencia-backend -n herencia

# Verificar service
sudo kubectl get svc gestion-herencia-backend -n herencia

# Verificar ingress
sudo kubectl describe ingress gestion-herencia -n herencia
```

### Problema 3: Error 404 en rutas /api

```bash
# Verificar que el Ingress tiene la ruta /api
sudo kubectl get ingress gestion-herencia -n herencia -o yaml | grep -A 10 "path:"

# Debería mostrar ambas rutas
```

### Problema 4: Pods del backend en CrashLoopBackOff

```bash
# Ver razón del crash
sudo kubectl describe pod -l app=gestion-herencia-backend -n herencia

# Ver logs
sudo kubectl logs -l app=gestion-herencia-backend -n herencia --previous

# Verificar variables de entorno
sudo kubectl get deployment gestion-herencia-backend -n herencia -o yaml | grep -A 5 "env:"
```

## 🔄 Rollback (en caso de problemas)

Si necesitas volver a la versión anterior:

```bash
# 1. Eliminar backend
sudo kubectl delete -f k8s/backend-deployment.yaml -n herencia
sudo kubectl delete -f k8s/backend-service.yaml -n herencia

# 2. Restaurar Ingress anterior (solo ruta /herencia)
sudo kubectl apply -f ~/backups/backup-herencia-YYYYMMDD.yaml

# 3. Restaurar imagen anterior del frontend (si hiciste backup)
sudo docker load < ~/backups/backup-frontend-YYYYMMDD.tar
sudo docker save gestion-herencia-frontend:latest | sudo k3s ctr images import -

# 4. Reiniciar frontend
sudo kubectl rollout restart deployment/gestion-herencia -n herencia
```

## ✅ Verificación Final Completa

### Checklist Post-Migración

- [ ] MongoDB conecta desde la Raspberry Pi
- [ ] Datos importados correctamente en MongoDB
- [ ] Backend pod está en estado Running
- [ ] Backend responde a /health
- [ ] Backend responde a /api/propiedades
- [ ] Frontend carga sin errores
- [ ] Frontend muestra propiedades desde el backend
- [ ] Ingress tiene ambas rutas (/api y /herencia)
- [ ] No hay errores en los logs de ningún pod

### Comandos de Verificación Rápida

```bash
# Estado general
sudo kubectl get all -n herencia

# Logs backend
sudo kubectl logs -f -l app=gestion-herencia-backend -n herencia --tail=50

# Logs frontend
sudo kubectl logs -f -l app=gestion-herencia -n herencia --tail=50

# Test API
curl http://localhost/api/propiedades | jq '.count'

# Test health
curl http://localhost/health
```

## 📊 Monitoreo Continuo

### Ver logs en tiempo real

```bash
# Backend
sudo kubectl logs -f -l app=gestion-herencia-backend -n herencia

# Frontend
sudo kubectl logs -f -l app=gestion-herencia -n herencia
```

### Ver recursos

```bash
# CPU y memoria
sudo kubectl top pods -n herencia

# Detalles de pods
sudo kubectl describe pods -n herencia
```

## 🎉 Próximos Pasos

Una vez migrado exitosamente:

1. **Probar CRUD de propiedades** (cuando esté implementado en UI)
2. **Guardar valores de tasación personalizados**
3. **Crear y guardar repartos**
4. **Configurar backups automáticos de MongoDB**
5. **Configurar HTTPS con Let's Encrypt** (opcional)

## 📞 Soporte

Si tienes problemas durante la migración:

1. **Verifica logs**: Siempre revisa los logs de los pods
2. **Consulta esta guía**: Sección de Troubleshooting
3. **Haz rollback**: Si algo falla críticamente, vuelve atrás
4. **Backups**: Asegúrate de tener backups antes de cada paso

## 💡 Tips Importantes

1. **No elimines los assets**: El frontend hace fallback automático si el backend falla
2. **MongoDB remoto**: Asegúrate de que 192.168.1.95:27017 esté accesible
3. **Firewall**: Permite el puerto 27017 en el servidor MongoDB
4. **Recursos**: El backend usa ~128Mi RAM, asegúrate de tener suficiente
5. **Logs**: Los logs son tu mejor amigo para debug

---

**¡Migración completa! 🎊**

Tu aplicación ahora tiene:
- ✅ Persistencia de datos con MongoDB
- ✅ API RESTful completa
- ✅ CRUD de propiedades
- ✅ Fallback automático a assets
- ✅ Backend escalable y mantenible
