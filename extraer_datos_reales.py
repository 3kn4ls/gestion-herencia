#!/usr/bin/env python3
"""
Extractor REAL de datos del catastro español usando Selenium
Extrae datos reales accediendo al formulario de búsqueda oficial
"""

import time
import json
import os
import re
from datetime import datetime
from typing import Dict, Optional, List

try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.chrome.options import Options
    from selenium.common.exceptions import TimeoutException, NoSuchElementException
except ImportError:
    print("❌ ERROR: Selenium no está instalado")
    print("\nInstala con: pip install selenium")
    print("\nTambién necesitas Chrome instalado en tu sistema")
    exit(1)


class CatastroRealScraper:
    """
    Extractor REAL de datos del catastro usando Selenium
    """

    def __init__(self, headless: bool = False):
        """
        Inicializa el scraper

        Args:
            headless: Si True, ejecuta Chrome sin ventana visible
        """
        self.headless = headless
        self.driver = None
        self.data_dir = "data"
        os.makedirs(self.data_dir, exist_ok=True)

    def iniciar_navegador(self):
        """Inicia Chrome con Selenium"""
        print("🌐 Iniciando navegador Chrome...")

        chrome_options = Options()

        if self.headless:
            chrome_options.add_argument('--headless')

        # Opciones para evitar detección
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)

        # Desactivar logging innecesario
        chrome_options.add_argument('--log-level=3')
        chrome_options.add_experimental_option('excludeSwitches', ['enable-logging'])

        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            self.driver.maximize_window()
            print("✓ Navegador iniciado correctamente\n")
        except Exception as e:
            print(f"❌ Error al iniciar Chrome: {e}")
            print("\nAsegúrate de tener Chrome instalado.")
            raise

    def cerrar_navegador(self):
        """Cierra el navegador"""
        if self.driver:
            self.driver.quit()
            self.driver = None

    def parsear_localizacion(self, texto_localizacion: str) -> Dict:
        """
        Parsea el texto de localización y extrae: Polígono, Parcela, Partida, Municipio, Provincia

        Ejemplo: "Polígono 2 Parcela 9\nEL LLOMBO. PLANES (ALICANTE)"
        """
        resultado = {
            "poligono": "",
            "parcela": "",
            "partida": "",
            "municipio": "",
            "provincia": ""
        }

        try:
            # Dividir por saltos de línea
            lineas = texto_localizacion.strip().split('\n')

            # Primera línea: Polígono X Parcela Y
            if len(lineas) > 0:
                primera = lineas[0]

                # Extraer Polígono
                match_pol = re.search(r'Polígono\s+(\d+)', primera, re.IGNORECASE)
                if match_pol:
                    resultado["poligono"] = match_pol.group(1)

                # Extraer Parcela
                match_par = re.search(r'Parcela\s+(\d+)', primera, re.IGNORECASE)
                if match_par:
                    resultado["parcela"] = match_par.group(1)

            # Segunda línea: PARTIDA. MUNICIPIO (PROVINCIA)
            if len(lineas) > 1:
                segunda = lineas[1]

                # Extraer Provincia (entre paréntesis)
                match_prov = re.search(r'\(([^)]+)\)', segunda)
                if match_prov:
                    resultado["provincia"] = match_prov.group(1).strip()
                    # Quitar la provincia del texto
                    segunda = re.sub(r'\([^)]+\)', '', segunda).strip()

                # Lo que queda: PARTIDA. MUNICIPIO
                partes = segunda.split('.')
                if len(partes) >= 2:
                    resultado["partida"] = partes[0].strip()
                    resultado["municipio"] = partes[1].strip()
                elif len(partes) == 1:
                    # Si solo hay una parte, asumir que es municipio
                    resultado["municipio"] = partes[0].strip()

        except Exception as e:
            print(f"      ⚠️  Error parseando localización: {e}")

        return resultado

    def extraer_datos_catastro(self, referencia: str) -> Optional[Dict]:
        """
        Extrae datos REALES del catastro para una referencia

        Args:
            referencia: Referencia catastral

        Returns:
            Diccionario con los datos extraídos o None si hay error
        """
        # URL del formulario de búsqueda
        url = "https://www1.sedecatastro.gob.es/CYCBienInmueble/OVCBusqueda.aspx"

        try:
            print(f"  📡 Accediendo al formulario de búsqueda...")
            self.driver.get(url)

            # Esperar a que cargue el formulario
            wait = WebDriverWait(self.driver, 15)

            # Buscar el input de referencia catastral: ctl00_Contenido_txtRC2
            print(f"  ✏️  Introduciendo referencia catastral...")
            input_ref = wait.until(
                EC.presence_of_element_located((By.ID, "ctl00_Contenido_txtRC2"))
            )

            # Limpiar y escribir la referencia
            input_ref.clear()
            input_ref.send_keys(referencia)

            time.sleep(1)

            # Hacer clic en el botón DATOS: ctl00_Contenido_btnDatos
            print(f"  🔍 Buscando datos...")
            boton_datos = wait.until(
                EC.element_to_be_clickable((By.ID, "ctl00_Contenido_btnDatos"))
            )
            boton_datos.click()

            # Esperar a que cargue la página de resultados
            time.sleep(3)

            # Verificar si hay error
            try:
                error = self.driver.find_element(By.ID, "DivErrorRC")
                if error.is_displayed():
                    print(f"  ❌ Error: Referencia catastral no encontrada")
                    return None
            except NoSuchElementException:
                pass  # No hay error, continuamos

            print(f"  📊 Extrayendo datos del inmueble...")

            # Inicializar estructura de datos
            datos = {
                "referencia_catastral": referencia,
                "fecha_extraccion": datetime.now().isoformat(),
                "url_consultada": self.driver.current_url,
                "datos_descriptivos": {},
                "parcela_catastral": {},
                "cultivos": []
            }

            # === EXTRAER DATOS DESCRIPTIVOS DEL INMUEBLE ===
            try:
                # Buscar el contenedor: ctl00_Contenido_tblInmueble
                tabla_inmueble = self.driver.find_element(By.ID, "ctl00_Contenido_tblInmueble")

                # Extraer todos los form-group
                grupos = tabla_inmueble.find_elements(By.CLASS_NAME, "form-group")

                for grupo in grupos:
                    try:
                        # Buscar label (col-md-4) y valor (col-md-8)
                        label_elem = grupo.find_element(By.CLASS_NAME, "col-md-4")
                        valor_elem = grupo.find_element(By.CLASS_NAME, "col-md-8")

                        label = label_elem.text.strip()
                        valor = valor_elem.text.strip()

                        if label and valor:
                            # Procesar según el campo
                            if "Referencia catastral" in label:
                                # Limpiar iconos y espacios extras
                                valor_limpio = re.sub(r'copiar|código de barras', '', valor, flags=re.IGNORECASE).strip()
                                datos["datos_descriptivos"]["referencia_catastral"] = valor_limpio

                            elif "Localización" in label or "Localizacion" in label:
                                # Parsear localización
                                loc_parseada = self.parsear_localizacion(valor)
                                datos["datos_descriptivos"]["localizacion"] = {
                                    "texto_completo": valor,
                                    "poligono": loc_parseada["poligono"],
                                    "parcela": loc_parseada["parcela"],
                                    "partida": loc_parseada["partida"],
                                    "municipio": loc_parseada["municipio"],
                                    "provincia": loc_parseada["provincia"]
                                }

                            elif "Clase" in label:
                                datos["datos_descriptivos"]["clase"] = valor

                            elif "Uso principal" in label:
                                datos["datos_descriptivos"]["uso_principal"] = valor

                            else:
                                # Cualquier otro campo
                                datos["datos_descriptivos"][label.lower().replace(" ", "_")] = valor

                    except Exception as e:
                        continue

                print(f"      ✓ Datos descriptivos extraídos")

            except Exception as e:
                print(f"      ⚠️  Error extrayendo datos descriptivos: {e}")

            # === EXTRAER PARCELA CATASTRAL ===
            try:
                # Buscar el contenedor: ctl00_Contenido_tblFinca
                tabla_finca = self.driver.find_element(By.ID, "ctl00_Contenido_tblFinca")

                grupos = tabla_finca.find_elements(By.CLASS_NAME, "form-group")

                for grupo in grupos:
                    try:
                        label_elem = grupo.find_element(By.CLASS_NAME, "col-md-3")
                        valor_elem = grupo.find_element(By.CLASS_NAME, "col-md-9")

                        label = label_elem.text.strip()
                        valor = valor_elem.text.strip()

                        if label and valor:
                            # Saltar Localización (ya la tenemos)
                            if "Localización" in label or "Localizacion" in label:
                                continue

                            # Limpiar etiquetas HTML del valor
                            valor_limpio = re.sub(r'<[^>]+>', '', valor)

                            datos["parcela_catastral"][label.lower().replace(" ", "_")] = valor_limpio

                    except Exception as e:
                        continue

                print(f"      ✓ Parcela catastral extraída")

            except Exception as e:
                print(f"      ⚠️  Error extrayendo parcela catastral: {e}")

            # === EXTRAER CULTIVOS ===
            try:
                # Buscar la tabla de cultivos: ctl00_Contenido_tblCultivos
                tabla_cultivos = self.driver.find_element(By.ID, "ctl00_Contenido_tblCultivos")

                # Extraer filas (saltando el header)
                filas = tabla_cultivos.find_elements(By.TAG_NAME, "tr")[1:]  # Saltar header

                for fila in filas:
                    celdas = fila.find_elements(By.TAG_NAME, "td")

                    if len(celdas) >= 4:
                        cultivo = {
                            "subparcela": celdas[0].text.strip(),
                            "cultivo_aprovechamiento": celdas[1].text.strip(),
                            "intensidad_productiva": celdas[2].text.strip(),
                            "superficie_m2": celdas[3].text.strip()
                        }
                        datos["cultivos"].append(cultivo)

                if datos["cultivos"]:
                    print(f"      ✓ {len(datos['cultivos'])} cultivo(s) extraído(s)")

            except NoSuchElementException:
                print(f"      ℹ️  No hay datos de cultivos (puede ser normal para urbanos)")
            except Exception as e:
                print(f"      ⚠️  Error extrayendo cultivos: {e}")

            print(f"  ✅ Extracción completada para: {referencia}")

            return datos

        except TimeoutException:
            print(f"  ❌ Timeout: La página tardó demasiado en cargar")
            return None
        except Exception as e:
            print(f"  ❌ Error: {e}")
            import traceback
            traceback.print_exc()
            return None

    def procesar_referencias(self, archivo_referencias: str = "referencias.txt") -> List[Dict]:
        """
        Procesa un archivo con referencias catastrales

        Args:
            archivo_referencias: Ruta al archivo con referencias

        Returns:
            Lista de diccionarios con los datos extraídos
        """
        # Leer referencias
        if not os.path.exists(archivo_referencias):
            print(f"❌ No se encontró el archivo: {archivo_referencias}")
            return []

        print(f"📖 Leyendo referencias de: {archivo_referencias}\n")
        referencias = []

        with open(archivo_referencias, 'r', encoding='utf-8') as f:
            for linea in f:
                ref = linea.strip()
                if ref and not ref.startswith('#'):
                    referencias.append(ref)

        if not referencias:
            print("❌ No se encontraron referencias válidas")
            return []

        print(f"✓ Encontradas {len(referencias)} referencias\n")
        print("=" * 60)

        # Iniciar navegador
        self.iniciar_navegador()

        resultados = []

        try:
            for i, ref in enumerate(referencias, 1):
                print(f"\n[{i}/{len(referencias)}] Procesando: {ref}")
                print("-" * 60)

                datos = self.extraer_datos_catastro(ref)

                if datos:
                    resultados.append(datos)

                    # Guardar individualmente
                    archivo = os.path.join(self.data_dir, f"{ref}.json")
                    with open(archivo, 'w', encoding='utf-8') as f:
                        json.dump(datos, f, indent=2, ensure_ascii=False)
                    print(f"  💾 Guardado en: {archivo}")
                else:
                    print(f"  ✗ No se pudieron extraer datos")

                # Pausa entre peticiones
                if i < len(referencias):
                    print(f"\n  ⏳ Esperando 3 segundos antes de la siguiente petición...")
                    time.sleep(3)

        finally:
            self.cerrar_navegador()

        # Guardar consolidado
        if resultados:
            archivo_consolidado = os.path.join(self.data_dir, "datos_catastrales_consolidados.json")
            with open(archivo_consolidado, 'w', encoding='utf-8') as f:
                json.dump(resultados, f, indent=2, ensure_ascii=False)
            print(f"\n✓ Datos consolidados guardados en: {archivo_consolidado}")

        return resultados


def main():
    """
    Función principal
    """
    print("=" * 60)
    print("  EXTRACTOR REAL DE DATOS DEL CATASTRO")
    print("  Usando Selenium + Chrome")
    print("=" * 60)
    print()

    # Verificar que existe el archivo de referencias
    archivo_referencias = "referencias.txt"

    if not os.path.exists(archivo_referencias):
        print(f"❌ No se encontró '{archivo_referencias}'")
        print(f"\nCrea un archivo '{archivo_referencias}' con este formato:")
        print("\n03106A002000090000YL")
        print("28079A01800223")
        print("08019A02500405")
        print("\nUna referencia por línea.\n")
        return

    # Preguntar modo
    print("¿Quieres ver el navegador mientras extrae los datos?")
    print("  1. Sí, mostrar navegador (recomendado para ver el proceso)")
    print("  2. No, modo oculto (más rápido)")

    opcion = input("\nElige opción (1/2) [1]: ").strip() or "1"
    headless = opcion == "2"

    print()

    # Crear scraper
    scraper = CatastroRealScraper(headless=headless)

    # Procesar
    resultados = scraper.procesar_referencias(archivo_referencias)

    # Resumen
    print("\n" + "=" * 60)
    print("  RESUMEN")
    print("=" * 60)
    print(f"\nReferencias procesadas: {len(resultados)}")

    if resultados:
        print(f"\n✅ DATOS EXTRAÍDOS CORRECTAMENTE")
        print(f"\nArchivos generados:")
        print(f"  - Individuales: data/[referencia].json")
        print(f"  - Consolidado: data/datos_catastrales_consolidados.json")

    print()
    print("Próximos pasos:")
    print("  1. Ejecuta: python server.py")
    print("  2. Abre: http://localhost:8000/frontend/")
    print("  3. Haz clic en 'Cargar Datos de Ejemplo'")
    print()


if __name__ == "__main__":
    main()
