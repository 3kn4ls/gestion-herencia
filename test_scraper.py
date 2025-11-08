#!/usr/bin/env python3
"""
Script de prueba para extraer información del catastro
"""

import requests
from bs4 import BeautifulSoup
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
        # Realizar petición con headers completos para simular un navegador
        session = requests.Session()
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0',
            'Referer': 'https://www1.sedecatastro.gob.es/'
        }

        # Primero visitar la página principal
        session.get('https://www1.sedecatastro.gob.es/', headers=headers, timeout=30)

        # Ahora acceder a la URL objetivo
        response = session.get(url, headers=headers, timeout=30)

        print(f"Status Code: {response.status_code}")
        print(f"Content Length: {len(response.content)}")

        if response.status_code != 200:
            print(f"Error: Código de estado {response.status_code}")
            return None

        response.raise_for_status()

        # Parsear HTML
        soup = BeautifulSoup(response.content, 'html.parser')

        # Extraer información
        datos = {
            "referencia_catastral": referencia,
            "url": url,
            "datos_extraidos": {}
        }

        # Buscar tablas y contenido relevante
        print("Estructura HTML encontrada:\n")

        # Buscar labels y sus valores
        labels = soup.find_all(['label', 'span', 'div'])
        for i, label in enumerate(labels[:50]):  # Primeros 50 elementos
            text = label.get_text(strip=True)
            if text and len(text) < 200:  # Solo textos no vacíos y cortos
                print(f"{i}: {text[:100]}")

        # Buscar tablas específicas
        tables = soup.find_all('table')
        print(f"\n\nTotal de tablas encontradas: {len(tables)}")

        for i, table in enumerate(tables):
            print(f"\n--- Tabla {i} ---")
            rows = table.find_all('tr')
            for row in rows[:10]:  # Primeras 10 filas
                cols = row.find_all(['td', 'th'])
                row_data = [col.get_text(strip=True) for col in cols]
                if any(row_data):
                    print(" | ".join(row_data))

        # Guardar HTML para análisis
        with open('/home/user/gestion-herencia/response.html', 'w', encoding='utf-8') as f:
            f.write(response.text)

        print("\n\nHTML guardado en response.html para análisis detallado")

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
