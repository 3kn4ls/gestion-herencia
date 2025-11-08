#!/usr/bin/env python3
"""
Ejemplo de scraper usando Selenium para extraer datos reales del catastro
NOTA: Requiere tener instalado un navegador (Chrome/Firefox) y su driver correspondiente

Instalación:
    pip install selenium webdriver-manager

Para Chrome:
    pip install webdriver-manager

Para Firefox:
    pip install webdriver-manager
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
# from webdriver_manager.chrome import ChromeDriverManager
import json
import time
from typing import Dict, Optional


class SeleniumCatastroScraper:
    """
    Scraper de catastro usando Selenium
    """

    def __init__(self, headless: bool = True):
        """
        Inicializa el scraper

        Args:
            headless: Si True, ejecuta el navegador sin interfaz gráfica
        """
        self.headless = headless
        self.driver = None

    def iniciar_navegador(self):
        """Inicia el navegador Chrome"""
        chrome_options = Options()

        if self.headless:
            chrome_options.add_argument('--headless')

        # Opciones adicionales para evitar detección
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)

        # Descomentar para usar webdriver-manager (descarga automáticamente el driver)
        # self.driver = webdriver.Chrome(
        #     service=Service(ChromeDriverManager().install()),
        #     options=chrome_options
        # )

        # O especificar la ruta del driver manualmente
        # self.driver = webdriver.Chrome(
        #     service=Service('/ruta/a/chromedriver'),
        #     options=chrome_options
        # )

        print("⚠️  Navegador no inicializado: descomentar código de inicialización")
        print("   Instala: pip install webdriver-manager")

    def cerrar_navegador(self):
        """Cierra el navegador"""
        if self.driver:
            self.driver.quit()
            self.driver = None

    def extraer_datos_catastro(self, referencia: str) -> Optional[Dict]:
        """
        Extrae datos del catastro para una referencia catastral

        Args:
            referencia: Referencia catastral (ej: "03106A002000090000YL")

        Returns:
            Diccionario con los datos extraídos o None si hay error
        """
        if not self.driver:
            print("Error: Navegador no iniciado. Llama a iniciar_navegador() primero.")
            return None

        url = f"https://www1.sedecatastro.gob.es/CYCBienInmueble/OVCConCiud.aspx?RefC={referencia}"

        try:
            print(f"Accediendo a: {url}")
            self.driver.get(url)

            # Esperar a que cargue la página (ajustar selector según página real)
            WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )

            # Pequeña espera adicional para asegurar que todo cargó
            time.sleep(2)

            # Aquí extraer los datos según la estructura HTML real
            # Estos son ejemplos - ajustar según la página real del catastro

            datos = {
                "referencia_catastral": referencia,
                "url": url
            }

            # Ejemplo de extracción (ajustar selectores según HTML real):
            try:
                # Buscar elementos por ID, clase, XPath, etc.
                # Ejemplo genérico:

                # datos["provincia"] = self.driver.find_element(By.ID, "id_provincia").text

                # O usar XPath:
                # datos["municipio"] = self.driver.find_element(
                #     By.XPATH,
                #     "//label[contains(text(), 'Municipio')]/following-sibling::span"
                # ).text

                # O buscar en tablas:
                # tabla = self.driver.find_element(By.ID, "tabla_datos")
                # filas = tabla.find_elements(By.TAG_NAME, "tr")

                # Para desarrollo: guardar screenshot
                self.driver.save_screenshot(f'/tmp/catastro_{referencia}.png')
                print(f"  Screenshot guardado: /tmp/catastro_{referencia}.png")

                # Guardar HTML para análisis
                with open(f'/tmp/catastro_{referencia}.html', 'w', encoding='utf-8') as f:
                    f.write(self.driver.page_source)
                print(f"  HTML guardado: /tmp/catastro_{referencia}.html")

                print("  ⚠️  Implementar extracción de datos según HTML real")

            except Exception as e:
                print(f"  Error extrayendo datos: {e}")

            return datos

        except Exception as e:
            print(f"Error general: {e}")
            return None

    def extraer_multiples_referencias(self, referencias: list) -> list:
        """
        Extrae datos de múltiples referencias

        Args:
            referencias: Lista de referencias catastrales

        Returns:
            Lista de diccionarios con datos extraídos
        """
        resultados = []

        self.iniciar_navegador()

        try:
            for ref in referencias:
                print(f"\nProcesando: {ref}")
                datos = self.extraer_datos_catastro(ref)

                if datos:
                    resultados.append(datos)

                # Pausa entre peticiones para evitar bloqueos
                time.sleep(3)

        finally:
            self.cerrar_navegador()

        return resultados


def ejemplo_uso():
    """
    Ejemplo de uso del scraper
    """
    print("="*60)
    print("SCRAPER DE CATASTRO CON SELENIUM")
    print("="*60)
    print("\n⚠️  IMPORTANTE:")
    print("1. Instala: pip install selenium webdriver-manager")
    print("2. Descomenta el código de inicialización del navegador")
    print("3. Ajusta los selectores según el HTML real del catastro")
    print("4. Este código captura screenshots y HTML para análisis\n")
    print("="*60)

    # Crear scraper
    scraper = SeleniumCatastroScraper(headless=False)  # headless=False para ver el navegador

    # Referencias a extraer
    referencias = [
        "03106A002000090000YL",
        # Añadir más referencias aquí
    ]

    # Extraer datos
    resultados = scraper.extraer_multiples_referencias(referencias)

    # Guardar resultados
    if resultados:
        archivo = '/home/user/gestion-herencia/data/datos_selenium.json'
        with open(archivo, 'w', encoding='utf-8') as f:
            json.dump(resultados, f, indent=2, ensure_ascii=False)
        print(f"\n✓ Resultados guardados en: {archivo}")
    else:
        print("\n⚠️  No se extrajeron datos")

    print("\n" + "="*60)
    print("PROCESO COMPLETADO")
    print("="*60)
    print("\nPróximos pasos:")
    print("1. Revisa los screenshots en /tmp/catastro_*.png")
    print("2. Analiza el HTML en /tmp/catastro_*.html")
    print("3. Identifica los selectores correctos para cada campo")
    print("4. Actualiza el método extraer_datos_catastro()")
    print("5. Ejecuta de nuevo para extraer datos reales\n")


if __name__ == "__main__":
    ejemplo_uso()
