# 🎯 Cómo Extraer Datos REALES del Catastro

## ✅ Pasos para obtener datos reales:

### 1️⃣ Instala Selenium

```bash
pip install selenium
```

### 2️⃣ Edita tu archivo `referencias.txt`

Abre `referencias.txt` y pon tus referencias catastrales:

```
03106A002000090000YL
28079A01800223
08019A02500405
```

Una por línea, solo el código.

### 3️⃣ Ejecuta el extractor REAL

```bash
python extraer_datos_reales.py
```

**¿Qué hace este script?**
- ✅ Abre Chrome automáticamente
- ✅ Accede a la web del catastro REAL
- ✅ Extrae los datos REALES de cada referencia
- ✅ Guarda los datos en archivos JSON
- ✅ Funciona porque usa un navegador real (Selenium)

**Tiempo estimado:** ~10 segundos por referencia

### 4️⃣ Visualiza los datos

```bash
python server.py
```

Abre: http://localhost:8000/frontend/

Haz clic en "Cargar Datos de Ejemplo"

---

## 📋 Ejemplo completo paso a paso:

### 1. Instalar Selenium
```bash
pip install selenium
```

### 2. Crear tu archivo de referencias

Edita `referencias.txt`:
```
03106A002000090000YL
```

### 3. Ejecutar el extractor
```bash
python extraer_datos_reales.py
```

**Verás algo como:**
```
============================================================
  EXTRACTOR REAL DE DATOS DEL CATASTRO
  Usando Selenium + Chrome
============================================================

¿Quieres ver el navegador mientras extrae los datos?
  1. Sí, mostrar navegador (más lento pero ves el proceso)
  2. No, modo oculto (más rápido)

Elige opción (1/2) [1]: 1

🌐 Iniciando navegador Chrome...
✓ Navegador iniciado correctamente

[1/1] Procesando: 03106A002000090000YL
------------------------------------------------------------
📡 Accediendo a la página del catastro...
🔍 Extrayendo datos...
📊 Datos encontrados: 25 campos
✓ Extracción completada
💾 Guardado en: data/03106A002000090000YL.json

✓ Datos consolidados guardados en: data/datos_catastrales_consolidados.json

============================================================
  RESUMEN
============================================================

Referencias procesadas: 1
Archivos generados en: data/
```

### 4. Ver los datos en el navegador

```bash
python server.py
```

Abre: http://localhost:8000/frontend/

---

## ⚠️ Notas Importantes

### Primera ejecución
La primera vez que ejecutes el script, Selenium descargará Chrome Driver automáticamente. Puede tardar 1-2 minutos.

### Ver el navegador
Te recomiendo elegir opción **1** (mostrar navegador) la primera vez para ver que funciona correctamente.

### Velocidad
- Con navegador visible: ~10 seg por referencia
- Modo oculto: ~7 seg por referencia

### Errores
Si la página del catastro cambia su estructura, el script puede necesitar actualizaciones. En ese caso:
1. El script guarda el HTML en `data/debug_[referencia].html`
2. Puedes revisar ese archivo para ver qué cambió

---

## 🆘 Problemas Comunes

### "Selenium no está instalado"
```bash
pip install selenium
```

### "Chrome no está instalado"
Descarga Chrome de: https://www.google.com/chrome/

### "Acceso denegado"
El catastro puede bloquear accesos si:
- Haces muchas peticiones muy rápidas
- Detecta comportamiento automatizado

**Solución:** El script ya tiene pausas de 5 segundos entre peticiones. Si sigue fallando, aumenta el tiempo en la línea 237.

### No se extraen todos los datos
La página del catastro tiene una estructura compleja. El script extrae lo que puede y guarda todo en el campo `datos_raw`. Puedes ver esos datos en el JSON generado.

---

## 🎯 Resumen

| Paso | Comando | Qué hace |
|------|---------|----------|
| 1 | `pip install selenium` | Instala Selenium |
| 2 | Edita `referencias.txt` | Añade tus referencias |
| 3 | `python extraer_datos_reales.py` | Extrae datos REALES |
| 4 | `python server.py` | Inicia el servidor |
| 5 | Abre navegador | http://localhost:8000/frontend/ |

---

## 🔄 Diferencia con el script anterior

| Script | Datos | Velocidad | Requiere |
|--------|-------|-----------|----------|
| `procesar_referencias.py` | ❌ EJEMPLO | Instantáneo | Nada |
| `extraer_datos_reales.py` | ✅ REALES | ~10 seg/ref | Selenium + Chrome |

---

**¡Listo!** Ahora sí puedes extraer datos REALES del catastro 🎉
