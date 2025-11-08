# 🚀 Guía Rápida - Sistema de Gestión Catastral

## ⚡ Inicio en 3 pasos

### 1️⃣ Instalar dependencias
```bash
pip install -r requirements.txt
```

### 2️⃣ Generar datos de ejemplo
```bash
python3 catastro_scraper_service.py
```

### 3️⃣ Iniciar servidor y abrir frontend
```bash
python3 server.py
# Abre tu navegador en: http://localhost:8000/frontend/
```

## 📋 Usando tu propio listado de referencias

Edita `catastro_scraper_service.py` y cambia la lista de referencias:

```python
# Línea 186 aproximadamente
referencias = [
    "03106A002000090000YL",  # Tu referencia 1
    "03106A002000100000YM",  # Tu referencia 2
    "03106A002000110000YN",  # Tu referencia 3
    # Añade más referencias aquí...
]
```

Luego ejecuta:
```bash
python3 catastro_scraper_service.py
```

## 🎨 Características del Frontend

### Cargar Datos
- **Opción 1**: Haz clic en "Cargar Datos de Ejemplo"
- **Opción 2**: Selecciona un archivo JSON desde tu ordenador

### Buscar
Escribe en el buscador para filtrar por:
- Referencia catastral
- Provincia
- Municipio
- Dirección
- Tipo de inmueble

### Ver Detalles
Haz clic en cualquier tarjeta de propiedad para ver:
- Localización completa
- Datos del inmueble
- Valores catastrales
- Coordenadas GPS

## 📊 Archivos Generados

Después de ejecutar el servicio, encontrarás en `data/`:

| Archivo | Descripción |
|---------|-------------|
| `[referencia].json` | Datos de cada propiedad individual |
| `datos_catastrales_consolidados.json` | Todas las propiedades en un archivo |
| `resumen_propiedades.json` | Estadísticas y resumen general |

## 🔧 Para Producción con Datos Reales

### Opción 1: Selenium (Recomendada)

1. Instala Selenium:
```bash
pip install selenium webdriver-manager
```

2. Revisa el ejemplo:
```bash
python3 selenium_scraper_example.py
```

3. Sigue las instrucciones para implementar la extracción real

### Opción 2: Extracción Manual

1. Accede al catastro manualmente
2. Copia los datos de cada propiedad
3. Crea archivos JSON con la estructura del sistema
4. Guárdalos en `data/`

## 🆘 Problemas Comunes

### Puerto ocupado
```bash
# Cambia el puerto en server.py
PORT = 8001  # Cambia a otro puerto libre
```

### No se ven los datos
1. Verifica que `data/` contenga archivos JSON
2. Revisa la consola del navegador (F12)
3. Comprueba que el servidor esté corriendo

### Error 403 del catastro
Es normal - el catastro bloquea scraping automático. Usa Selenium o datos de ejemplo.

## 📖 Más Información

Lee el [README.md](README.md) completo para:
- Documentación detallada
- Estructura de datos
- Personalización avanzada
- Próximas mejoras

---

¿Dudas? Revisa los ejemplos de código incluidos o consulta la documentación oficial del catastro.
