# 🔧 Guía de Instalación Completa

Esta guía te ayudará a instalar todo lo necesario para ejecutar el sistema de gestión catastral.

## 📋 Requisitos Previos

Antes de comenzar, necesitarás:
- Conexión a Internet
- Aproximadamente 100 MB de espacio en disco
- 10-15 minutos para la instalación

---

## 🪟 Windows

### 1️⃣ Instalar Python

#### Opción A: Instalador oficial (Recomendado)

1. **Descargar Python:**
   - Ve a: https://www.python.org/downloads/
   - Haz clic en el botón amarillo "Download Python 3.12.x"
   - Guarda el archivo (por ejemplo: `python-3.12.0-amd64.exe`)

2. **Instalar Python:**
   - Ejecuta el archivo descargado
   - **⚠️ IMPORTANTE:** Marca la casilla "Add Python to PATH" (abajo del todo)
   - Haz clic en "Install Now"
   - Espera a que termine la instalación
   - Haz clic en "Close"

3. **Verificar la instalación:**
   - Abre el "Símbolo del sistema" o "PowerShell":
     - Presiona `Windows + R`
     - Escribe `cmd` y presiona Enter
   - Escribe este comando:
   ```bash
   python --version
   ```
   - Deberías ver algo como: `Python 3.12.0`

#### Opción B: Microsoft Store (Más fácil)

1. Abre la Microsoft Store
2. Busca "Python 3.12"
3. Haz clic en "Obtener" o "Instalar"
4. Espera a que termine la instalación

### 2️⃣ Instalar las dependencias del proyecto

1. **Abrir terminal en la carpeta del proyecto:**
   - Abre el Explorador de archivos
   - Navega a la carpeta `gestion-herencia`
   - En la barra de direcciones arriba, escribe `cmd` y presiona Enter
   - Se abrirá una terminal en esa carpeta

2. **Instalar dependencias:**
   ```bash
   pip install requests beautifulsoup4 lxml
   ```
   - Espera a que termine (puede tardar 1-2 minutos)

### 3️⃣ Ejecutar la aplicación

#### ⭐ Forma más fácil: Script automático

1. **Ubicar el archivo:**
   - Navega a la carpeta `gestion-herencia` en el Explorador de archivos

2. **Ejecutar:**
   - Haz doble clic en `iniciar.bat`
   - El script hará todo automáticamente:
     - Verifica Python ✓
     - Instala dependencias si faltan ✓
     - Genera datos de ejemplo ✓
     - Inicia el servidor ✓
     - Abre el navegador ✓

**Nota importante:** Debes hacer doble clic directamente en el archivo `iniciar.bat` dentro de la carpeta del proyecto. Si lo copias a otro lugar o lo ejecutas de otra forma, puede no funcionar.

#### Forma manual:

1. **Generar los datos de ejemplo:**
   ```bash
   python catastro_scraper_service.py
   ```

2. **Iniciar el servidor:**
   ```bash
   python server.py
   ```
   - Deberías ver un mensaje que dice "Servidor corriendo en: http://localhost:8000"

3. **Abrir la aplicación:**
   - Abre tu navegador (Chrome, Firefox, Edge, etc.)
   - Ve a: http://localhost:8000/frontend/

4. **Para detener el servidor:**
   - En la terminal, presiona `Ctrl + C`

---

## 🍎 macOS

### 1️⃣ Instalar Python

#### Opción A: Homebrew (Recomendado)

1. **Instalar Homebrew (si no lo tienes):**
   - Abre la Terminal (Cmd + Espacio, escribe "Terminal")
   - Copia y pega este comando:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
   - Sigue las instrucciones en pantalla

2. **Instalar Python con Homebrew:**
   ```bash
   brew install python3
   ```

3. **Verificar la instalación:**
   ```bash
   python3 --version
   ```
   - Deberías ver: `Python 3.12.x`

#### Opción B: Instalador oficial

1. Ve a: https://www.python.org/downloads/macos/
2. Descarga el instalador PKG más reciente
3. Ejecuta el archivo descargado
4. Sigue el asistente de instalación

### 2️⃣ Instalar las dependencias del proyecto

1. **Abrir Terminal en la carpeta del proyecto:**
   - Abre Finder
   - Navega a la carpeta `gestion-herencia`
   - Haz clic derecho en la carpeta
   - Servicios → "Nueva Terminal en la carpeta"

   O desde Terminal:
   ```bash
   cd /ruta/a/gestion-herencia
   ```

2. **Instalar dependencias:**
   ```bash
   pip3 install requests beautifulsoup4 lxml
   ```

### 3️⃣ Ejecutar la aplicación

1. **Generar los datos de ejemplo:**
   ```bash
   python3 catastro_scraper_service.py
   ```

2. **Iniciar el servidor:**
   ```bash
   python3 server.py
   ```

3. **Abrir la aplicación:**
   - Abre Safari, Chrome, o Firefox
   - Ve a: http://localhost:8000/frontend/

4. **Para detener el servidor:**
   - En la terminal, presiona `Cmd + C`

---

## 🐧 Linux (Ubuntu/Debian)

### 1️⃣ Instalar Python

Python suele venir preinstalado en Linux, pero instalemos la última versión:

```bash
sudo apt update
sudo apt install python3 python3-pip
```

**Verificar la instalación:**
```bash
python3 --version
```

### 2️⃣ Instalar las dependencias del proyecto

1. **Navegar a la carpeta del proyecto:**
   ```bash
   cd /ruta/a/gestion-herencia
   ```

2. **Instalar dependencias:**
   ```bash
   pip3 install requests beautifulsoup4 lxml
   ```

### 3️⃣ Ejecutar la aplicación

1. **Generar los datos de ejemplo:**
   ```bash
   python3 catastro_scraper_service.py
   ```

2. **Iniciar el servidor:**
   ```bash
   python3 server.py
   ```

3. **Abrir la aplicación:**
   - Abre tu navegador
   - Ve a: http://localhost:8000/frontend/

4. **Para detener el servidor:**
   - En la terminal, presiona `Ctrl + C`

---

## 🔍 Verificación de la Instalación

Una vez instalado todo, verifica que funciona correctamente:

### 1. Verifica Python
```bash
# Windows
python --version

# macOS y Linux
python3 --version
```
**Resultado esperado:** `Python 3.8.x` o superior

### 2. Verifica pip
```bash
# Windows
pip --version

# macOS y Linux
pip3 --version
```
**Resultado esperado:** `pip 23.x.x` o similar

### 3. Verifica las librerías instaladas
```bash
# Windows
pip list

# macOS y Linux
pip3 list
```
**Deberías ver:** requests, beautifulsoup4, lxml

---

## 📁 Estructura de Archivos (después de ejecutar)

Después de ejecutar `catastro_scraper_service.py`, deberías tener:

```
gestion-herencia/
├── data/                              # ← Carpeta creada automáticamente
│   ├── 03106A002000090000YL.json
│   ├── 03106A002000100000YM.json
│   ├── 03106A002000110000YN.json
│   ├── datos_catastrales_consolidados.json
│   └── resumen_propiedades.json
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── catastro_scraper_service.py
├── server.py
└── README.md
```

---

## 🚨 Solución de Problemas

### ❌ "python no se reconoce como un comando"

**Windows:**
- No marcaste "Add Python to PATH" durante la instalación
- **Solución 1:** Reinstala Python y marca la casilla
- **Solución 2:** Añade Python manualmente al PATH:
  1. Busca "Variables de entorno" en el menú de inicio
  2. Edita la variable PATH
  3. Añade: `C:\Users\TuUsuario\AppData\Local\Programs\Python\Python312`

**macOS/Linux:**
- Usa `python3` en lugar de `python`

### ❌ "pip no se reconoce como un comando"

**Solución:**
```bash
# Windows
python -m pip install --upgrade pip

# macOS/Linux
python3 -m pip install --upgrade pip
```

### ❌ "ModuleNotFoundError: No module named 'requests'"

**Solución:**
Las dependencias no están instaladas. Ejecuta:
```bash
# Windows
pip install requests beautifulsoup4 lxml

# macOS/Linux
pip3 install requests beautifulsoup4 lxml
```

### ❌ "Address already in use" (Puerto 8000 ocupado)

El puerto 8000 está siendo usado por otra aplicación.

**Solución 1:** Cierra otras aplicaciones que puedan usar el puerto

**Solución 2:** Cambia el puerto en `server.py`:
- Abre `server.py` con un editor de texto
- Busca la línea: `PORT = 8000`
- Cámbiala a: `PORT = 8001` (o cualquier otro número)
- Guarda el archivo
- Accede a: http://localhost:8001/frontend/

### ❌ "Permission denied" (Linux/macOS)

**Solución:**
```bash
# Usa --user para instalar solo para tu usuario
pip3 install --user requests beautifulsoup4 lxml
```

### ❌ La página no carga / Error 404

**Verificaciones:**
1. ¿Está el servidor corriendo? Debe decir "Servidor corriendo..."
2. ¿La URL es correcta? Debe ser: `http://localhost:8000/frontend/` (con la barra final)
3. ¿Generaste los datos? Ejecuta primero `catastro_scraper_service.py`

### ❌ No se muestran datos en el frontend

**Solución:**
1. Haz clic en "Cargar Datos de Ejemplo" en la página
2. O carga manualmente el archivo: `data/datos_catastrales_consolidados.json`

---

## 💡 Consejos Útiles

### Crear un script de inicio rápido

**Windows (crear `iniciar.bat`):**
```batch
@echo off
echo Generando datos...
python catastro_scraper_service.py
echo.
echo Iniciando servidor...
python server.py
pause
```

**macOS/Linux (crear `iniciar.sh`):**
```bash
#!/bin/bash
echo "Generando datos..."
python3 catastro_scraper_service.py
echo ""
echo "Iniciando servidor..."
python3 server.py
```

Después:
```bash
# macOS/Linux: darle permisos de ejecución
chmod +x iniciar.sh
./iniciar.sh
```

### Usar un entorno virtual (Opcional, pero recomendado)

Los entornos virtuales mantienen las dependencias aisladas:

```bash
# Windows
python -m venv venv
venv\Scripts\activate
pip install requests beautifulsoup4 lxml

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
pip3 install requests beautifulsoup4 lxml
```

---

## 🎓 Próximos Pasos

Una vez que todo funcione:

1. ✅ **Lee el QUICKSTART.md** para uso básico
2. ✅ **Lee el README.md** para documentación completa
3. ✅ **Personaliza** las referencias catastrales en `catastro_scraper_service.py`
4. ✅ **Explora** el frontend y sus funcionalidades

---

## 📞 ¿Necesitas Ayuda?

Si tienes problemas:
1. Revisa la sección "Solución de Problemas" arriba
2. Verifica que seguiste todos los pasos en orden
3. Comprueba que tienes conexión a Internet
4. Asegúrate de estar en la carpeta correcta del proyecto

---

**¡Listo!** Ahora deberías poder ejecutar la aplicación sin problemas 🎉
