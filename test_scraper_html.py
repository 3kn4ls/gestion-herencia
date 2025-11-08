#!/usr/bin/env python3
"""
Script de prueba para extraer información del catastro usando requests-html
"""

from requests_html import HTMLSession
import json

def test_catastro_scraping():
    """
    Prueba de extracción de datos del catastro
    """
    url = "https://www1.sedecatastro.gob.es/CYCBienInmueble/OVCConCiud.aspx?UrbRus=R&RefC=03106A002000090000YL&esBice=&RCBice1=&RCBice2=&DenoBice=&from=OVCBusqueda&pest=rc&RCCompleta=03106A002000090000YL&final=&del=3&mun=106"
    referencia = "03106A002000090000Y"

    print(f"Extrayendo información de la referencia catastral: {referencia}")
    print(f"URL: {url}\n")

    try:
        session = HTMLSession()

        # Realizar petición
        response = session.get(url, timeout=30)

        print(f"Status Code: {response.status_code}")

        if response.status_code != 200:
            print(f"Error: Código de estado {response.status_code}")
            # Guardar el contenido para inspección
            with open('/home/user/gestion-herencia/error_response.html', 'w', encoding='utf-8') as f:
                f.write(response.text)
            print("Respuesta guardada en error_response.html")
            return None

        # Intentar renderizar JavaScript (puede requerir descargar chromium)
        try:
            print("Intentando renderizar JavaScript...")
            response.html.render(timeout=30)
            print("JavaScript renderizado correctamente")
        except Exception as e:
            print(f"No se pudo renderizar JavaScript: {e}")
            print("Continuando sin JavaScript...")

        # Guardar HTML
        with open('/home/user/gestion-herencia/response.html', 'w', encoding='utf-8') as f:
            f.write(response.html.html)

        print("\nHTML guardado en response.html")

        # Extraer información
        datos = {
            "referencia_catastral": referencia,
            "url": url,
            "datos_extraidos": {}
        }

        # Buscar elementos específicos
        print("\n\n=== ANÁLISIS DEL HTML ===\n")

        # Buscar todos los labels y spans con texto
        all_text_elements = response.html.find('label, span, div')
        print(f"Total de elementos de texto encontrados: {len(all_text_elements)}\n")

        for i, elem in enumerate(all_text_elements[:100]):
            text = elem.text
            if text and len(text.strip()) > 0 and len(text) < 200:
                print(f"{i}: {text[:100]}")

        return datos

    except Exception as e:
        print(f"Error al extraer datos: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    datos = test_catastro_scraping()
    if datos:
        print("\n\nDatos extraídos:")
        print(json.dumps(datos, indent=2, ensure_ascii=False))
