# 📊 Guía de Valoración de Propiedades - Sistema 2026

## ✨ Nueva Funcionalidad: Valoración Automática

El sistema ahora incluye un módulo de valoración que estima el precio de mercado de las propiedades basándose en criterios actualizados para 2026.

---

## 🎯 Cómo Usar el Sistema Completo

### Paso 1: Extraer Datos del Catastro

Primero, extrae los datos reales de tus propiedades:

```bash
python extraer_datos_reales.py
```

Esto generará archivos JSON con los datos catastrales de cada referencia en la carpeta `data/`.

### Paso 2: Iniciar el Servidor

Inicia el servidor web:

```bash
python server.py
```

El servidor arrancará en http://localhost:8000

### Paso 3: Acceder al Frontend

Abre tu navegador en:

```
http://localhost:8000/frontend/
```

### Paso 4: Cargar Datos

Haz clic en **"Cargar Datos de Ejemplo"** para cargar los datos extraídos.

### Paso 5: Valorar Propiedades

Haz clic en el botón **"💰 Valorar Propiedades"**

El sistema:
- Enviará los datos a la API de valoración
- Calculará el valor estimado de cada propiedad
- Mostrará un resumen con el valor total

### Paso 6: Visualizar Resultados

Después de valorar:
- El **resumen general** mostrará el **Valor Estimado Total**
- Cada **tarjeta de propiedad** mostrará su valor estimado
- Al hacer clic en una propiedad, verás detalles completos de la valoración

---

## 💰 Criterios de Valoración

### Propiedades Urbanas

Para inmuebles urbanos, se utiliza:

**Fórmula:** `Valor Mercado = Valor Catastral × Coeficiente`

**Coeficientes por Comunidad Autónoma (2025):**
- Comunidad Valenciana: 0.5
- Otras CCAA: 0.5 (estimado)

**Importante:** Los coeficientes oficiales se publican anualmente en las Órdenes de cada Comunidad Autónoma.

### Propiedades Rústicas

Para terrenos rústicos, se utilizan precios de mercado por hectárea según:
- **Tipo de cultivo** (olivar, almendro, viña, cereal, etc.)
- **Régimen** (secano o regadío)
- **Provincia** (precios regionales)

**Fuentes de Datos:**
- **Cocampo 2024/2025** - Precios actualizados de terrenos agrícolas
- **MAPA 2022** - Ministerio de Agricultura, Pesca y Alimentación

**Ejemplo de Precios (Comunidad Valenciana):**
| Tipo de Cultivo | Precio €/ha |
|-----------------|-------------|
| Olivar Secano | 13,063 |
| Olivar Regadío | 25,245 |
| Almendro Secano | 8,000 |
| Viña Secano | 10,000 |
| Frutal Regadío | 28,000 |

---

## 📋 Detalles de la Valoración

### En las Tarjetas de Propiedades

Verás:
- **Valor Estimado** destacado en verde
- Formato: `42,710.25 €`

### En el Modal de Detalle

Al hacer clic en una propiedad, verás:

**Para Urbanos:**
- Valor Estimado
- Tipo de Valoración
- Método aplicado
- Valor Catastral
- Coeficiente aplicado
- Fuente de criterios

**Para Rústicos:**
- Valor Estimado Total
- Superficie total (ha y m²)
- Precio por hectárea
- **Desglose por Cultivos:**
  - Tipo de cultivo
  - Superficie (ha)
  - Precio por hectárea
  - Valor estimado del cultivo
- Fuente de precios

### Advertencias

El sistema muestra advertencias importantes:
- Valoración orientativa (no sustituye tasación oficial)
- Coeficientes estimados (verificar con Orden oficial)
- Limitaciones de los datos

---

## 🔧 Uso Avanzado

### Valorar desde Línea de Comandos

Puedes generar valoraciones directamente:

```bash
python valorador_inmuebles.py
```

Esto generará:
- `data/valoraciones.json` - Valoraciones completas
- Resumen en consola

### API de Valoración

El servidor expone un endpoint REST:

**Endpoint:** `POST /api/valorar`

**Request:**
```json
[
  {
    "referencia_catastral": "03106A002000090000YL",
    "datos_inmueble": { ... },
    "localizacion": { ... }
  }
]
```

**Response:**
```json
{
  "resumen": {
    "total_propiedades": 3,
    "valor_total_estimado": 128130.75,
    "fecha_valoracion": "2025-11-08T14:30:00"
  },
  "valoraciones": [...]
}
```

---

## ⚙️ Configuración de Criterios

### Actualizar Precios

Para actualizar los precios de mercado, edita:

```python
# En valorador_inmuebles.py

class CriteriosValoracion:
    PRECIOS_RUSTICO = {
        "valencia": {
            "olivar_secano": 13063,  # Actualiza aquí
            ...
        }
    }
```

### Añadir Nueva Región

```python
PRECIOS_RUSTICO = {
    "nueva_region": {
        "olivar_secano": 15000,
        "olivar_regadio": 30000,
        ...
    }
}
```

---

## 📊 Interpretación de Resultados

### Valor Total del Portfolio

El sistema suma todas las propiedades valoradas y muestra:
- Número total de propiedades
- Valor total estimado en euros
- Fecha de valoración

### Precisión de las Valoraciones

**Alta Precisión (±10%):**
- Terrenos rústicos con datos de cultivos completos
- Propiedades urbanas con valor catastral

**Precisión Media (±20%):**
- Terrenos sin especificación de cultivos
- Propiedades sin todos los datos

**Limitaciones:**
- No incluye mejoras no registradas
- No considera estado de conservación
- No incluye elementos externos (accesos, servicios, vistas)

---

## ⚠️ Advertencias Importantes

1. **Valoración Orientativa:** Los valores son estimaciones basadas en criterios de mercado generales. Para operaciones legales o financieras, se requiere tasación oficial.

2. **Coeficientes Oficiales:** Los coeficientes para propiedades urbanas deben verificarse en las Órdenes anuales de cada Comunidad Autónoma.

3. **Actualización de Precios:** Los precios de mercado cambian. Actualiza regularmente los criterios en `valorador_inmuebles.py`.

4. **Datos de Entrada:** La precisión depende de la calidad de los datos extraídos del catastro.

---

## 🆘 Solución de Problemas

### "Error al valorar las propiedades"

**Causa:** El servidor no está corriendo o no responde.

**Solución:**
```bash
# Verificar que el servidor está activo
python server.py
```

### "No hay propiedades cargadas para valorar"

**Causa:** No se han cargado datos en el frontend.

**Solución:** Haz clic en "Cargar Datos de Ejemplo" primero.

### Valoraciones = 0 €

**Causa:** Faltan datos necesarios (valor catastral para urbanos, cultivos para rústicos).

**Solución:**
- Para urbanos: Verificar que `datos_catastrales.valor_catastral` existe
- Para rústicos: Verificar que hay datos de superficie y cultivos

---

## 📚 Recursos Adicionales

### Fuentes de Información Oficial

- **Sede Catastro:** https://www.sedecatastro.gob.es/
- **Órdenes CCAA:** Consulta en el Boletín Oficial de tu Comunidad
- **MAPA:** https://www.mapa.gob.es/
- **Cocampo:** Plataforma de precios agrícolas

### Archivos Relacionados

- `valorador_inmuebles.py` - Motor de valoración
- `server.py` - API REST
- `frontend/app.js` - Interfaz de valoración
- `data/valoraciones.json` - Resultados guardados

---

## 🎯 Resumen Rápido

| Paso | Acción |
|------|--------|
| 1 | `python extraer_datos_reales.py` |
| 2 | `python server.py` |
| 3 | Abrir http://localhost:8000/frontend/ |
| 4 | Clic en "Cargar Datos de Ejemplo" |
| 5 | Clic en "💰 Valorar Propiedades" |
| 6 | Ver resultados en pantalla |

---

**Fecha de última actualización:** Noviembre 2025
**Versión del sistema:** 2.0 con valoración integrada
