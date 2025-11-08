# Guía de Configuración de Valores Oficiales GVA por Municipio

## Resumen

El sistema ahora soporta **valoraciones específicas por municipio** utilizando valores oficiales de la Generalitat Valenciana.

Se ha actualizado para los municipios de:
- **Oliva**
- **Planes**
- **Vall de Gallinera**

## Cambios Implementados

### 1. Método `identificar_region()` Actualizado

```python
def identificar_region(self, provincia: str, municipio: str = "") -> str:
    """
    Identifica la región para aplicar precios correctos

    Prioriza municipios específicos con valores oficiales GVA,
    luego usa la provincia como fallback.
    """
```

**Funcionalidad:**
- ✅ Acepta parámetro `municipio` (opcional)
- ✅ Identifica municipios específicos: Oliva, Planes, Vall de Gallinera
- ✅ Normaliza nombres (maneja espacios, mayúsculas/minúsculas)
- ✅ Fallback a provincia si no hay municipio específico

### 2. Métodos de Valoración Actualizados

Tanto `valorar_rustico()` como `valorar_urbano()` ahora:
- ✅ Extraen el municipio de los datos catastrales
- ✅ Pasan el municipio a `identificar_region()`
- ✅ Usan precios específicos del municipio cuando están disponibles

## Opciones para Configurar Valores Oficiales

Tienes **dos opciones** para añadir los valores oficiales del PDF de la GVA:

---

### OPCIÓN A: Scripts Automáticos (Recomendado)

#### Paso 1: Configurar Valores

```bash
python configurar_valores_gva.py
```

Este script te pedirá que introduzcas los valores del PDF manualmente para cada municipio.

**Ejemplo de uso:**
```
MUNICIPIO: OLIVA
==================================================================

SUELO RÚSTICO - Oliva
------------------------------------------------------------------
  Olivar Secano (€/ha): 35000
  Olivar Regadío (€/ha): 65000
  Almendro Secano (€/ha): 20000
  ...
```

Se guardará en: `config/valores_oficiales_gva_2025.json`

#### Paso 2: Aplicar al Valorador

```bash
python aplicar_valores_oficiales_gva.py
```

Este script:
- ✅ Lee la configuración guardada
- ✅ Actualiza `valorador_inmuebles.py` con los valores oficiales
- ✅ Crea backup automáticamente

⚠️ **NOTA:** Este script sobrescribirá las definiciones de `PRECIOS_RUSTICO` y `COEFICIENTES_URBANO` en el valorador.

---

### OPCIÓN B: Edición Manual (Más Control)

Si prefieres tener control total, edita directamente `valorador_inmuebles.py`.

#### 1. Añadir Valores para Oliva

En la sección `PRECIOS_RUSTICO` (línea ~25), añade:

```python
PRECIOS_RUSTICO = {
    # Oliva - Valores oficiales GVA 2025
    "oliva": {
        "olivar_secano": 35000,      # Del PDF oficial
        "olivar_regadio": 65000,     # Del PDF oficial
        "almendr_secano": 20000,
        "almendr_regadio": 35000,
        "vina_secano": 25000,
        "vina_regadio": 45000,
        "frutal_secano": 28000,
        "frutal_regadio": 55000,
        "cereal_secano": 8000,
        "cereal_regadio": 18000,
        "pastos": 5000,
        "forestal": 6000,
        "improductivo": 2000,
        "default": 10000
    },
```

#### 2. Añadir Valores para Planes

```python
    # Planes - Valores oficiales GVA 2025
    "planes": {
        "olivar_secano": XXXXX,      # Del PDF oficial
        "olivar_regadio": XXXXX,     # Del PDF oficial
        # ... resto de valores
    },
```

#### 3. Añadir Valores para Vall de Gallinera

```python
    # Vall de Gallinera - Valores oficiales GVA 2025
    "vall_de_gallinera": {
        "olivar_secano": XXXXX,      # Del PDF oficial
        "olivar_regadio": XXXXX,     # Del PDF oficial
        # ... resto de valores
    },
```

#### 4. Mantener Valencia como Fallback

```python
    # Comunidad Valenciana (fallback general)
    "valencia": {
        "olivar_secano": 35000,
        # ... valores generales
    },
```

---

## Verificación

Una vez configurados los valores, verifica que el sistema funciona:

### 1. Regenerar Valoraciones

```bash
python valorador_inmuebles.py
```

Esto generará `data/valoraciones.json` con los nuevos valores.

### 2. Consolidar Datos

```bash
python consolidar_valoraciones.py
```

Esto combina datos catastrales + valoraciones + valores de referencia oficiales.

### 3. Visualizar en Frontend

```bash
python server.py
```

Abre: `http://localhost:8000/frontend/`

El frontend ahora:
- ✅ Carga automáticamente `datos_catastrales_consolidados_completo.json`
- ✅ Muestra modal de configuración para ajustar parámetros
- ✅ Permite valorar con criterios personalizados

## Cómo Extraer Valores del PDF Oficial

### Documento de Referencia

```
https://atv.gva.es/auto/ValorDictamen/01%20Normas%20T%E9cnicas%20de%20Valoraci%F3n/
Devengos%20desde%2001_01_2025%20hasta%2031_12_2025/
NNTT_2025_Urbana%20y%20R%FAstica.pdf
```

### Qué Buscar en el PDF

#### Para Suelo Rústico:

Busca tablas o secciones para cada municipio con:
- **Olivar secano** (€/hectárea)
- **Olivar regadío** (€/hectárea)
- **Almendro secano** (€/hectárea)
- **Almendro regadío** (€/hectárea)
- **Viña secano** (€/hectárea)
- **Viña regadío** (€/hectárea)
- **Frutales secano** (€/hectárea)
- **Frutales regadío** (€/hectárea)
- **Cereal secano** (€/hectárea)
- **Cereal regadío** (€/hectárea)
- **Pastos** (€/hectárea)
- **Forestal** (€/hectárea)
- **Improductivo** (€/hectárea)

#### Para Suelo Urbano:

Busca **coeficientes multiplicadores**:
- **Vivienda**: 0.X (coeficiente)
- **Local**: 0.X
- **Oficina**: 0.X
- **Garaje**: 0.X
- **Trastero**: 0.X

**Fórmula urbana:** `Valor Mercado = Valor Catastral × Coeficiente`

## Estructura de Datos Final

Después de la configuración, `valorador_inmuebles.py` tendrá:

```python
PRECIOS_RUSTICO = {
    "oliva": { ... },           # Valores específicos Oliva
    "planes": { ... },          # Valores específicos Planes
    "vall_de_gallinera": { ... }, # Valores específicos Vall de Gallinera
    "valencia": { ... },        # Fallback Comunidad Valenciana
    "nacional": { ... },        # Fallback nacional
    "default": { ... }          # Fallback por defecto
}

COEFICIENTES_URBANO = {
    "oliva": { ... },
    "planes": { ... },
    "vall_de_gallinera": { ... },
    "valencia": { ... },
    "default": { ... }
}
```

## Lógica de Selección de Valores

```
Propiedad en Planes, Alicante
         ↓
identificar_region("Alicante", "Planes")
         ↓
  Municipio = "planes"?  → SÍ
         ↓
  return "planes"
         ↓
PRECIOS_RUSTICO["planes"]
         ↓
  Usar valores oficiales de Planes
```

## Próximos Pasos Recomendados

### Paso 1: Extraer Valores del PDF

Abre el PDF oficial y extrae los valores para:
- Oliva
- Planes
- Vall de Gallinera

### Paso 2: Configurar el Sistema

Elige entre:
- **Opción A:** `python configurar_valores_gva.py` (automático)
- **Opción B:** Editar manualmente `valorador_inmuebles.py`

### Paso 3: Regenerar Valoraciones

```bash
python valorador_inmuebles.py
```

### Paso 4: Verificar Resultados

```bash
python consolidar_valoraciones.py
python server.py
```

Revisa en el frontend que:
- ✅ Las propiedades de Oliva usan valores de Oliva
- ✅ Las propiedades de Planes usan valores de Planes
- ✅ Las propiedades de Vall de Gallinera usan valores de Vall de Gallinera
- ✅ Otras propiedades usan valores de "valencia" (fallback)

## Archivos Clave Modificados

| Archivo | Cambio |
|---------|--------|
| `valorador_inmuebles.py` | ✅ Método `identificar_region()` acepta municipio |
| `valorador_inmuebles.py` | ✅ `valorar_rustico()` pasa municipio |
| `valorador_inmuebles.py` | ✅ `valorar_urbano()` pasa municipio |
| `configurar_valores_gva.py` | ✅ Script interactivo para configurar valores |
| `aplicar_valores_oficiales_gva.py` | ✅ Script para aplicar configuración |

## Soporte

Si tienes dudas sobre:
- **Valores del PDF:** Consulta directamente el documento oficial de la GVA
- **Errores del sistema:** Revisa los logs y backups creados automáticamente
- **Validación:** Compara resultados con tasaciones profesionales

---

**Última actualización:** 2025-11-08
**Versión del sistema:** 2.0 (con soporte municipal)
**Fuente oficial:** Normas Técnicas de Valoración 2025 - Generalitat Valenciana
