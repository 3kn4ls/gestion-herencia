# Instrucciones de Uso - Gestor Catastral Angular

## 📋 Contenido del Proyecto

Este es un proyecto Angular standalone (solo frontend) que permite:
- Cargar datos catastrales desde archivos JSON
- Valorar propiedades automáticamente según criterios GVA 2025
- Visualizar datos en tabla o tarjetas
- Filtrar y buscar propiedades
- Exportar a Excel (formato TSV)

## 🚀 Instalación

### Requisitos Previos
- Node.js 18 o superior
- npm 9 o superior

### Pasos de Instalación

1. **Navegar al directorio del proyecto:**
```bash
cd angular-catastro
```

2. **Instalar dependencias:**
```bash
npm install
```

## 🎯 Ejecución en Desarrollo

```bash
npm start
```

La aplicación se abrirá automáticamente en `http://localhost:4200/`

## 🏗️ Compilar para Producción

```bash
npm run build
```

Los archivos compilados estarán en `dist/angular-catastro/`

Para servir los archivos en producción, puedes usar cualquier servidor web estático:

```bash
# Usando http-server (instalar globalmente: npm install -g http-server)
cd dist/angular-catastro
http-server -p 8080
```

## 📁 Estructura de Archivos

```
angular-catastro/
├── src/
│   ├── app/
│   │   ├── models/                  # Interfaces TypeScript
│   │   ├── services/                # Servicios (lógica de negocio)
│   │   ├── app.component.ts         # Componente principal
│   │   ├── app.component.html       # Template HTML
│   │   └── app.component.css        # Estilos del componente
│   ├── assets/
│   │   ├── criterios-valoracion.json  # ⚙️ Criterios editables
│   │   └── datos-muestra.json         # Datos de ejemplo
│   ├── index.html                   # HTML principal
│   ├── main.ts                      # Punto de entrada
│   └── styles.css                   # Estilos globales
├── angular.json                     # Configuración Angular
├── package.json                     # Dependencias
└── tsconfig.json                    # Configuración TypeScript
```

## ⚙️ Modificar Criterios de Valoración

Para cambiar los precios por hectárea u otros criterios:

1. **Abrir el archivo:**
```bash
src/assets/criterios-valoracion.json
```

2. **Editar los valores:**
```json
{
  "ambitos": [
    {
      "nombre": "Ámbito 13 - Safor-Litoral",
      "municipios": ["oliva", "piles"],
      "precios_rustico": {
        "olivar_secano": 0,
        "citricos_regadio": 33783,  // ← Cambiar este valor
        "labor_regadio": 24379,      // ← O este
        ...
      }
    }
  ]
}
```

3. **Guardar y recargar** la aplicación (Ctrl+R)

**No es necesario recompilar** - Los cambios se aplican inmediatamente.

## 📊 Cargar Datos Propios

### Opción 1: Botón "Cargar Archivo"
1. Preparar un archivo JSON con tus datos catastrales
2. Hacer clic en "Cargar Archivo" en la aplicación
3. Seleccionar tu archivo JSON

### Opción 2: Reemplazar datos de muestra
1. Editar `src/assets/datos-muestra.json`
2. Pegar tus datos
3. Usar botón "Cargar Datos de Ejemplo"

### Formato del JSON de Datos

```json
[
  {
    "referencia_catastral": "03136A006001950000ZH",
    "datos_descriptivos": {
      "clase": "Rústico",
      "localizacion": {
        "provincia": "Valencia/València",
        "municipio": "Oliva",
        ...
      }
    },
    "cultivos": [
      {
        "subparcela": "a",
        "cultivo_aprovechamiento": "O- Olivos secano",
        "superficie_m2": 4992
      }
    ],
    "valor_referencia_oficial": {
      "valor_referencia": 795.01
    }
  }
]
```

## 🎨 Uso de la Aplicación

### 1. Cargar Datos
- **Datos de Ejemplo:** Haz clic en "Cargar Datos de Ejemplo"
- **Archivo Propio:** Usa el selector de archivos

### 2. Visualizar
- **Vista Tabla:** Botón "📊 Tabla" - Ver todos los datos
- **Vista Tarjetas:** Botón "🗂️ Tarjetas" - Vista resumida

### 3. Filtrar
- Usa los desplegables de filtros (Clase, Uso, Provincia, Municipio)
- O usa el buscador de texto

### 4. Exportar a Excel
1. Haz clic en "📋 Copiar para Excel"
2. Abre Excel
3. Pega (Ctrl+V)

## 🔧 Personalización Avanzada

### Añadir un Nuevo Ámbito Territorial

Editar `src/assets/criterios-valoracion.json`:

```json
{
  "ambitos": [
    ...,
    {
      "nombre": "Ámbito XX - Nuevo",
      "codigo": "ambito_xx",
      "municipios": ["municipio1", "municipio2"],
      "ath": "XXXX",
      "precios_rustico": {
        "olivar_secano": 15000,
        "citricos_regadio": 40000,
        ...
      }
    }
  ]
}
```

### Modificar Lógica de Cálculo

Editar `src/app/services/valoracion.service.ts`:

```typescript
private valorarRustico(propiedad: Propiedad, criterios: CriteriosValoracion): Valoracion {
  // Modificar la lógica aquí
}
```

Luego recompilar:
```bash
npm run build
```

## 🐛 Solución de Problemas

### Error: "Cannot find module..."
```bash
rm -rf node_modules package-lock.json
npm install
```

### Error: Puerto 4200 ya en uso
```bash
ng serve --port 4300
```

### Los datos no se cargan
- Verificar que el JSON esté bien formado
- Abrir la consola del navegador (F12) para ver errores
- Verificar que los archivos estén en `src/assets/`

## 📝 Notas Técnicas

- **Framework:** Angular 17 (standalone components)
- **TypeScript:** 5.2
- **Sin backend:** Todo el procesamiento es en cliente
- **Valoración:** Réplica exacta de la lógica Python original
- **Criterios:** Basados en NNTT 2025 GVA (ATH 1603/1613)

## 📞 Soporte

Para dudas o problemas:
1. Revisar este documento
2. Consultar los comentarios en el código
3. Ver los logs de la consola del navegador (F12)

---

**Última actualización:** Enero 2025
