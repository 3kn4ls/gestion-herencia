# Sistema de Gestión y Valoración de Referencias Catastrales

Aplicación Angular standalone (solo frontend) para la gestión y valoración de propiedades catastrales.

## Características

- ✅ **100% Frontend**: Todos los cálculos se realizan en el navegador
- ✅ **Configuración JSON**: Criterios de valoración editables externamente
- ✅ **Vista Tabla/Tarjetas**: Dos modos de visualización
- ✅ **Exportación Excel**: Copy to clipboard formato TSV
- ✅ **Filtros y Búsqueda**: Sistema completo de filtrado
- ✅ **Valoración Automática**: Cálculo instantáneo al cargar datos

## Estructura del Proyecto

```
angular-catastro/
├── src/
│   ├── app/
│   │   ├── models/              # Interfaces TypeScript
│   │   │   ├── criterios.model.ts
│   │   │   ├── propiedad.model.ts
│   │   │   └── valoracion.model.ts
│   │   ├── services/            # Servicios
│   │   │   ├── data.service.ts
│   │   │   └── valoracion.service.ts
│   │   ├── components/          # Componentes Angular
│   │   └── app.component.ts     # Componente principal
│   ├── assets/                  # Archivos JSON
│   │   ├── criterios-valoracion.json
│   │   └── datos-muestra.json (opcional)
│   └── styles.css               # Estilos globales
├── package.json
├── tsconfig.json
└── angular.json
```

## Archivos JSON

### 1. criterios-valoracion.json

Contiene los módulos de valor por ámbito territorial según NNTT 2025 GVA:

```json
{
  "ambitos": [
    {
      "nombre": "Ámbito 13 - Safor-Litoral",
      "municipios": ["oliva", "piles"],
      "precios_rustico": {
        "olivar_secano": 0,
        "citricos_regadio": 33783,
        ...
      }
    }
  ]
}
```

**Modificación fácil**: Editar directamente el JSON para cambiar precios por hectárea.

### 2. datos-muestra.json (o cargar archivo propio)

Datos de las propiedades catastrales a valorar.

## Instalación

```bash
cd angular-catastro
npm install
```

## Desarrollo

```bash
npm start
```

La aplicación estará disponible en `http://localhost:4200/`

## Build Producción

```bash
npm run build
```

Los archivos se generarán en `dist/angular-catastro/`

## Modificar Criterios de Valoración

1. Editar `src/assets/criterios-valoracion.json`
2. Modificar los valores de `precios_rustico` para cada ámbito
3. Recargar la aplicación

**No requiere recompilar** - Los cambios en JSON se aplican inmediatamente.

## Cálculo de Valoración

La lógica de cálculo (método `valorarPropiedades`) está en:
- `src/app/services/valoracion.service.ts`

Réplica exacta de la lógica Python original:
- Identificación automática de ámbito territorial
- Mapeo directo de códigos catastrales (O-, F-, MM, etc.)
- Cálculo por superficie × precio/hectárea
- Desglose por cultivo/subparcela

## Tecnologías

- **Angular 17**: Framework frontend
- **TypeScript**: Lenguaje tipado
- **RxJS**: Programación reactiva
- **CSS**: Estilos responsive

## Autor

Sistema desarrollado para la gestión de herencias y valoración de propiedades rústicas en la Comunidad Valenciana.
