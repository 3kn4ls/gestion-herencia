# 📘 Cómo Usar el Sistema - Guía Paso a Paso

## 🎯 Proceso Simple

### Paso 1: Crea tu archivo de referencias

Crea un archivo llamado `referencias.txt` (o cualquier nombre.txt) con tus referencias catastrales:

```
03106A002000090000YL
28079A01800223
08019A02500405
```

**Formato:**
- Una referencia por línea
- Sin espacios al principio ni al final
- Puedes añadir comentarios con `#`:

```
# Propiedades de Madrid
28079A01800223
28079A01800224

# Propiedades de Barcelona
08019A02500405
```

### Paso 2: Procesa las referencias

Ejecuta el script:

```bash
python procesar_referencias.py
```

O si tu archivo tiene otro nombre:

```bash
python procesar_referencias.py mis_referencias.txt
```

### Paso 3: Revisa los resultados

El script generará:
- `data/[referencia].json` - Datos de cada propiedad
- `data/datos_catastrales_consolidados.json` - Todas juntas
- `data/resumen_propiedades.json` - Estadísticas

### Paso 4: Visualiza en el frontend

```bash
python server.py
```

Abre el navegador en: http://localhost:8000/frontend/

Haz clic en "Cargar Datos de Ejemplo"

---

## ⚠️ IMPORTANTE: Datos de Ejemplo vs Datos Reales

### Situación Actual

El catastro español **bloquea** el scraping automático (error 403 Forbidden).

Por eso, el sistema genera **datos de EJEMPLO** con la estructura correcta del catastro, pero los valores no son reales.

### Datos que genera el sistema

✓ Estructura real del catastro
✓ Todos los campos correctos
✗ Valores de ejemplo (no son los datos reales de esa referencia)

**Ejemplo:**
```json
{
  "referencia_catastral": "03106A002000090000YL",  ← Tu referencia REAL
  "localizacion": {
    "provincia": "Alicante",                        ← Calculado de la referencia
    "via": "CALLE EJEMPLO",                         ← EJEMPLO (no es real)
    "numero": "1"                                   ← EJEMPLO (no es real)
  },
  "datos_catastrales": {
    "valor_catastral": 85420.50                     ← EJEMPLO (no es real)
  }
}
```

---

## 🔧 Cómo Obtener Datos REALES

### Opción 1: Selenium (Recomendado para automatizar)

1. Instala Selenium:
```bash
pip install selenium webdriver-manager
```

2. Revisa el ejemplo:
```bash
python selenium_scraper_example.py
```

3. Sigue las instrucciones del archivo para implementar la extracción real

### Opción 2: Manual (Para pocas referencias)

1. Ve a: https://www1.sedecatastro.gob.es/
2. Busca cada referencia catastral manualmente
3. Copia los datos y crea un JSON con la estructura del sistema
4. Guárdalo en `data/mis_datos_reales.json`
5. Cárgalo en el frontend con el botón de "Seleccionar archivo"

### Opción 3: API Oficial del Catastro

Consulta la documentación oficial:
http://www.catastro.meh.es/ws/webservices_catastro.pdf

---

## 📋 Ejemplo Completo

### 1. Crea `referencias.txt`
```
03106A002000090000YL
28079A01800223
08019A02500405
```

### 2. Procesa
```bash
python procesar_referencias.py
```

Salida:
```
PROCESADOR DE REFERENCIAS CATASTRALES
============================================================

Archivo de entrada: referencias.txt

📖 Leyendo referencias...
✓ Encontradas 3 referencias:

  1. 03106A002000090000YL
  2. 28079A01800223
  3. 08019A02500405

============================================================
EXTRAYENDO DATOS DEL CATASTRO
============================================================

[1/3] Procesando: 03106A002000090000YL
  ✓ Guardado en: data/03106A002000090000YL.json

[2/3] Procesando: 28079A01800223
  ✓ Guardado en: data/28079A01800223.json

[3/3] Procesando: 08019A02500405
  ✓ Guardado en: data/08019A02500405.json

✓ Datos consolidados guardados en: data/datos_catastrales_consolidados.json

============================================================
✅ PROCESO COMPLETADO
```

### 3. Visualiza
```bash
python server.py
```

### 4. Abre el navegador
http://localhost:8000/frontend/

---

## 💡 Consejos

### Editar datos manualmente

Si quieres corregir los datos de ejemplo con datos reales:

1. Abre `data/[referencia].json`
2. Edita los valores manualmente
3. Guarda el archivo
4. Recarga el frontend

### Formato para muchas referencias

Para procesar muchas referencias a la vez:

```
# Archivo: todas_mis_propiedades.txt

# Madrid - Heredadas de abuelos
28079A01800223
28079A01800224
28079A01800225

# Barcelona - Compradas
08019A02500405
08019A02500406

# Alicante - Vacaciones
03106A002000090000YL
```

Luego:
```bash
python procesar_referencias.py todas_mis_propiedades.txt
```

---

## 🆘 Problemas Comunes

### "No se encontró el archivo"

Asegúrate de que el archivo está en la misma carpeta que el script:
```
gestion-herencia/
├── referencias.txt          ← Aquí
├── procesar_referencias.py
└── ...
```

### "El archivo está vacío"

El archivo debe tener al menos una línea con una referencia catastral válida.

### "Los datos no son correctos"

Recuerda: los datos son de **ejemplo**. Para datos reales usa Selenium o la opción manual.

---

## 📞 Resumen

| Qué hacer | Comando |
|-----------|---------|
| Crear archivo con referencias | Edita `referencias.txt` |
| Procesar referencias | `python procesar_referencias.py` |
| Ver en el frontend | `python server.py` luego http://localhost:8000/frontend/ |
| Datos reales | Usa Selenium (ver `selenium_scraper_example.py`) |

---

**¿Necesitas ayuda?** Revisa `README.md` para más detalles o `INSTALACION.md` si tienes problemas con Python.
