#!/usr/bin/env python3
"""
Extractor REAL de datos del catastro usando Selenium
Este script SÍ extrae datos reales de la web del catastro
"""

import time
import json
import os
from datetime import datetime
from typing import Dict, Optional, List

try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.chrome.service import Service
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
            print("✓ Navegador iniciado correctamente\n")
        except Exception as e:
            print(f"❌ Error al iniciar Chrome: {e}")
            print("\nAsegúrate de tener Chrome instalado.")
            print("Chrome se descarga automáticamente, pero puede tardar la primera vez.\n")
            raise

    def cerrar_navegador(self):
        """Cierra el navegador"""
        if self.driver:
            self.driver.quit()
            self.driver = None

    def extraer_datos_catastro(self, referencia: str) -> Optional[Dict]:
        """
        Extrae datos REALES del catastro para una referencia

        Args:
            referencia: Referencia catastral

        Returns:
            Diccionario con los datos extraídos o None si hay error
        """
        url = f"https://www1.sedecatastro.gob.es/CYCBienInmueble/OVCConCiud.aspx?RefC={referencia}"

        try:
            print(f"📡 Accediendo a la página del catastro...")
            self.driver.get(url)

            # Esperar a que cargue la página
            time.sleep(3)

            # Verificar si hay error o acceso denegado
            page_source = self.driver.page_source.lower()
            if 'access denied' in page_source or 'acceso denegado' in page_source:
                print(f"  ⚠️  Acceso denegado por el catastro")
                return None

            # Extraer datos
            datos = {
                "referencia_catastral": referencia,
                "fecha_extraccion": datetime.now().isoformat(),
                "url_consultada": url,
                "localizacion": {},
                "datos_inmueble": {},
                "datos_catastrales": {},
                "coordenadas": {}
            }

            # Intentar extraer datos con diferentes selectores
            print(f"  🔍 Extrayendo datos...")

            # Extraer usando los IDs y estructuras reales de la página del catastro
            # Estos selectores pueden cambiar con el tiempo
            try:
                # Buscar elementos de forma general
                labels = self.driver.find_elements(By.TAG_NAME, "label")
                spans = self.driver.find_elements(By.TAG_NAME, "span")

                # Crear un mapa de etiqueta -> valor
                datos_extraidos = {}

                for i, label in enumerate(labels):
                    texto_label = label.text.strip()
                    if texto_label:
                        # Buscar el valor asociado (normalmente está en el siguiente elemento)
                        try:
                            siguiente = label.find_element(By.XPATH, "./following-sibling::*[1]")
                            valor = siguiente.text.strip()
                            if valor:
                                datos_extraidos[texto_label] = valor
                        except:
                            pass

                # Mapear los datos extraídos a nuestra estructura
                print(f"  📊 Datos encontrados: {len(datos_extraidos)} campos")

                # Localización
                if 'Provincia' in datos_extraidos or 'PROVINCIA' in datos_extraidos:
                    datos["localizacion"]["provincia"] = datos_extraidos.get('Provincia') or datos_extraidos.get('PROVINCIA')

                if 'Municipio' in datos_extraidos or 'MUNICIPIO' in datos_extraidos:
                    datos["localizacion"]["municipio"] = datos_extraidos.get('Municipio') or datos_extraidos.get('MUNICIPIO')

                # Añadir todos los datos extraídos como raw data
                datos["datos_raw"] = datos_extraidos

                print(f"  ✓ Extracción completada")

            except Exception as e:
                print(f"  ⚠️  Error extrayendo datos específicos: {e}")
                # Guardar HTML para análisis
                with open(f'{self.data_dir}/debug_{referencia}.html', 'w', encoding='utf-8') as f:
                    f.write(self.driver.page_source)
                print(f"  💾 HTML guardado para análisis en: {self.data_dir}/debug_{referencia}.html")

            return datos

        except Exception as e:
            print(f"  ❌ Error: {e}")
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
                    print(f"\n  ⏳ Esperando 5 segundos antes de la siguiente petición...")
                    time.sleep(5)

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
    print("  1. Sí, mostrar navegador (más lento pero ves el proceso)")
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
    print(f"Archivos generados en: {scraper.data_dir}/")
    print()
    print("Próximos pasos:")
    print("  1. Ejecuta: python server.py")
    print("  2. Abre: http://localhost:8000/frontend/")
    print("  3. Haz clic en 'Cargar Datos de Ejemplo'")
    print()


if __name__ == "__main__":
    main()
