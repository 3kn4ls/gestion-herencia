# 📊 Guía de Extracción de Valores de Referencia Oficiales

## ¿Qué son los Valores de Referencia?

Los **Valores de Referencia** son los valores oficiales publicados por el Catastro que sirven como base mínima para la tributación de las transmisiones inmobiliarias en el Impuesto sobre Transmisiones Patrimoniales y Actos Jurídicos Documentados (ITP y AJD) y el Impuesto sobre Sucesiones y Donaciones (ISD).

## 🎯 Proceso Completo

### Paso 1: Extraer Datos del Catastro

Si aún no lo has hecho, extrae los datos básicos de las propiedades:

```bash
python extraer_datos_reales.py
```

### Paso 2: Calcular Valoraciones

Genera las valoraciones estimadas:

```bash
python valorador_inmuebles.py
```

Esto creará `data/valoraciones.json`.

### Paso 3: Extraer Valores de Referencia Oficiales

**IMPORTANTE:** Este proceso requiere autenticación con Cl@ve Móvil.

```bash
python extraer_valores_referencia.py
```

#### ¿Qué hace este script?

1. **Abre el navegador automáticamente**
2. **Navega** al portal del catastro
3. **Accede** a la sección de Valores de Referencia 2025
4. **Te pide** que te autentiques con Cl@ve Móvil
5. **Espera** a que completes la autenticación
6. **Extrae** automáticamente los valores de referencia de todas las referencias en `referencias.txt`
7. **Guarda** los resultados en `data/valores_referencia.json`

#### Proceso de Autenticación

Cuando el script llegue a la autenticación:

```
⏳ AUTENTICACIÓN REQUERIDA
════════════════════════════════════════════════════════════

🔐 Por favor, completa la autenticación con Cl@ve Móvil en tu dispositivo

   Pasos:
   1. Abre la app Cl@ve Móvil en tu teléfono
   2. Confirma la autenticación
   3. Espera a que se redirija automáticamente

⏳ Esperando autenticación...
```

**¡NO CIERRES EL NAVEGADOR!** El script esperará hasta 5 minutos a que completes la autenticación.

Una vez autenticado, el proceso continúa automáticamente y extrae todos los valores de referencia.

### Paso 4: Consolidar Toda la Información

Una vez extraídos los valores de referencia, consolida toda la información:

```bash
python consolidar_valoraciones.py
```

Este script:
- ✅ Combina datos catastrales
- ✅ Combina valoraciones calculadas
- ✅ Combina valores de referencia oficiales
- ✅ Calcula diferencias y comparaciones
- ✅ Genera estadísticas
- ✅ Crea `data/datos_catastrales_consolidados_completo.json`
- ✅ Crea `data/resumen_consolidado.json`

### Paso 5: Visualizar en el Frontend

```bash
python server.py
```

Abre http://localhost:8000/frontend/

El frontend ahora mostrará:
- 💰 Valor Calculado (tu estimación)
- 📊 Valor Oficial (del catastro)
- 📈 Comparación y diferencia entre ambos

---

## 📋 Ejemplo de Salida

### Consola (consolidar_valoraciones.py)

```
RESUMEN DE CONSOLIDACIÓN
════════════════════════════════════════════════════════════

Total inmuebles: 3
Con valoración calculada: 3
Con valor de referencia oficial: 3
Con comparación: 3

📊 COMPARACIÓN DE VALORES:
  Suma valoraciones calculadas: 128,130.75 €
  Suma valores de referencia:   2,793.30 €
  Diferencia total:             125,337.45 €

  Diferencia media:             +4,582.86%
  Diferencia mínima:            +4,482.12%
  Diferencia máxima:            +4,682.45%

DETALLE POR INMUEBLE
════════════════════════════════════════════════════════════

📋 03106A002000090000YL
   💰 Valoración calculada: 42,710.25 €
   📊 Valor referencia oficial: 931.10 €
   📈 Diferencia: +41,779.15 € (+4,486.23%)
      → Valoración calculada es 4486.23% mayor
```

### Frontend - Tarjeta de Propiedad

Cuando tengas ambos valores, cada tarjeta mostrará:

```
┌─────────────────────────────────────────┐
│ 03106A002000090000YL                    │
│ PLANES (ALICANTE)                       │
│                                         │
│ Uso: Residencial                        │
│ Superficie: 120.5 m²                    │
│                                         │
│ ┌─────────────────┬─────────────────┐  │
│ │ 💰 Valor Calc.  │ 📊 Valor Ofic.  │  │
│ │  42,710.25 €    │     931.10 €    │  │
│ └─────────────────┴─────────────────┘  │
│                                         │
│ Diferencia: +41,779.15 € (+4,486.2%)   │
└─────────────────────────────────────────┘
```

### Frontend - Modal de Detalle

Al hacer clic en una propiedad verás:

```
💰 Valoraciones
┌──────────────────────────────────────────────┐
│  💰 Valor Calculado      📊 Valor Oficial    │
│    42,710.25 €              931.10 €         │
│                                              │
│  Diferencia                                  │
│  +41,779.15 € (+4,486.23%)                   │
│  El valor calculado es mayor                 │
└──────────────────────────────────────────────┘

📊 Detalle de Valoración Calculada
  Tipo: Urbano
  Método: coeficiente_multiplicador
  Valor Catastral: 85,420.50 €
  Coeficiente: 0.5

📊 Valor de Referencia Oficial (Catastro)
  Valor de Referencia: 931.10 €
  Ejercicio: 2025
  Fecha Consulta: 08/11/2025
  Finalidad: Tributación en ISD

ℹ️ Este es el valor de referencia oficial...
```

---

## 🔧 Requisitos

### Para Extraer Valores de Referencia

1. **Certificado Digital o Cl@ve Móvil**
   - Necesitas tener instalada la app Cl@ve Móvil en tu teléfono
   - Debe estar activada y vinculada a tu DNI/NIE

2. **Navegador Chrome**
   - El script usa Selenium con Chrome

3. **Conexión a Internet**
   - Proceso en línea, requiere conexión estable

---

## 📊 Estructura de Datos

### valores_referencia.json

```json
[
  {
    "referencia_catastral": "03106A002000090000YL",
    "valor_referencia": 931.10,
    "valor_referencia_texto": "931,10 €",
    "fecha_consulta": "08/11/2025",
    "ejercicio": "2025",
    "finalidad": "Tributación en Impuesto sobre Sucesiones y Donaciones",
    "fecha_extraccion": "2025-11-08T15:30:00.123456"
  }
]
```

### datos_catastrales_consolidados_completo.json

```json
[
  {
    "referencia_catastral": "03106A002000090000YL",
    "datos_inmueble": { ... },
    "localizacion": { ... },
    "valoracion_calculada": {
      "valor_estimado_euros": 42710.25,
      ...
    },
    "valor_referencia_oficial": {
      "valor_referencia": 931.10,
      ...
    },
    "comparacion": {
      "valor_calculado": 42710.25,
      "valor_oficial": 931.10,
      "diferencia_euros": 41779.15,
      "diferencia_porcentaje": 4486.23,
      "mayor": "calculado"
    }
  }
]
```

---

## 🎨 Interpretación de Resultados

### ¿Por qué hay tanta diferencia?

Es **normal** que haya diferencias significativas entre:
- **Valor Calculado:** Estimación de mercado basada en criterios actuales
- **Valor de Referencia:** Base mínima fiscal, suele ser más conservador

### Diferencia Positiva (Valor Calculado > Valor Oficial)

```
+41,779.15 € (+4,486.23%)
```

- ✅ Tu valoración calculada es más alta
- ✅ Significa que el mercado valora la propiedad más que el catastro
- ⚠️ Para impuestos, se usará el valor de referencia como mínimo

### Diferencia Negativa (Valor Oficial > Valor Calculado)

```
-5,000.00 € (-12.5%)
```

- ⚠️ El valor oficial es mayor que tu estimación
- 💡 Puede indicar que necesitas revisar tus criterios de valoración
- 📊 Para impuestos, tributarás sobre el valor de referencia

### Usos Prácticos

**Para Herencias:**
- El ISD se calcula sobre el **mayor** entre:
  - Valor declarado
  - Valor de referencia
  - Valor comprobado por la Administración

**Para Compraventas:**
- El ITP se calcula sobre el **mayor** entre:
  - Precio de compraventa declarado
  - Valor de referencia

---

## ⚠️ Solución de Problemas

### Error: "No se encontró el botón Cl@ve Móvil"

**Causa:** La estructura de la página puede haber cambiado

**Solución:**
- Verifica que estás en la página correcta
- Puede que necesites actualizar el selector en el script

### Error: "Tiempo de espera agotado"

**Causa:** No se completó la autenticación en 5 minutos

**Solución:**
- Vuelve a ejecutar el script
- Asegúrate de tener la app Cl@ve Móvil lista
- Verifica tu conexión a Internet

### El navegador se cierra solo

**Causa:** Error en el proceso

**Solución:**
- Revisa los mensajes de error en la consola
- Asegúrate de tener Chrome instalado
- Verifica que `chromedriver` esté actualizado

### No se extraen todos los valores

**Causa:** Alguna referencia no existe o tiene restricciones

**Solución:**
- Revisa la salida del script
- Verifica las referencias en `referencias.txt`
- Comprueba que las referencias sean correctas

---

## 🚀 Flujo Completo Resumido

```bash
# 1. Extraer datos básicos
python extraer_datos_reales.py

# 2. Calcular valoraciones
python valorador_inmuebles.py

# 3. Extraer valores de referencia (requiere autenticación)
python extraer_valores_referencia.py

# 4. Consolidar todo
python consolidar_valoraciones.py

# 5. Visualizar
python server.py
# Abrir: http://localhost:8000/frontend/
```

---

## 📚 Archivos Generados

| Archivo | Descripción |
|---------|-------------|
| `data/datos_catastrales_consolidados.json` | Datos extraídos del catastro |
| `data/valoraciones.json` | Valoraciones calculadas |
| `data/valores_referencia.json` | Valores oficiales del catastro |
| `data/datos_catastrales_consolidados_completo.json` | **TODO CONSOLIDADO** |
| `data/resumen_consolidado.json` | Estadísticas y resumen |

---

## 💡 Consejos

1. **Ejecuta en orden:** Sigue los pasos 1-5 en secuencia
2. **Ten Cl@ve lista:** Antes de ejecutar el paso 3, ten tu móvil a mano
3. **No cierres el navegador:** Durante el proceso de autenticación
4. **Revisa las diferencias:** Grandes diferencias pueden indicar errores
5. **Actualiza regularmente:** Los valores de referencia se actualizan anualmente

---

**Fecha de última actualización:** Noviembre 2025
**Versión:** 2.1 - Sistema completo con comparación de valores
