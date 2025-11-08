# 📋 Sistema de Gestión de Datos Catastrales

Sistema completo para la extracción, almacenamiento y visualización de datos del Catastro español.

## 🎯 Características

- ✅ Servicio de extracción de datos catastrales
- ✅ Almacenamiento en formato JSON
- ✅ Frontend web interactivo para visualización
- ✅ Búsqueda y filtrado de propiedades
- ✅ Vista detallada de cada propiedad
- ✅ Resumen con estadísticas generales
- ✅ Diseño responsive y moderno

## 📁 Estructura del Proyecto

```
gestion-herencia/
├── catastro_scraper_service.py   # Servicio principal de extracción
├── catastro_service.py            # Cliente para API oficial (bloqueado)
├── server.py                      # Servidor HTTP para desarrollo
├── requirements.txt               # Dependencias Python
├── data/                          # Directorio de datos JSON
│   ├── datos_catastrales_consolidados.json
│   ├── resumen_propiedades.json
│   └── [referencia].json          # Datos individuales por referencia
└── frontend/                      # Aplicación web
    ├── index.html                 # Página principal
    ├── styles.css                 # Estilos
    └── app.js                     # Lógica de la aplicación
```

## 🚀 Inicio Rápido

### 1. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 2. Generar datos de ejemplo

```bash
python3 catastro_scraper_service.py
```

Esto generará:
- Archivos JSON individuales para cada referencia
- Un archivo consolidado con todas las referencias
- Un archivo de resumen con estadísticas

### 3. Iniciar el servidor web

```bash
python3 server.py
```

### 4. Acceder al frontend

Abre tu navegador en: `http://localhost:8000/frontend/`

## 📖 Uso del Sistema

### Backend - Servicio de Extracción

El servicio `catastro_scraper_service.py` proporciona funcionalidad completa para gestionar datos catastrales:

#### Uso básico

```python
from catastro_scraper_service import CatastroScraperService

# Crear instancia del servicio
servicio = CatastroScraperService(data_dir="/ruta/a/datos")

# Procesar una referencia catastral
referencias = ["03106A002000090000YL"]
resultados = servicio.procesar_multiples_referencias(
    referencias,
    guardar_individual=True,      # Guarda cada referencia en su propio archivo
    guardar_consolidado=True      # Guarda todas en un archivo único
)

# Generar resumen con estadísticas
resumen = servicio.generar_resumen(referencias)
```

#### Estructura de datos

Cada referencia catastral se guarda con la siguiente estructura:

```json
{
  "referencia_catastral": "03106A002000090000YL",
  "fecha_extraccion": "2025-11-08T12:00:00",
  "localizacion": {
    "provincia": "Alicante",
    "municipio": "Municipio 106",
    "via": "CALLE EJEMPLO",
    "numero": "1",
    "escalera": "",
    "planta": "01",
    "puerta": "A",
    "codigo_postal": "03000"
  },
  "datos_inmueble": {
    "tipo": "Vivienda",
    "clase": "Urbano",
    "uso_principal": "Residencial",
    "superficie_construida": 120.5,
    "superficie_parcela": 0,
    "ano_construccion": 1990,
    "ano_reforma": null
  },
  "datos_catastrales": {
    "valor_catastral": 85420.50,
    "valor_suelo": 45230.25,
    "valor_construccion": 40190.25,
    "ano_valor": 2023
  },
  "coordenadas": {
    "latitud": 38.3452,
    "longitud": -0.4815,
    "sistema": "ETRS89"
  }
}
```

### Frontend - Aplicación Web

El frontend proporciona una interfaz intuitiva para:

1. **Cargar Datos**
   - Cargar archivo JSON desde tu ordenador
   - Usar datos de ejemplo generados

2. **Ver Resumen General**
   - Total de propiedades
   - Valor catastral total
   - Superficie total
   - Fecha de última actualización

3. **Buscar Propiedades**
   - Por referencia catastral
   - Por provincia o municipio
   - Por tipo de inmueble
   - Por dirección

4. **Ver Detalles**
   - Haz clic en cualquier propiedad para ver información completa
   - Datos de localización
   - Características del inmueble
   - Valores catastrales
   - Coordenadas geográficas

## 🔧 Integración con Datos Reales del Catastro

### Opción 1: Usar Selenium (Recomendado)

Para extraer datos reales del catastro, necesitas usar Selenium con un navegador real:

```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def extraer_datos_reales(referencia):
    """
    Extrae datos reales usando Selenium
    """
    driver = webdriver.Chrome()  # o Firefox, Edge, etc.

    try:
        url = f"https://www1.sedecatastro.gob.es/CYCBienInmueble/OVCConCiud.aspx?RefC={referencia}"
        driver.get(url)

        # Esperar a que cargue la página
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "elemento_id"))
        )

        # Extraer datos específicos
        # ... implementar extracción según estructura HTML ...

        return datos

    finally:
        driver.quit()
```

### Opción 2: API Oficial del Catastro

El catastro español proporciona servicios web oficiales. Consulta la documentación en:
- http://www.catastro.meh.es/ws/webservices_catastro.pdf

### Opción 3: Extracción Manual

1. Accede al catastro manualmente
2. Copia los datos de cada propiedad
3. Crea archivos JSON siguiendo la estructura del sistema
4. Guárdalos en el directorio `data/`

## 🎨 Personalización del Frontend

### Cambiar colores

Edita las variables CSS en `frontend/styles.css`:

```css
:root {
    --primary-color: #2563eb;
    --secondary-color: #64748b;
    --success-color: #10b981;
    /* ... más variables ... */
}
```

### Añadir campos personalizados

1. Modifica la estructura de datos en `catastro_scraper_service.py`
2. Actualiza la visualización en `frontend/app.js`

## 📊 Análisis de Datos

El archivo `resumen_propiedades.json` contiene estadísticas útiles:

```json
{
  "total_propiedades": 3,
  "fecha_generacion": "2025-11-08T12:00:00",
  "estadisticas": {
    "valor_catastral_total": 256261.50,
    "superficie_total_construida": 361.50,
    "tipos_inmuebles": {
      "Vivienda": 3
    }
  },
  "propiedades": [...]
}
```

## 🔒 Consideraciones Legales

- Este sistema está diseñado para uso personal y educativo
- El scraping del catastro puede estar sujeto a términos de servicio
- Se recomienda usar la API oficial para uso comercial
- Respeta la privacidad de los datos personales
- No redistribuyas datos personales sin autorización

## 🐛 Solución de Problemas

### El servidor no inicia

```bash
# Verificar que el puerto 8000 esté libre
lsof -i :8000

# Cambiar el puerto en server.py si es necesario
PORT = 8001  # o cualquier otro puerto disponible
```

### No se cargan los datos

1. Verifica que los archivos JSON estén en `data/`
2. Comprueba que el servidor esté corriendo
3. Abre la consola del navegador para ver errores

### Error 403 al acceder al catastro

El catastro bloquea accesos automatizados. Opciones:
1. Usar Selenium con navegador real
2. Acceder desde España o usar VPN
3. Usar datos de ejemplo del sistema

## 📝 Próximas Mejoras

- [ ] Integración con Selenium para scraping real
- [ ] Exportar a PDF
- [ ] Exportar a Excel
- [ ] Gráficos y visualizaciones
- [ ] Comparación de propiedades
- [ ] Mapa interactivo con coordenadas
- [ ] Sistema de autenticación
- [ ] Base de datos persistente

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Si encuentras un bug o tienes una sugerencia:

1. Crea un issue describiendo el problema o mejora
2. Fork el proyecto
3. Crea una rama con tu feature
4. Envía un pull request

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 📞 Soporte

Si tienes preguntas o necesitas ayuda:
- Abre un issue en el repositorio
- Consulta la documentación del catastro
- Revisa los ejemplos de código incluidos

---

**Nota**: Este sistema utiliza datos de ejemplo. Para datos reales del catastro, implementa la extracción con Selenium o usa la API oficial.

¡Disfruta gestionando tus datos catastrales! 🏠📊
