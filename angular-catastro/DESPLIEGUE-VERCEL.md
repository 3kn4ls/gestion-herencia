# 🚀 Despliegue en Vercel - Guía Paso a Paso

## ✅ Todo está listo para desplegar

Ya he preparado todos los archivos de configuración necesarios:
- ✅ `vercel.json` - Configuración de Vercel
- ✅ `.vercelignore` - Archivos a excluir
- ✅ `package.json` - Scripts de build
- ✅ `angular.json` - Configuración Angular

## 📋 Opción 1: Despliegue desde GitHub (RECOMENDADO)

### Paso 1: Subir a GitHub (si aún no lo has hecho)

```bash
# En el directorio gestion-herencia (raíz)
git add angular-catastro/
git commit -m "Preparar para despliegue en Vercel"
git push origin tu-rama
```

### Paso 2: Importar en Vercel

1. **Ve a Vercel:** https://vercel.com/
2. **Haz clic en:** "Add New" → "Project"
3. **Importa tu repositorio:**
   - Busca `gestion-herencia`
   - Haz clic en "Import"

### Paso 3: Configurar el Proyecto

En la pantalla de configuración:

**Framework Preset:**
```
Angular
```

**Root Directory:**
```
angular-catastro
```
⚠️ **MUY IMPORTANTE:** Haz clic en "Edit" al lado de "Root Directory" y selecciona `angular-catastro`

**Build Command:** (auto-detectado)
```
npm run build
```

**Output Directory:** (auto-detectado)
```
dist/angular-catastro
```

**Install Command:** (auto-detectado)
```
npm install
```

### Paso 4: Deploy

1. Haz clic en **"Deploy"**
2. Espera 2-3 minutos
3. ✅ ¡Listo! Tu app estará en `https://tu-proyecto.vercel.app`

---

## 📋 Opción 2: Despliegue desde CLI de Vercel

### Instalación de Vercel CLI

```bash
npm install -g vercel
```

### Login

```bash
vercel login
```

### Desplegar

```bash
# Ir al directorio del proyecto
cd angular-catastro

# Primer despliegue
vercel

# Te hará algunas preguntas:
# - Set up and deploy? → Y
# - Which scope? → Selecciona tu cuenta
# - Link to existing project? → N
# - Project name? → angular-catastro (o el que quieras)
# - In which directory is your code located? → ./
# - Want to override settings? → N

# ¡Listo! Te dará una URL de preview
```

### Deploy a Producción

```bash
vercel --prod
```

---

## 🔧 Configuración Avanzada (Opcional)

### Variables de Entorno

Si necesitas añadir variables de entorno:

1. En Vercel Dashboard → Tu Proyecto
2. Settings → Environment Variables
3. Añadir variables (por ahora no necesitas ninguna)

### Dominio Personalizado

1. En Vercel Dashboard → Tu Proyecto
2. Settings → Domains
3. Añadir tu dominio personalizado

---

## 📱 URL de tu App

Después del despliegue, tu app estará disponible en:

**Preview (automático en cada push):**
```
https://angular-catastro-XXXX.vercel.app
```

**Producción:**
```
https://angular-catastro.vercel.app
```

Puedes personalizar el nombre del proyecto durante el setup.

---

## 🔄 Actualizaciones Automáticas

Una vez configurado con GitHub:

1. Haces cambios en tu código
2. `git push`
3. Vercel **despliega automáticamente** 🎉

Cada branch obtiene su propia URL de preview.

---

## ✅ Verificación Post-Despliegue

Después del despliegue, verifica que funcione:

- [ ] La página carga correctamente
- [ ] El header se ve bien
- [ ] "Cargar Datos de Ejemplo" funciona
- [ ] La tabla muestra datos
- [ ] Los filtros funcionan
- [ ] La exportación a Excel funciona

---

## 🐛 Solución de Problemas

### Error: "Build Failed"

**Causa común:** Falta el directorio raíz

**Solución:**
1. Ve a Project Settings
2. General → Root Directory
3. Establece: `angular-catastro`
4. Save → Redeploy

### Error: "404 on refresh"

**Causa:** No configurado el rewrites

**Solución:** Ya está configurado en `vercel.json` ✅

### Los assets no cargan

**Causa:** Ruta incorrecta de assets

**Solución:** Ya está configurado en `angular.json` ✅

---

## 📊 Límites de Vercel (Plan Free)

- ✅ Despliegues ilimitados
- ✅ 100 GB bandwidth/mes (más que suficiente)
- ✅ HTTPS automático
- ✅ CDN global
- ✅ Dominio personalizado
- ✅ Deploy previews automáticos

---

## 🎯 Resultado Final

Tu aplicación estará:
- ✅ **Desplegada** en producción
- ✅ **HTTPS** automático
- ✅ **CDN Global** (carga rápida en todo el mundo)
- ✅ **Auto-actualización** con cada git push
- ✅ **Preview URLs** para cada PR/branch

---

## 💡 Tips

1. **Nombre corto:** Usa un nombre corto para el proyecto (ej: `catastro`)
2. **Branch principal:** Asegúrate de estar en la rama correcta antes de importar
3. **Build logs:** Si falla, revisa los logs de build en Vercel Dashboard
4. **Cache:** Vercel cachea automáticamente los assets para mejor rendimiento

---

## 📞 ¿Necesitas Ayuda?

Si tienes algún problema:

1. Revisa los logs de build en Vercel Dashboard
2. Verifica que la carpeta `angular-catastro` esté correctamente establecida como Root Directory
3. Asegúrate de que el repositorio en GitHub incluye todos los archivos necesarios

---

**¡Listo!** Con estos pasos, tu aplicación estará desplegada en Vercel en menos de 5 minutos. 🚀
