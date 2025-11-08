# ⚙️ Guía de Configuración de Valoración

## 🎯 Nuevas Funcionalidades

### 1️⃣ Carga Automática al Inicio

Al abrir el frontend, **automáticamente se cargan los datos** sin necesidad de hacer clic en ningún botón.

**Prioridad de carga:**
1. Intenta cargar `datos_catastrales_consolidados_completo.json` (con valores oficiales)
2. Si no existe, carga `datos_catastrales_consolidados.json` (datos básicos)
3. Si ninguno existe, la página queda lista para cargar manualmente

**Ventajas:**
- ✅ Acceso inmediato a los datos
- ✅ No requiere interacción del usuario
- ✅ Carga silenciosa sin interrupciones

---

### 2️⃣ Modal de Configuración de Valoración

El nuevo sistema te permite **ver y modificar TODOS los parámetros** usados para valorar las propiedades.

## 🚀 Cómo Usar

### Paso 1: Abrir el Frontend

```bash
python server.py
```

Abre http://localhost:8000/frontend/

**Los datos se cargarán automáticamente** si existen.

### Paso 2: Configurar Parámetros

Haz clic en el botón:

```
💰 Valorar Propiedades
```

Se abrirá un **modal de configuración** con dos pestañas:

---

## 📋 Pestaña: 🌾 Rústico

Configura los **precios de mercado por hectárea** para terrenos rústicos.

### Parámetros Disponibles

| Cultivo | Valor Por Defecto | Descripción |
|---------|------------------|-------------|
| **Olivar Secano** | 35,000 €/ha | Olivos sin riego |
| **Olivar Regadío** | 65,000 €/ha | Olivos con riego |
| **Almendro Secano** | 20,000 €/ha | Almendros sin riego |
| **Almendro Regadío** | 35,000 €/ha | Almendros con riego |
| **Viña Secano** | 25,000 €/ha | Viñedo sin riego |
| **Viña Regadío** | 45,000 €/ha | Viñedo con riego |
| **Frutal Secano** | 28,000 €/ha | Frutales sin riego |
| **Frutal Regadío** | 55,000 €/ha | Frutales con riego |
| **Cereal Secano** | 8,000 €/ha | Cereal sin riego |
| **Cereal Regadío** | 18,000 €/ha | Cereal con riego |
| **Pastos** | 5,000 €/ha | Terreno de pasto |
| **Forestal** | 6,000 €/ha | Monte/bosque |
| **Improductivo** | 2,000 €/ha | Terreno sin uso |
| **Por Defecto** | 10,000 €/ha | Cuando no se identifica el tipo |

### Ejemplo de Ajuste

Si conoces que el **olivar secano** en tu zona se vende a **40,000 €/ha**:

1. Busca el campo "Olivar Secano"
2. Cambia el valor de `35000` a `40000`
3. Haz clic en "💰 Valorar con Estos Parámetros"

**Resultado:**
```
Antes: 1.5 ha × 35,000 €/ha = 52,500 €
Después: 1.5 ha × 40,000 €/ha = 60,000 €

Incremento: +7,500 € (+14.3%)
```

---

## 🏠 Pestaña: 🏠 Urbano

Configura los **coeficientes multiplicadores** para inmuebles urbanos.

### Fórmula

```
Valor de Mercado = Valor Catastral × Coeficiente
```

### Parámetros Disponibles

| Tipo Inmueble | Coeficiente | Descripción |
|---------------|-------------|-------------|
| **Vivienda** | 0.5 | Casas, pisos |
| **Local** | 0.5 | Locales comerciales |
| **Oficina** | 0.5 | Oficinas |
| **Garaje** | 0.4 | Plazas de garaje |
| **Trastero** | 0.4 | Trasteros |
| **Por Defecto** | 0.5 | Cuando no se identifica |

### Ejemplo de Ajuste

Si consideras que en tu zona las **viviendas** se venden al **60%** del valor catastral:

1. Busca el campo "Vivienda"
2. Cambia el valor de `0.5` a `0.6`
3. Haz clic en "💰 Valorar con Estos Parámetros"

**Resultado:**
```
Valor Catastral: 85,420.50 €

Antes: 85,420.50 × 0.5 = 42,710.25 €
Después: 85,420.50 × 0.6 = 51,252.30 €

Incremento: +8,542.05 € (+20%)
```

---

## 🔄 Restaurar Valores por Defecto

Si has hecho cambios y quieres volver a los valores originales:

1. Haz clic en **"🔄 Restaurar Valores por Defecto"**
2. Todos los campos volverán a sus valores iniciales
3. Puedes valorar de nuevo con los valores predeterminados

---

## 💡 Casos de Uso Reales

### Caso 1: Ajuste por Zona Específica

**Situación:** Tienes olivares en una zona premium con buen acceso.

**Acción:**
- Olivar secano: `35,000` → `45,000` €/ha (+28%)
- Olivar regadío: `65,000` → `80,000` €/ha (+23%)

**Resultado:** Valoración más realista para zona premium.

---

### Caso 2: Mercado Deprimido

**Situación:** La zona está en crisis y los precios han bajado.

**Acción:**
- Olivar secano: `35,000` → `25,000` €/ha (-28%)
- Almendro secano: `20,000` → `15,000` €/ha (-25%)

**Resultado:** Valoración ajustada a mercado deprimido.

---

### Caso 3: Vivienda en Zona Turística

**Situación:** Vivienda en zona turística, alta demanda.

**Acción:**
- Vivienda: `0.5` → `0.7` coeficiente (+40%)

**Resultado:** Valoración más cercana al mercado turístico.

---

### Caso 4: Local Comercial Centro Ciudad

**Situación:** Local en zona prime, muy cotizado.

**Acción:**
- Local: `0.5` → `0.8` coeficiente (+60%)

**Resultado:** Refleja mejor el valor en ubicación premium.

---

## 🎨 Interfaz Visual

### Aspecto del Modal

```
┌─────────────────────────────────────────────────────┐
│ ⚙️ Configuración de Valoración                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│ [🌾 Rústico] [🏠 Urbano]                           │
│                                                     │
│ Precios de Terrenos Rústicos (€/hectárea)          │
│                                                     │
│ ┌──────────────────┬──────────────────┬──────────┐ │
│ │ Olivar Secano    │ Olivar Regadío   │ ...      │ │
│ │ [  35000  ] €/ha │ [  65000  ] €/ha │          │ │
│ └──────────────────┴──────────────────┴──────────┘ │
│                                                     │
│ [🔄 Restaurar] [💰 Valorar con Estos Parámetros]  │
└─────────────────────────────────────────────────────┘
```

### Campos Editables

- ✏️ **Inputs numéricos** con formato claro
- 📊 **Unidades visibles** (€/ha, coeficiente)
- 🎨 **Diseño limpio** y organizado
- 📱 **Responsive** (funciona en móvil)

---

## 🔧 Detalles Técnicos

### Formato de Petición a la API

Cuando haces clic en "Valorar", se envía:

```json
{
  "propiedades": [...],
  "criterios": {
    "PRECIOS_RUSTICO": {
      "valencia": {
        "olivar_secano": 35000,
        "olivar_regadio": 65000,
        ...
      }
    },
    "COEFICIENTES_URBANO": {
      "valencia": {
        "vivienda": 0.5,
        "local": 0.5,
        ...
      }
    }
  }
}
```

### Compatibilidad

- ✅ **Retro-compatible**: Funciona con peticiones antiguas
- ✅ **Flexible**: Acepta formato array o objeto
- ✅ **Seguro**: Validación en backend

---

## 📊 Ejemplos de Valoración

### Ejemplo 1: Olivar con Parámetros Por Defecto

```
Referencia: 03106A002000090000YL
Cultivo: Olivar secano
Superficie: 1.197 ha
Precio: 35,000 €/ha (por defecto)

Valor = 1.197 × 35,000 = 41,895 €
```

### Ejemplo 2: Mismo Olivar con Parámetros Personalizados

```
Referencia: 03106A002000090000YL
Cultivo: Olivar secano
Superficie: 1.197 ha
Precio: 45,000 €/ha (ajustado por usuario)

Valor = 1.197 × 45,000 = 53,865 €

Diferencia: +11,970 € (+28.6%)
```

### Ejemplo 3: Vivienda con Parámetros Personalizados

```
Referencia: 03106A002000090000YL
Tipo: Vivienda
Valor Catastral: 85,420.50 €
Coeficiente: 0.65 (ajustado)

Valor = 85,420.50 × 0.65 = 55,523.33 €

vs Por Defecto (0.5): 42,710.25 €
Diferencia: +12,813.08 € (+30%)
```

---

## ⚠️ Consideraciones Importantes

### 1. Fuentes de Información

Para ajustar los precios de forma realista:

- 📊 **Portales inmobiliarios** (Idealista, Milanuncios)
- 🏢 **Agencias locales** especializadas en rural
- 👨‍🌾 **Cooperativas agrícolas** de la zona
- 📰 **Estudios de mercado** regionales
- 💼 **Tasadores oficiales**

### 2. Validación de Precios

Precios razonables para Comunidad Valenciana (2025):

| Cultivo | Rango Bajo | Rango Medio | Rango Alto |
|---------|-----------|-------------|------------|
| Olivar secano | 25,000 | 35,000 | 50,000 |
| Olivar regadío | 50,000 | 65,000 | 90,000 |
| Almendro secano | 15,000 | 20,000 | 30,000 |

⚠️ **Valores fuera de estos rangos** pueden indicar error o situación excepcional.

### 3. Coeficientes Urbanos

Los coeficientes oficiales se publican anualmente en las **Órdenes de las Comunidades Autónomas**.

- 📅 **Consulta oficial**: Boletín de tu CCAA
- ⚖️ **Uso legal**: Para impuestos, usa valores oficiales
- 💰 **Valoración de mercado**: Puedes usar criterios propios

### 4. Precisión de Valoraciones

Las valoraciones son **orientativas** y pueden variar según:

- 📍 **Ubicación exacta**
- 🛣️ **Accesos y servicios**
- 🌳 **Estado de plantaciones**
- 💧 **Disponibilidad de agua**
- 🏗️ **Construcciones auxiliares**
- 📊 **Coyuntura del mercado**

---

## 🚀 Workflow Completo

### Proceso Paso a Paso

```
1. Abrir frontend
   ↓
2. Datos se cargan automáticamente
   ↓
3. Ver lista de propiedades
   ↓
4. Clic en "💰 Valorar Propiedades"
   ↓
5. Se abre modal de configuración
   ↓
6. Revisar parámetros por defecto
   ↓
7. Ajustar valores según conocimiento local
   ↓
8. Clic en "💰 Valorar con Estos Parámetros"
   ↓
9. Ver valoraciones actualizadas
   ↓
10. Comparar con valores oficiales (si existen)
```

### Tiempo Estimado

- ⏱️ **Primera vez**: 5-10 minutos (revisar todos los parámetros)
- ⏱️ **Usos siguientes**: 2-3 minutos (ajustes específicos)

---

## 📚 Recursos Adicionales

### Documentos Relacionados

- `actualizar_precios.md` - Guía para actualizar precios en el código
- `EJEMPLO_VALORACION_OLIVAR.md` - Ejemplo detallado de cálculo
- `GUIA_VALORACION.md` - Guía general del sistema

### Soporte

Si tienes dudas:

1. **Consulta las guías** en el repositorio
2. **Revisa los ejemplos** incluidos
3. **Contacta con tasadores** locales para validar precios

---

## ✅ Resumen

**ANTES:**
- Precios fijos en el código
- Requería editar Python para cambiar
- No transparente para usuario final

**AHORA:**
- ✨ **Carga automática** de datos
- ⚙️ **Configuración visual** de todos los parámetros
- 🎯 **Control total** del usuario
- 📊 **Transparencia** completa
- 🔄 **Cambios en tiempo real**
- 💾 **Sin tocar código**

---

**Fecha:** Noviembre 2025
**Versión:** 3.0 - Sistema con configuración dinámica
