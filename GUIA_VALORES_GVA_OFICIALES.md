# 📋 Guía de Valores Oficiales GVA 2025

## 🎯 Objetivo

Configurar el sistema con los **valores oficiales exactos** de la Generalitat Valenciana para los municipios específicos:

- **Oliva**
- **Planes**
- **Vall de Gallinera**

Basado en: **Normas Técnicas de Valoración 2025** - Generalitat Valenciana

---

## 📄 Documento Fuente

```
https://atv.gva.es/auto/ValorDictamen/01%20Normas%20T%E9cnicas%20de%20Valoraci%F3n/
Devengos%20desde%2001_01_2025%20hasta%2031_12_2025/NNTT_2025_Urbana%20y%20R%FAstica.pdf
```

**Importante:** Necesitas tener acceso a este documento para introducir los valores correctos.

---

## 🚀 Proceso de Configuración

### Paso 1: Abrir el Documento PDF

1. Descarga el PDF de la Generalitat Valenciana
2. Busca las tablas de valoración para cada municipio:
   - **Oliva**
   - **Planes**
   - **Vall de Gallinera**

### Paso 2: Localizar los Valores

#### Para SUELO RÚSTICO

Busca en el PDF la tabla de valores por hectárea para cada tipo de cultivo:

**Ejemplo de lo que debes buscar:**
```
Municipio: OLIVA
─────────────────────────────────
Cultivo                  €/ha
─────────────────────────────────
Olivar secano           XXXXX
Olivar regadío          XXXXX
Almendro secano         XXXXX
...
```

#### Para SUELO URBANO

Busca los coeficientes multiplicadores o valores por m² según zona:

**Ejemplo:**
```
Municipio: OLIVA
─────────────────────────────────
Tipo                    Coeficiente
─────────────────────────────────
Vivienda                X.XX
Local comercial         X.XX
...
```

### Paso 3: Ejecutar el Script de Configuración

```bash
python configurar_valores_gva.py
```

El script te pedirá que introduzcas los valores para cada municipio.

#### Pantalla Interactiva

```
====================================================================
CONFIGURACIÓN DE VALORES OFICIALES DE VALORACIÓN 2025
====================================================================

Basado en: Normas Técnicas de Valoración - Generalitat Valenciana
Municipios: Oliva, Planes, Vall de Gallinera

Por favor, introduce los valores del documento oficial PDF:

====================================================================
MUNICIPIO: OLIVA
====================================================================

SUELO RÚSTICO - Oliva
--------------------------------------------------------------------
  Olivar Secano (€/ha): [INTRODUCE AQUÍ EL VALOR DEL PDF]
  Olivar Regadío (€/ha): [INTRODUCE AQUÍ EL VALOR DEL PDF]
  Almendro Secano (€/ha): [INTRODUCE AQUÍ EL VALOR DEL PDF]
  ...
```

### Paso 4: Aplicar los Valores al Sistema

Una vez introducidos todos los valores:

```bash
python aplicar_valores_oficiales_gva.py
```

Este script:
- ✅ Lee la configuración guardada
- ✅ Actualiza `valorador_inmuebles.py`
- ✅ Crea backup automático
- ✅ Aplica valores por municipio

### Paso 5: Regenerar Valoraciones

```bash
python valorador_inmuebles.py
```

### Paso 6: Visualizar

```bash
python server.py
```

Abre: http://localhost:8000/frontend/

---

## 📊 Estructura de Valores

### Valores que debes introducir para CADA MUNICIPIO:

#### Suelo Rústico (€/hectárea)

| Cultivo | Campo en Script |
|---------|----------------|
| Olivar Secano | `olivar_secano` |
| Olivar Regadío | `olivar_regadio` |
| Almendro Secano | `almendr_secano` |
| Almendro Regadío | `almendr_regadio` |
| Viña Secano | `vina_secano` |
| Viña Regadío | `vina_regadio` |
| Frutal Secano | `frutal_secano` |
| Frutal Regadío | `frutal_regadio` |
| Cereal Secano | `cereal_secano` |
| Cereal Regadío | `cereal_regadio` |
| Pastos | `pastos` |
| Forestal | `forestal` |
| Improductivo | `improductivo` |

#### Suelo Urbano (coeficientes)

| Tipo Inmueble | Campo en Script |
|---------------|----------------|
| Vivienda | `vivienda` |
| Local Comercial | `local` |
| Oficina | `oficina` |
| Garaje | `garaje` |
| Trastero | `trastero` |

---

## 💡 Consejos para Introducir Valores

### Si un valor NO aparece en el PDF:

1. **Déjalo en blanco** (el script usará 0)
2. O introduce un **valor razonable** basado en cultivos similares

### Formato de Entrada:

```
Correcto:    35000
Correcto:    35.000
Correcto:    35000,50
Incorrecto:  35 000 (con espacios)
```

### Coeficientes Urbanos:

```
Correcto:    0.5
Correcto:    0,5
Correcto:    1.25
```

---

## 🗂️ Archivos Generados

### Durante el Proceso

| Archivo | Descripción |
|---------|-------------|
| `config/valores_oficiales_gva_2025.json` | Configuración guardada |
| `valorador_inmuebles.py.backup` | Backup del valorador |
| `valorador_inmuebles.py` | Valorador actualizado |

### Ejemplo de JSON Generado

```json
{
  "fuente": "Normas Técnicas de Valoración 2025 - Generalitat Valenciana",
  "municipios": ["Oliva", "Planes", "Vall de Gallinera"],
  "fecha_configuracion": "2025",
  "PRECIOS_RUSTICO": {
    "oliva": {
      "olivar_secano": 35000,
      "olivar_regadio": 65000,
      ...
    },
    "planes": {
      "olivar_secano": 32000,
      ...
    },
    "vall_de_gallinera": {
      "olivar_secano": 30000,
      ...
    }
  },
  "COEFICIENTES_URBANO": {
    "oliva": {
      "vivienda": 0.5,
      "local": 0.5,
      ...
    }
  }
}
```

---

## 🔍 Cómo Funciona la Identificación de Municipio

El sistema identifica automáticamente el municipio de cada propiedad:

```python
# Extrae municipio de los datos catastrales
municipio = propiedad.localizacion.municipio  # Ej: "Planes"

# Busca valores específicos para ese municipio
precios = PRECIOS_RUSTICO[municipio.lower()]

# Si no existe, usa valores por defecto de Valencia
if municipio not in PRECIOS_RUSTICO:
    precios = PRECIOS_RUSTICO['valencia']
```

### Nombres de Municipio Reconocidos

El sistema reconoce múltiples variantes:

| Municipio | Variantes Reconocidas |
|-----------|----------------------|
| **Vall de Gallinera** | `vall de gallinera`, `vall_de_gallinera`, `vallgallinera` |
| **Planes** | `planes` |
| **Oliva** | `oliva` |

---

## 📋 Ejemplo de Sesión Completa

### 1. Configuración

```bash
$ python configurar_valores_gva.py

====================================================================
MUNICIPIO: OLIVA
====================================================================

SUELO RÚSTICO - Oliva
--------------------------------------------------------------------
  Olivar Secano (€/ha): 42500
  Olivar Regadío (€/ha): 75000
  Almendro Secano (€/ha): 25000
  Almendro Regadío (€/ha): 40000
  Viña Secano (€/ha): 30000
  ...

SUELO URBANO - COEFICIENTES
--------------------------------------------------------------------
Oliva:
  Vivienda (coeficiente): 0.55
  Local Comercial (coeficiente): 0.60
  ...

✅ CONFIGURACIÓN GUARDADA
Archivo: config/valores_oficiales_gva_2025.json
```

### 2. Aplicación

```bash
$ python aplicar_valores_oficiales_gva.py

====================================================================
APLICACIÓN DE VALORES OFICIALES GVA 2025
====================================================================

✓ Configuración cargada: config/valores_oficiales_gva_2025.json
✓ Backup creado: valorador_inmuebles.py.backup
✓ Configuración de municipios añadida
✓ PRECIOS_RUSTICO actualizado con valores GVA
✓ COEFICIENTES_URBANO actualizado con valores GVA
✓ Método identificar_region actualizado

✅ APLICACIÓN COMPLETADA
```

### 3. Valoración

```bash
$ python valorador_inmuebles.py

====================================================================
SISTEMA DE VALORACIÓN DE INMUEBLES
====================================================================

✓ Cargadas 3 propiedades

DETALLE POR PROPIEDAD
====================================================================

📋 03106A002000090000YL
   Municipio: Oliva
   Clase: Rústico
   Cultivo: Olivar secano
   Superficie: 1.197 ha
   Precio/ha: 42,500 €/ha (valor oficial GVA)
   💰 Valor estimado: 50,872.50 €
```

---

## ⚠️ Solución de Problemas

### Problema: "No se encontró config/valores_oficiales_gva_2025.json"

**Solución:** Ejecuta primero `python configurar_valores_gva.py`

### Problema: "Método identificar_region no se actualizó"

**Solución:**
1. Restaura el backup: `mv valorador_inmuebles.py.backup valorador_inmuebles.py`
2. Vuelve a ejecutar: `python aplicar_valores_oficiales_gva.py`

### Problema: Los valores siguen siendo antiguos

**Solución:**
1. Verifica que `valorador_inmuebles.py` tenga los nuevos valores
2. Ejecuta: `python valorador_inmuebles.py`
3. Limpia caché del navegador (Ctrl+Shift+R)

---

## 📊 Comparación: Antes vs Después

### ANTES (Valores Genéricos)

```
Olivar secano en Planes:
Precio: 35,000 €/ha (genérico Comunidad Valenciana)
1.5 ha × 35,000 = 52,500 €
```

### DESPUÉS (Valores Oficiales GVA)

```
Olivar secano en Planes:
Precio: 32,000 €/ha (oficial GVA para Planes)
1.5 ha × 32,000 = 48,000 €

Diferencia: -4,500 € (-8.6%)
Precisión: ✅ Valor oficial exacto del municipio
```

---

## ✅ Ventajas del Sistema

| Característica | Beneficio |
|----------------|-----------|
| **Valores por municipio** | Precisión máxima |
| **Fuente oficial GVA** | Validez legal |
| **Actualización sencilla** | Sin editar código manualmente |
| **Backup automático** | Seguridad |
| **Trazabilidad** | JSON documentado |
| **Identificación automática** | Sin intervención manual |

---

## 📚 Documentos Relacionados

- `configurar_valores_gva.py` - Script de configuración interactiva
- `aplicar_valores_oficiales_gva.py` - Script de aplicación
- `config/valores_oficiales_gva_2025.json` - Configuración guardada
- `GUIA_VALORACION.md` - Guía general de valoración

---

## 🎯 Checklist de Implementación

- [ ] Descargar PDF oficial de la GVA
- [ ] Localizar tablas de Oliva, Planes y Vall de Gallinera
- [ ] Ejecutar `python configurar_valores_gva.py`
- [ ] Introducir todos los valores del PDF
- [ ] Ejecutar `python aplicar_valores_oficiales_gva.py`
- [ ] Verificar que `valorador_inmuebles.py` se actualizó
- [ ] Ejecutar `python valorador_inmuebles.py`
- [ ] Comprobar resultados en el frontend
- [ ] Comparar con valores de referencia oficiales

---

**Fecha:** Noviembre 2025
**Versión:** 4.0 - Sistema con valores oficiales GVA por municipio
**Precisión:** ⭐⭐⭐⭐⭐ Máxima (valores oficiales exactos)
