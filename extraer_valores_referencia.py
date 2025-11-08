#!/usr/bin/env python3
"""
Extractor de Valores de Referencia Oficiales del Catastro
Requiere autenticación con Cl@ve Móvil

Proceso:
1. Navega al portal del catastro
2. Espera autenticación manual del usuario con Cl@ve Móvil
3. Una vez autenticado, extrae valores de referencia para todas las referencias
4. Guarda los resultados en JSON
"""

import json
import os
import time
from datetime import datetime
from typing import List, Dict, Optional
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select
from selenium.common.exceptions import TimeoutException, NoSuchElementException


class ExtractorValoresReferencia:
    """
    Extrae los valores de referencia oficiales del catastro
    """

    def __init__(self, headless: bool = False):
        """
        Inicializa el extractor

        Args:
            headless: Si True, ejecuta el navegador sin interfaz gráfica
        """
        self.headless = headless
        self.driver = None
        self.autenticado = False
        self.ejercicio = "2025"

    def iniciar_navegador(self):
        """Inicia el navegador Chrome"""
        options = webdriver.ChromeOptions()
        if self.headless:
            options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)

        self.driver = webdriver.Chrome(options=options)
        self.driver.maximize_window()
        print("✓ Navegador iniciado")

    def cerrar_navegador(self):
        """Cierra el navegador"""
        if self.driver:
            self.driver.quit()
            print("✓ Navegador cerrado")

    def navegar_a_valores_referencia(self):
        """
        Navega hasta el formulario de búsqueda de valores de referencia
        y espera a que el usuario se autentique con Cl@ve Móvil
        """
        print("\n" + "=" * 60)
        print("PASO 1: Accediendo al portal del catastro...")
        print("=" * 60)

        # Paso 1: Acceder al portal
        self.driver.get("https://www.sedecatastro.gob.es/OVCInicio.aspx?Seguir=S")
        time.sleep(2)

        # Paso 2: Click en "Valor de referencia"
        print("\nPASO 2: Accediendo a Valor de Referencia...")
        try:
            enlace_vr = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.ID, "ctl00_Contenido_aVdR"))
            )
            enlace_vr.click()
            time.sleep(2)
        except:
            print("⚠️  No se encontró el enlace 'Valor de Referencia'. Continuando...")

        # Paso 3: Activar desplegable de 2025
        print("\nPASO 3: Abriendo valores de referencia 2025...")
        try:
            desplegable = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "a[href='#serv2025']"))
            )
            desplegable.click()
            time.sleep(1)
        except:
            print("⚠️  No se encontró el desplegable 2025. Continuando...")

        # Paso 4: Click en "Consulta de valor de referencia"
        print("\nPASO 4: Accediendo al buscador...")
        try:
            consulta_vr = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.ID, "a20252"))
            )
            consulta_vr.click()
            time.sleep(2)
        except:
            print("⚠️  No se encontró el enlace de consulta. Continuando...")

        # Paso 5: Click en Cl@ve
        print("\nPASO 5: Accediendo a autenticación Cl@ve...")
        try:
            clave_btn = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.ID, "ctl00_Contenido_aAccesoClavePIN"))
            )
            clave_btn.click()
            time.sleep(2)
        except:
            print("⚠️  No se encontró el botón Cl@ve. Continuando...")

        # Paso 6: Click en "Cl@ve Móvil"
        print("\nPASO 6: Seleccionando Cl@ve Móvil...")
        try:
            # Buscar el botón de Cl@ve Móvil
            clave_movil = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Cl@ve Móvil')]"))
            )
            clave_movil.click()
            time.sleep(2)
        except:
            print("⚠️  No se encontró el botón Cl@ve Móvil. Continuando...")

        # Paso 7: Esperar autenticación del usuario
        print("\n" + "=" * 60)
        print("⏳ AUTENTICACIÓN REQUERIDA")
        print("=" * 60)
        print("\n🔐 Por favor, completa la autenticación con Cl@ve Móvil en tu dispositivo")
        print("\n   Pasos:")
        print("   1. Abre la app Cl@ve Móvil en tu teléfono")
        print("   2. Confirma la autenticación")
        print("   3. Espera a que se redirija automáticamente")
        print("\n⏳ Esperando autenticación...")
        print("   (El script continuará automáticamente cuando estés autenticado)")

        # Esperar hasta que llegue a la página de búsqueda
        url_esperada = "https://www.sedecatastro.gob.es/CYCBienInmueble/OVCBusqueda.aspx"
        max_espera = 300  # 5 minutos
        inicio = time.time()

        while time.time() - inicio < max_espera:
            if url_esperada in self.driver.current_url:
                print("\n✓ Autenticación completada!")
                self.autenticado = True
                time.sleep(2)
                return True

            time.sleep(2)
            tiempo_transcurrido = int(time.time() - inicio)
            print(f"\r   Esperando... {tiempo_transcurrido}s", end="", flush=True)

        print("\n\n⚠️  Tiempo de espera agotado. Por favor, intenta nuevamente.")
        return False

    def consultar_valor_referencia(self, referencia: str, fecha_consulta: str = None) -> Optional[Dict]:
        """
        Consulta el valor de referencia de una referencia catastral

        Args:
            referencia: Referencia catastral
            fecha_consulta: Fecha de consulta en formato DD/MM/YYYY

        Returns:
            Diccionario con el valor de referencia o None si hay error
        """
        if not self.autenticado:
            print("❌ No autenticado. Ejecuta navegar_a_valores_referencia() primero")
            return None

        if fecha_consulta is None:
            fecha_consulta = datetime.now().strftime("%d/%m/%Y")

        print(f"\n📋 Consultando: {referencia}")

        try:
            # Paso 8: Seleccionar finalidad
            try:
                select_finalidad = Select(WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.ID, "ctl00_Contenido_ddlFinalidad"))
                ))
                select_finalidad.select_by_value("3")  # Impuesto sobre Sucesiones y Donaciones
                time.sleep(1)
            except Exception as e:
                print(f"   ⚠️  Error al seleccionar finalidad: {e}")

            # Paso 8b: Introducir fecha de consulta
            try:
                campo_fecha = self.driver.find_element(By.ID, "ctl00_Contenido_txtFechaConsulta")
                campo_fecha.clear()
                campo_fecha.send_keys(fecha_consulta)
                time.sleep(0.5)
            except Exception as e:
                print(f"   ⚠️  Error al introducir fecha: {e}")

            # Paso 9: Introducir referencia catastral
            campo_ref = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.ID, "ctl00_Contenido_txtRC2"))
            )
            campo_ref.clear()
            campo_ref.send_keys(referencia)
            time.sleep(0.5)

            # Paso 10: Click en "VALOR DE REFERENCIA"
            btn_buscar = self.driver.find_element(By.ID, "ctl00_Contenido_btnValorReferencia")
            btn_buscar.click()

            # Esperar a que cargue la página de resultados
            time.sleep(3)

            # Paso 11: Extraer el valor de referencia
            try:
                # Buscar el valor de referencia en la página
                valor_elemento = WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.XPATH, "//span[contains(text(), 'Valor de Referencia')]/..//label"))
                )
                valor_texto = valor_elemento.text.strip()

                # Limpiar el valor (ej: "931,10 €" -> 931.10)
                valor_numerico = float(valor_texto.replace('€', '').replace('.', '').replace(',', '.').strip())

                print(f"   ✓ Valor de referencia: {valor_texto}")

                resultado = {
                    "referencia_catastral": referencia,
                    "valor_referencia": valor_numerico,
                    "valor_referencia_texto": valor_texto,
                    "fecha_consulta": fecha_consulta,
                    "ejercicio": self.ejercicio,
                    "finalidad": "Tributación en Impuesto sobre Sucesiones y Donaciones",
                    "fecha_extraccion": datetime.now().isoformat()
                }

                # Paso 12: Volver a la página de búsqueda
                self.driver.get(f"https://www.sedecatastro.gob.es/CYCBienInmueble/OVCBusqueda.aspx?VR=SI&ejercicio={self.ejercicio}")
                time.sleep(2)

                return resultado

            except Exception as e:
                print(f"   ❌ Error al extraer valor: {e}")
                # Intentar volver a la página de búsqueda
                try:
                    self.driver.get(f"https://www.sedecatastro.gob.es/CYCBienInmueble/OVCBusqueda.aspx?VR=SI&ejercicio={self.ejercicio}")
                    time.sleep(2)
                except:
                    pass
                return None

        except Exception as e:
            print(f"   ❌ Error en la consulta: {e}")
            return None

    def procesar_referencias(self, referencias: List[str], fecha_consulta: str = None) -> List[Dict]:
        """
        Procesa múltiples referencias catastrales

        Args:
            referencias: Lista de referencias catastrales
            fecha_consulta: Fecha de consulta

        Returns:
            Lista de resultados
        """
        resultados = []

        print("\n" + "=" * 60)
        print(f"PROCESANDO {len(referencias)} REFERENCIAS")
        print("=" * 60)

        for i, ref in enumerate(referencias, 1):
            print(f"\n[{i}/{len(referencias)}]", end=" ")
            resultado = self.consultar_valor_referencia(ref, fecha_consulta)

            if resultado:
                resultados.append(resultado)
            else:
                print(f"   ⚠️  No se pudo obtener el valor de referencia")

            # Pequeña pausa entre consultas
            time.sleep(1)

        return resultados


def main():
    """Función principal"""
    print("=" * 60)
    print("EXTRACTOR DE VALORES DE REFERENCIA DEL CATASTRO")
    print("=" * 60)
    print()

    # Leer referencias del archivo
    archivo_referencias = "referencias.txt"
    if not os.path.exists(archivo_referencias):
        print(f"❌ No se encontró el archivo: {archivo_referencias}")
        print("\nCrea un archivo 'referencias.txt' con una referencia por línea")
        return

    with open(archivo_referencias, 'r', encoding='utf-8') as f:
        referencias = [line.strip() for line in f if line.strip()]

    print(f"✓ Cargadas {len(referencias)} referencias de {archivo_referencias}")

    # Pedir fecha de consulta (opcional)
    fecha_consulta = datetime.now().strftime("%d/%m/%Y")
    print(f"\nFecha de consulta: {fecha_consulta}")

    # Crear extractor
    extractor = ExtractorValoresReferencia(headless=False)

    try:
        # Iniciar navegador
        extractor.iniciar_navegador()

        # Navegar y autenticar
        if not extractor.navegar_a_valores_referencia():
            print("\n❌ No se pudo completar la autenticación")
            return

        # Procesar referencias
        resultados = extractor.procesar_referencias(referencias, fecha_consulta)

        # Guardar resultados
        if resultados:
            archivo_salida = "data/valores_referencia.json"
            os.makedirs("data", exist_ok=True)

            with open(archivo_salida, 'w', encoding='utf-8') as f:
                json.dump(resultados, f, indent=2, ensure_ascii=False)

            print("\n" + "=" * 60)
            print("✅ PROCESO COMPLETADO")
            print("=" * 60)
            print(f"\nResultados guardados en: {archivo_salida}")
            print(f"Total extraído: {len(resultados)}/{len(referencias)} referencias")

            # Mostrar resumen
            print("\n📊 RESUMEN:")
            for r in resultados:
                print(f"  {r['referencia_catastral']}: {r['valor_referencia_texto']}")
        else:
            print("\n⚠️  No se obtuvieron resultados")

    except KeyboardInterrupt:
        print("\n\n⏹️  Proceso interrumpido por el usuario")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

    finally:
        # Cerrar navegador
        input("\n\nPresiona ENTER para cerrar el navegador...")
        extractor.cerrar_navegador()


if __name__ == "__main__":
    main()
