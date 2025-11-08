# 🌿 Ejemplo de Valoración de Olivar

## Escenario Real

### Datos de la Finca

- **Referencia Catastral:** 03106A002000090000YL
- **Ubicación:** Planes, Alicante (Comunidad Valenciana)
- **Cultivo:** O- Olivos secano
- **Superficie:** 11,970 m² = **1.197 hectáreas**

## 📊 Comparación de Valoraciones

### ANTES (Precios Antiguos - 2024)

```
Precio por hectárea: 13,063 €/ha
────────────────────────────────────────
Cálculo:
  1.197 ha × 13,063 €/ha = 15,636.41 €

💰 Valoración: 15,636.41 €
```

### DESPUÉS (Precios Actualizados - 2025)

```
Precio por hectárea: 35,000 €/ha
────────────────────────────────────────
Cálculo:
  1.197 ha × 35,000 €/ha = 41,895.00 €

💰 Valoración: 41,895.00 €
```

### 📈 Diferencia

```
Incremento: +26,258.59 €
Porcentaje: +168%

La nueva valoración es 2.68 veces mayor
```

## 🎯 Comparación con Valor de Referencia Oficial

Supongamos que el valor de referencia del catastro es **931.10 €**:

| Concepto | Valor | vs Ref. Oficial |
|----------|-------|-----------------|
| **Valor Ref. Catastro** | 931.10 € | - |
| **Valoración Antigua** | 15,636.41 € | +1,578% |
| **Valoración Actualizada** | 41,895.00 € | **+4,398%** |
| **Diferencia entre valoraciones** | +26,258.59 € | - |

## 🔍 ¿Por qué tanta diferencia con el Catastro?

### Valor de Referencia del Catastro (931.10 €)

- ❌ **MUY desactualizado**
- ❌ **No refleja** mercado real
- ❌ **Metodología** muy conservadora
- ✅ Base mínima para **impuestos**
- ✅ Protege a Hacienda de infravaloración

### Valoración de Mercado Real (41,895 €)

- ✅ **Precio real** de venta
- ✅ Basado en **ofertas reales** 2025
- ✅ Considera **productividad**
- ✅ Incluye **valor agrícola**
- ✅ **Lo que pagaría** un comprador

## 📐 Desglose de la Fórmula

### Paso 1: Identificar el Cultivo

```python
Texto del catastro: "O- Olivos secano"
                      ↓
        identificar_tipo_cultivo()
                      ↓
          Tipo: "olivar_secano"
```

### Paso 2: Obtener la Superficie

```python
Superficie catastro: "11.970 m²"
                      ↓
          Convertir a hectáreas
                      ↓
        11,970 / 10,000 = 1.197 ha
```

### Paso 3: Buscar Precio según Región

```python
Provincia: "Alicante"
           ↓
      identificar_region()
           ↓
    Región: "valencia"
           ↓
  PRECIOS_RUSTICO["valencia"]["olivar_secano"]
           ↓
     35,000 €/ha
```

### Paso 4: Calcular Valor

```python
Valor = superficie_ha × precio_ha
Valor = 1.197 ha × 35,000 €/ha
Valor = 41,895.00 €
```

## 🌾 Valoración con Múltiples Cultivos

Si una parcela tiene varios cultivos:

### Ejemplo Parcela Mixta

```
Total superficie: 20,000 m² = 2.0 ha

Cultivos:
┌─────────────────────┬──────────┬──────────┬────────────┐
│ Cultivo             │ Superf.  │ Precio/ha│ Valor      │
├─────────────────────┼──────────┼──────────┼────────────┤
│ Olivos secano       │ 1.2 ha   │ 35,000 € │ 42,000 €   │
│ Almendros secano    │ 0.5 ha   │ 20,000 € │ 10,000 €   │
│ Pastos              │ 0.3 ha   │  5,000 € │  1,500 €   │
└─────────────────────┴──────────┴──────────┴────────────┘

VALOR TOTAL = 42,000 + 10,000 + 1,500 = 53,500 €
```

## 💰 Factores que Aumentan el Valor Real

Estos factores NO están en la fórmula básica, pero afectan el precio de mercado:

| Factor | Impacto en Precio |
|--------|-------------------|
| 🚗 **Buen acceso** (camino asfaltado) | +10% a +20% |
| 💧 **Riego disponible** | +50% a +100% |
| 🏆 **Producción alta** | +20% a +40% |
| 🏘️ **Pueblo cercano** (< 5km) | +10% a +15% |
| 🏅 **Denominación de origen** | +15% a +25% |
| 🌳 **Olivos antiguos productivos** | +15% a +30% |
| 🏗️ **Construcciones** (almacén, caseta) | +10% a +25% |
| 📱 **Electrificación** | +5% a +10% |

### Ejemplo Ajustado

```
Olivar base: 1.197 ha × 35,000 €/ha = 41,895 €

Ajustes:
  + Buen acceso asfaltado:     +15% = +6,284 €
  + Riego por goteo instalado: +75% = +31,421 €
  + Pueblo a 3km:              +12% = +5,027 €
  ─────────────────────────────────────────────
  VALOR AJUSTADO:                    84,627 €
```

## 📊 Precios de Referencia por Tipo (2025)

### Comunidad Valenciana

| Cultivo | Secano | Regadío |
|---------|--------|---------|
| **Olivar** | 35,000 €/ha | 65,000 €/ha |
| **Almendro** | 20,000 €/ha | 35,000 €/ha |
| **Viña** | 25,000 €/ha | 45,000 €/ha |
| **Frutales** | 28,000 €/ha | 55,000 €/ha |
| **Cereal** | 8,000 €/ha | 18,000 €/ha |
| **Pastos** | 5,000 €/ha | - |
| **Forestal** | 6,000 €/ha | - |

## 🎓 Cómo Ajustar para tu Caso Específico

### 1. Consultar Mercado Local

Busca ofertas similares en:
- Idealista Rural
- Milanuncios (sección agrícola)
- Portales especializados en fincas

### 2. Calcular Precio Medio

```
Ejemplo ofertas encontradas:
- Olivar 1.5 ha → 60,000 € = 40,000 €/ha
- Olivar 2.0 ha → 70,000 € = 35,000 €/ha
- Olivar 1.8 ha → 75,000 € = 41,667 €/ha

Media: (40,000 + 35,000 + 41,667) / 3 = 38,889 €/ha
```

### 3. Actualizar en el Código

```python
# En valorador_inmuebles.py, línea ~28:
"olivar_secano": 38889,  # Tu precio calculado
```

### 4. Regenerar Valoraciones

```bash
python valorador_inmuebles.py
```

## ✅ Validación de Resultados

### Señales de Precio Correcto

- ✅ Similar a ofertas de venta en la zona
- ✅ Dentro del rango razonable (25-50k €/ha para olivar secano)
- ✅ Coherente con productividad de la finca
- ✅ Refleja estado de los olivos

### Señales de Precio Incorrecto

- ❌ Muy por debajo de ofertas similares
- ❌ Igual o similar al valor catastral (demasiado bajo)
- ❌ Fuera de rango razonable (< 15k o > 100k €/ha sin justificación)

## 📞 Validación Profesional

Para estar seguro del valor:

1. **Tasador Oficial**
   - Valoración homologada
   - Acepta banco
   - Coste: 200-400 €

2. **Agente Inmobiliario Rural**
   - Conoce mercado local
   - Opinión gratuita
   - Experiencia en zona

3. **Cooperativa Agrícola Local**
   - Conocen precios reales
   - Pueden orientar
   - Información informal

---

## 🚀 Resumen Ejecutivo

| Concepto | Valor |
|----------|-------|
| **Superficie** | 1.197 ha |
| **Cultivo** | Olivar secano |
| **Región** | Comunidad Valenciana |
| **Precio/ha (2025)** | 35,000 € |
| **Valor Calculado** | **41,895 €** |
| **Valor Catastro** | 931.10 € |
| **Diferencia** | +40,963.90 € (+4,398%) |

### La diferencia es NORMAL

- El valor del catastro es **extremadamente conservador**
- El valor calculado refleja el **mercado real**
- Para compraventa, usa el **valor calculado**
- Para impuestos, se aplicará el **valor de referencia como mínimo**

---

**Fecha:** Noviembre 2025
**Precios:** Mercado actualizado
**Método:** Precio por hectárea según cultivo
