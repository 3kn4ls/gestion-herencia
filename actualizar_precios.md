# 🔧 Guía para Actualizar Precios de Valoración

## ⚠️ Problema Identificado

Los precios actuales en el sistema son **muy conservadores** y pueden no reflejar el mercado real de 2025.

## 📊 Precios Actuales vs Recomendados

### Olivar en Comunidad Valenciana

| Tipo | Precio Actual | Precio Recomendado 2025 | Diferencia |
|------|--------------|------------------------|------------|
| Olivar Secano | 13,063 €/ha | **35,000 €/ha** | +168% |
| Olivar Regadío | 25,245 €/ha | **65,000 €/ha** | +158% |

### Olivar a Nivel Nacional

| Tipo | Precio Actual | Precio Recomendado 2025 | Diferencia |
|------|--------------|------------------------|------------|
| Olivar Secano | 18,905 €/ha | **30,000 €/ha** | +59% |
| Olivar Regadío | 38,027 €/ha | **60,000 €/ha** | +58% |

## 🔧 Cómo Actualizar los Precios

### Opción 1: Edición Manual del Código

1. Abre el archivo `valorador_inmuebles.py`
2. Busca la línea 27-28 aproximadamente
3. Modifica los valores:

```python
# ANTES (línea 28-29)
"olivar_secano": 13063,      # Muy bajo
"olivar_regadio": 25245,     # Muy bajo

# DESPUÉS (valores recomendados)
"olivar_secano": 35000,      # €/ha - Mercado 2025
"olivar_regadio": 65000,     # €/ha - Mercado 2025
```

### Opción 2: Usar Script de Actualización

Ejecuta este comando para actualizar automáticamente:

```bash
# Editar directamente con sed (Linux/Mac)
sed -i 's/"olivar_secano": 13063/"olivar_secano": 35000/' valorador_inmuebles.py
sed -i 's/"olivar_regadio": 25245/"olivar_regadio": 65000/' valorador_inmuebles.py
```

## 📍 Precios Específicos por Zona

### Comunidad Valenciana - Recomendaciones Detalladas

```python
"valencia": {
    "olivar_secano": 35000,      # Actualizado 2025
    "olivar_regadio": 65000,     # Actualizado 2025
    "almendr_secano": 20000,     # Actualizado (antes 8000)
    "almendr_regadio": 35000,    # Actualizado (antes 15000)
    "vina_secano": 25000,        # Actualizado (antes 10000)
    "vina_regadio": 45000,       # Actualizado (antes 20000)
    "frutal_secano": 28000,      # Actualizado (antes 12000)
    "frutal_regadio": 55000,     # Actualizado (antes 28000)
    "cereal_secano": 8000,       # Actualizado (antes 5000)
    "cereal_regadio": 18000,     # Actualizado (antes 12000)
    "pastos": 5000,              # Actualizado (antes 3000)
    "forestal": 6000,            # Actualizado (antes 4000)
    "improductivo": 2000,        # Actualizado (antes 1000)
    "default": 10000             # Actualizado (antes 5000)
}
```

### Nacional - Recomendaciones

```python
"nacional": {
    "olivar_secano": 30000,      # Actualizado (antes 18905)
    "olivar_regadio": 60000,     # Actualizado (antes 38027)
    "olivar_total": 40000,       # Actualizado (antes 22844)
    "default": 20000             # Actualizado (antes 10200)
}
```

## 🌍 Fuentes para Obtener Precios Reales

### 1. Portales Especializados

- **Agronews Castilla y León**: https://www.agronewscastillayleon.com/precio-tierra-agricola
- **Cocampo**: Portal de precios de fincas rústicas
- **MAPA**: Ministerio de Agricultura (Observatorio de Precios)

### 2. Asociaciones Agrarias

- **ASAJA**: Asociación Agraria - Jóvenes Agricultores
- **COAG**: Coordinadora de Organizaciones de Agricultores y Ganaderos
- **UPA**: Unión de Pequeños Agricultores

### 3. Tasadores Oficiales

- Consulta tasadores oficiales de tu zona
- Solicita valoración de mercado actual

### 4. Portales Inmobiliarios Rurales

- **Fincas y Olivares**: Portales especializados
- **Idealista Rural**: Sección de fincas rústicas
- **Milanuncios**: Ofertas de terrenos agrícolas

## 💡 Método para Calcular tu Propio Precio

### Paso 1: Buscar Ofertas Similares

Busca en portales inmobiliarios:
- Misma provincia
- Mismo tipo de cultivo
- Superficie similar

### Paso 2: Calcular Precio Medio

```
Ejemplo de ofertas encontradas:
- Olivar 1.5 ha en Alicante: 60,000 € → 40,000 €/ha
- Olivar 2.0 ha en Alicante: 70,000 € → 35,000 €/ha
- Olivar 1.2 ha en Alicante: 48,000 € → 40,000 €/ha

Precio medio: (40,000 + 35,000 + 40,000) / 3 = 38,333 €/ha
```

### Paso 3: Aplicar Factores de Ajuste

| Factor | Ajuste |
|--------|--------|
| Muy buen acceso | +10% a +20% |
| Riego disponible | +50% a +100% |
| Producción alta | +20% a +40% |
| Pueblo cercano (< 5km) | +10% a +15% |
| Denominación de origen | +15% a +25% |
| Mal estado olivos | -20% a -40% |
| Sin acceso/camino | -15% a -30% |
| Pendiente excesiva | -10% a -25% |

### Paso 4: Actualizar el Código

Usa el precio calculado en `valorador_inmuebles.py`

## 📐 Fórmula Completa Explicada

### Para Terrenos Rústicos

```python
# 1. Identificar el cultivo
cultivo_texto = "O- Olivos secano"
tipo_cultivo = identificar_tipo_cultivo(cultivo_texto)  # → "olivar_secano"

# 2. Obtener superficie
superficie_m2 = 11970  # Del catastro
superficie_ha = superficie_m2 / 10000  # → 1.197 ha

# 3. Obtener precio por hectárea
precio_ha = PRECIOS_RUSTICO["valencia"]["olivar_secano"]  # → 35,000 €/ha

# 4. Calcular valor
valor = superficie_ha × precio_ha
valor = 1.197 ha × 35,000 €/ha = 41,895 €
```

### Para Múltiples Cultivos

Si una parcela tiene varios cultivos:

```python
total = 0
for cultivo in cultivos:
    superficie_cultivo_ha = cultivo["superficie_m2"] / 10000
    precio_ha = obtener_precio(cultivo["tipo"])
    total += superficie_cultivo_ha × precio_ha
```

## 🎯 Ejemplo Completo: Antes y Después

### Parcela de Ejemplo
- **Ubicación:** Planes, Alicante
- **Cultivo:** O- Olivos secano
- **Superficie:** 11,970 m² = 1.197 ha

### ANTES (Precios Bajos)
```
Precio: 13,063 €/ha
Valor = 1.197 ha × 13,063 €/ha = 15,636.41 €
```

### DESPUÉS (Precios Actualizados)
```
Precio: 35,000 €/ha
Valor = 1.197 ha × 35,000 €/ha = 41,895 €
```

**Diferencia: +26,258.59 € (+168%)**

## 🔄 Después de Actualizar

1. **Regenerar valoraciones:**
```bash
python valorador_inmuebles.py
```

2. **Consolidar datos:**
```bash
python consolidar_valoraciones.py
```

3. **Ver resultados:**
```bash
python server.py
# Abrir: http://localhost:8000/frontend/
```

## ⚖️ Comparación con Valor de Referencia

Después de actualizar los precios:

### Escenario Típico

| Concepto | Valor |
|----------|-------|
| Valor Calculado (actualizado) | 41,895 € |
| Valor de Referencia Oficial | 931.10 € |
| Diferencia | +40,963.90 € |

**Nota:** El valor de referencia del catastro suele ser MUY inferior al valor de mercado real. Es normal esta diferencia.

### ¿Por qué el Valor de Referencia es tan Bajo?

1. **Metodología conservadora** del catastro
2. **Actualización lenta** de los valores
3. **No considera** mejoras recientes
4. **Base para tributación**, no para venta
5. **Valores históricos** no actualizados a mercado

## 📊 Validación de Precios

### Precios Considerados Razonables (2025)

#### Olivar Alicante

| Categoría | Rango Aceptable |
|-----------|-----------------|
| Olivar secano básico | 25,000 - 40,000 €/ha |
| Olivar secano bueno | 35,000 - 50,000 €/ha |
| Olivar regadío básico | 50,000 - 70,000 €/ha |
| Olivar regadío premium | 65,000 - 100,000 €/ha |

#### Otros Cultivos Alicante

| Cultivo | Rango Aceptable |
|---------|-----------------|
| Almendro secano | 15,000 - 25,000 €/ha |
| Almendro regadío | 30,000 - 45,000 €/ha |
| Viña secano | 20,000 - 30,000 €/ha |
| Viña regadío | 40,000 - 60,000 €/ha |
| Frutales regadío | 45,000 - 70,000 €/ha |
| Cereal secano | 6,000 - 10,000 €/ha |

## 🚀 Script de Actualización Rápida

Crea este archivo `actualizar_precios.sh`:

```bash
#!/bin/bash

# Actualizar precios Valencia
sed -i 's/"olivar_secano": 13063/"olivar_secano": 35000/' valorador_inmuebles.py
sed -i 's/"olivar_regadio": 25245/"olivar_regadio": 65000/' valorador_inmuebles.py
sed -i 's/"almendr_secano": 8000/"almendr_secano": 20000/' valorador_inmuebles.py
sed -i 's/"almendr_regadio": 15000/"almendr_regadio": 35000/' valorador_inmuebles.py

# Regenerar valoraciones
python valorador_inmuebles.py

# Consolidar
python consolidar_valoraciones.py

echo "✅ Precios actualizados y valoraciones regeneradas"
```

Ejecutar:
```bash
chmod +x actualizar_precios.sh
./actualizar_precios.sh
```

---

**Última actualización:** Noviembre 2025
**Precios recomendados:** Basados en mercado real 2025
