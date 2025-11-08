# Extracción de Datos del PDF Oficial GVA

## Resumen

Este sistema te permite **extraer y estructurar** todos los datos relevantes del PDF oficial de la Generalitat Valenciana para valoración de parcelas, **sin afectar la aplicación actual**.

Los datos se almacenan en formato JSON estructurado que puede ser:
- ✅ Consultado y editado fácilmente
- ✅ Validado antes de aplicar
- ✅ Importado al valorador cuando esté listo
- ✅ Versionado y respaldado

---

## Archivos Creados

### 1. Template de Datos
**`data/valores_gva_2025_template.json`**
- Estructura completa para todos los datos necesarios
- Plantilla vacía lista para rellenar
- Incluye campos para:
  - Suelo rústico (€/ha por tipo de cultivo)
  - Suelo urbano (coeficientes multiplicadores)
  - Zonificación (si aplica)
  - Metadatos y notas

### 2. Script Extractor Interactivo
**`extraer_datos_pdf_gva.py`**
- Script interactivo para introducir datos del PDF
- Guarda en: `data/valores_gva_2025.json`
- **NO modifica la aplicación**

### 3. Script de Importación
**`importar_datos_gva_a_valorador.py`**
- Importa datos al valorador cuando estés listo
- Crea backup automático antes de modificar
- **Solo ejecutar cuando los datos estén completos**

---

## Flujo de Trabajo

```
PDF Oficial GVA
      ↓
[1. Extraer Datos]
      ↓
valores_gva_2025.json  ← Datos estructurados (NO afecta app)
      ↓
[2. Verificar/Editar]
      ↓
[3. Importar cuando esté listo]
      ↓
valorador_inmuebles.py ← Aplicación actualizada
```

---

## Paso 1: Extraer Datos del PDF

### Ejecutar Script Interactivo

```bash
python extraer_datos_pdf_gva.py
```

### Menú Principal

```
EXTRACTOR DE DATOS - PDF GVA 2025
==================================================

¿Qué deseas hacer?

1. Introducir/actualizar datos de OLIVA
2. Introducir/actualizar datos de PLANES
3. Introducir/actualizar datos de VALL DE GALLINERA
4. Ver resumen de datos actuales
5. Exportar a formato simplificado
6. Añadir notas/observaciones generales
0. Guardar y salir
```

### Ejemplo de Uso

#### Opción 1: Introducir Datos de Oliva

```
MUNICIPIO: OLIVA
==================================================

1. Datos RÚSTICO (€/ha por cultivo)
2. Datos URBANO (coeficientes)
3. Información general del municipio
0. Volver al menú principal

Selecciona: 1
```

#### Introducir Valores Rústicos

```
SUELO RÚSTICO - Oliva
==================================================

Introduce los valores del PDF (€/ha)
Deja en blanco para mantener valor actual o usa N/A si no aplica

  Olivar Secano [Sin datos]: 35000
    Denominación oficial en PDF (Enter=omitir): O- Olivos secano

  Olivar Regadío [Sin datos]: 65000
    Denominación oficial en PDF: O- Olivos regadío

  Almendro Secano [Sin datos]: 20000

  ...
```

#### Introducir Coeficientes Urbanos

```
SUELO URBANO - Oliva
==================================================

Introduce los coeficientes multiplicadores

  Vivienda [Sin datos]: 0.50
  Local Comercial [Sin datos]: 0.48
  Garaje [Sin datos]: 0.40

  ...
```

---

## Paso 2: Verificar Datos Extraídos

### Opción A: Ver Resumen en el Script

```bash
python extraer_datos_pdf_gva.py
# Opción 4: Ver resumen de datos actuales
```

Muestra:
```
RESUMEN DE DATOS ACTUALES
==================================================

📍 OLIVA
--------------------------------------------------
  Rústico: 14 cultivos con datos
    Ejemplos:
      • olivar_secano: 35,000 €/ha
      • olivar_regadio: 65,000 €/ha
      • almendro_secano: 20,000 €/ha

  Urbano: 8 tipos con datos
    Ejemplos:
      • vivienda: 0.50
      • local_comercial: 0.48
      • garaje: 0.40
```

### Opción B: Editar Manualmente el JSON

```bash
# Abrir el archivo JSON generado
cat data/valores_gva_2025.json

# O editarlo con tu editor favorito
code data/valores_gva_2025.json
```

El JSON tiene esta estructura:

```json
{
  "fuente": {
    "documento": "NNTT_2025_Urbana y Rústica.pdf",
    "organismo": "Generalitat Valenciana",
    "vigencia": {
      "desde": "2025-01-01",
      "hasta": "2025-12-31"
    }
  },
  "municipios": {
    "oliva": {
      "rustico": {
        "valores": {
          "olivar_secano": {
            "valor": 35000,
            "denominacion_oficial": "O- Olivos secano",
            "notas": ""
          },
          ...
        }
      },
      "urbano": {
        "valores": {
          "vivienda": {
            "coeficiente": 0.50,
            "denominacion_oficial": "Vivienda",
            "notas": ""
          },
          ...
        }
      }
    }
  }
}
```

### Opción C: Exportar Formato Simplificado

```bash
python extraer_datos_pdf_gva.py
# Opción 5: Exportar a formato simplificado
```

Genera: `data/valores_gva_2025_simplificado.json`

Con solo los valores numéricos:

```json
{
  "municipios": {
    "oliva": {
      "rustico": {
        "olivar_secano": 35000,
        "olivar_regadio": 65000,
        ...
      },
      "urbano": {
        "vivienda": 0.50,
        "local_comercial": 0.48,
        ...
      }
    }
  }
}
```

---

## Paso 3: Importar al Valorador (Cuando Esté Listo)

⚠️ **IMPORTANTE:** Este paso **SÍ modifica la aplicación**

```bash
python importar_datos_gva_a_valorador.py
```

### El Script Te Preguntará

```
IMPORTAR DATOS GVA AL VALORADOR
==================================================

⚠️  ADVERTENCIA: Este script modificará valorador_inmuebles.py

✓ Datos cargados: data/valores_gva_2025.json
  Fuente: NNTT_2025_Urbana y Rústica.pdf
  Vigencia: 2025-01-01 → 2025-12-31

📊 RESUMEN DE DATOS A IMPORTAR:

  Oliva:
    • Rústico: 14 cultivos
    • Urbano: 8 tipos

  Planes:
    • Rústico: 12 cultivos
    • Urbano: 7 tipos

  Vall de Gallinera:
    • Rústico: 11 cultivos
    • Urbano: 6 tipos

TOTAL: 37 valores rústicos, 21 coeficientes urbanos

¿Deseas continuar con la importación? (s/n):
```

### Acciones del Script

1. ✅ Crea backup automático: `valorador_inmuebles.py.backup_20251108_143022`
2. ✅ Lee los datos de `valores_gva_2025.json`
3. ✅ Actualiza `PRECIOS_RUSTICO` en `valorador_inmuebles.py`
4. ✅ Actualiza `COEFICIENTES_URBANO` en `valorador_inmuebles.py`
5. ✅ Añade comentarios con la fuente y fecha de importación

### Después de la Importación

```bash
# 1. Verificar cambios
diff valorador_inmuebles.py.backup_20251108_143022 valorador_inmuebles.py

# 2. Regenerar valoraciones con los nuevos valores
python valorador_inmuebles.py

# 3. Consolidar todo
python consolidar_valoraciones.py

# 4. Visualizar en frontend
python server.py
```

### Si Algo Sale Mal

```bash
# Restaurar desde el backup
cp valorador_inmuebles.py.backup_20251108_143022 valorador_inmuebles.py
```

---

## Estructura de Datos Completa

### Suelo Rústico

Para cada municipio y tipo de cultivo:

```json
"olivar_secano": {
  "valor": 35000,                        // Precio en €/ha
  "denominacion_oficial": "O- Olivos secano",  // Como aparece en PDF
  "notas": ""                            // Observaciones
}
```

**Tipos de cultivo incluidos:**
- olivar_secano / olivar_regadio
- almendro_secano / almendro_regadio
- vina_secano / vina_regadio
- frutal_secano / frutal_regadio
- citricos_regadio
- cereal_secano / cereal_regadio
- horticola_secano / horticola_regadio
- pastos / prado
- forestal / monte_bajo
- erial / improductivo

### Suelo Urbano

Para cada municipio y tipo de inmueble:

```json
"vivienda": {
  "coeficiente": 0.50,                   // Multiplicador del valor catastral
  "denominacion_oficial": "Vivienda",
  "zonificacion": [],                    // Si hay zonas con valores diferentes
  "notas": ""
}
```

**Tipos de inmueble incluidos:**
- vivienda
- local_comercial
- oficina
- industrial
- almacen
- garaje
- trastero
- solar

### Zonificación (Opcional)

Si un municipio tiene diferentes zonas con valores distintos:

```json
"zonificacion": {
  "descripcion": "Zonas urbanas con coeficientes diferenciados",
  "zonas": [
    {
      "nombre": "Centro histórico",
      "descripcion": "Casco antiguo de Oliva",
      "coeficientes_especificos": {
        "vivienda": 0.45,
        "local_comercial": 0.52
      }
    }
  ]
}
```

---

## Datos del PDF a Extraer

### Documento Oficial

```
URL: https://atv.gva.es/auto/ValorDictamen/01%20Normas%20T%E9cnicas%20de%20Valoraci%F3n/
     Devengos%20desde%2001_01_2025%20hasta%2031_12_2025/
     NNTT_2025_Urbana%20y%20R%FAstica.pdf

Título: Normas Técnicas de Valoración 2025
Organismo: Generalitat Valenciana - Agencia Tributaria Valenciana
Vigencia: 2025-01-01 hasta 2025-12-31
```

### Qué Buscar en el PDF

#### Para Suelo Rústico

Busca tablas por municipio con estructura tipo:

```
MUNICIPIO: OLIVA

Suelo Rústico - Valores €/hectárea

Cultivo                    Secano      Regadío
─────────────────────────────────────────────
Olivar (O-)               35.000      65.000
Almendro (AM-)            20.000      35.000
Viña (V-)                 25.000      45.000
Frutales (FR-)            28.000      55.000
...
```

#### Para Suelo Urbano

Busca tablas de coeficientes:

```
MUNICIPIO: OLIVA

Suelo Urbano - Coeficientes Multiplicadores

Tipo de Inmueble          Coeficiente
────────────────────────────────────
Vivienda                     0.50
Local comercial              0.48
Garaje                       0.40
...
```

---

## Ventajas de Este Sistema

### ✅ No Afecta la App Actual

Los datos se guardan en archivos JSON separados:
- `data/valores_gva_2025.json` (completo)
- `data/valores_gva_2025_simplificado.json` (solo valores)

La aplicación solo se modifica cuando ejecutes `importar_datos_gva_a_valorador.py`

### ✅ Datos Estructurados y Auditables

Todo queda documentado:
- Fuente oficial
- Fecha de extracción
- Denominaciones oficiales del PDF
- Notas y observaciones

### ✅ Proceso Incremental

Puedes:
1. Extraer datos de Oliva hoy
2. Extraer datos de Planes mañana
3. Completar Vall de Gallinera la próxima semana
4. Importar al valorador cuando todo esté listo

### ✅ Backups Automáticos

Antes de cada importación se crea backup:
```
valorador_inmuebles.py.backup_20251108_143022
valorador_inmuebles.py.backup_20251109_091530
...
```

### ✅ Fácil de Validar

```bash
# Ver qué cultivos tienen datos
jq '.municipios.oliva.rustico.valores | to_entries | .[] | select(.value.valor != null)' \
   data/valores_gva_2025.json

# Ver coeficientes urbanos
jq '.municipios.oliva.urbano.valores' data/valores_gva_2025.json
```

---

## Casos de Uso

### Caso 1: Extracción Completa

```bash
# Día 1: Extraer todo
python extraer_datos_pdf_gva.py
# → Introducir Oliva, Planes, Vall de Gallinera

# Día 2: Verificar
python extraer_datos_pdf_gva.py
# → Opción 4: Ver resumen

# Día 3: Importar
python importar_datos_gva_a_valorador.py
python valorador_inmuebles.py
```

### Caso 2: Extracción Incremental

```bash
# Semana 1: Solo Oliva
python extraer_datos_pdf_gva.py
# → Opción 1: Oliva

# Semana 2: Añadir Planes
python extraer_datos_pdf_gva.py
# → Opción 2: Planes

# Semana 3: Añadir Vall de Gallinera
python extraer_datos_pdf_gva.py
# → Opción 3: Vall de Gallinera

# Cuando esté todo: Importar
python importar_datos_gva_a_valorador.py
```

### Caso 3: Solo Consulta

```bash
# Extraer datos pero NO importar
python extraer_datos_pdf_gva.py

# Consultar JSON directamente
cat data/valores_gva_2025.json

# O usar en otros proyectos
cp data/valores_gva_2025.json /otro/proyecto/
```

### Caso 4: Actualización Anual

```bash
# Año 2026: Nuevo PDF NNTT_2026

# Renombrar datos actuales
mv data/valores_gva_2025.json data/valores_gva_2025_historico.json

# Extraer nuevos datos
python extraer_datos_pdf_gva.py
# → Introducir valores 2026

# Comparar cambios
diff data/valores_gva_2025_historico.json data/valores_gva_2025.json

# Importar si corresponde
python importar_datos_gva_a_valorador.py
```

---

## Próximos Pasos

1. **Abrir el PDF oficial de la GVA**
   - Documento: NNTT_2025_Urbana y Rústica.pdf
   - Localiza las secciones de Oliva, Planes, Vall de Gallinera

2. **Ejecutar el extractor**
   ```bash
   python extraer_datos_pdf_gva.py
   ```

3. **Introducir datos por municipio**
   - Empieza por el que tenga más propiedades
   - Guarda frecuentemente (Opción 0)

4. **Verificar datos extraídos**
   ```bash
   cat data/valores_gva_2025.json
   ```

5. **Cuando esté completo, importar al valorador**
   ```bash
   python importar_datos_gva_a_valorador.py
   ```

---

## Archivos Generados

| Archivo | Descripción | Modifica App |
|---------|-------------|--------------|
| `data/valores_gva_2025_template.json` | Template vacío | ❌ No |
| `data/valores_gva_2025.json` | Datos extraídos (completo) | ❌ No |
| `data/valores_gva_2025_simplificado.json` | Solo valores numéricos | ❌ No |
| `valorador_inmuebles.py.backup_*` | Backups automáticos | ❌ No |
| `valorador_inmuebles.py` (después de importar) | Valorador actualizado | ✅ Sí |

---

## Preguntas Frecuentes

### ¿Puedo usar esto sin modificar la aplicación?

**Sí.** Los scripts `extraer_datos_pdf_gva.py` solo guardan datos en JSON. La aplicación no se toca hasta que ejecutes `importar_datos_gva_a_valorador.py`.

### ¿Puedo editar el JSON manualmente?

**Sí.** El archivo `valores_gva_2025.json` es JSON estándar. Puedes editarlo con cualquier editor de texto.

### ¿Qué pasa si cometo un error?

El script interactivo guarda automáticamente. Si introduces un valor incorrecto:
1. Vuelve a ejecutar el script
2. Selecciona el mismo municipio
3. Introduce el valor correcto (sobrescribirá el anterior)

### ¿Puedo compartir estos datos?

Sí, pero ten en cuenta que son valores oficiales de la Generalitat Valenciana. Cita siempre la fuente original.

---

**Creado:** 2025-11-08
**Versión:** 1.0
**Fuente oficial:** Generalitat Valenciana - NNTT 2025
