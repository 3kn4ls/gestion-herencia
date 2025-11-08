#!/usr/bin/env python3
"""
Servicio para consultar información catastral usando la API oficial del Catastro
API Documentation: http://www.catastro.meh.es/ws/webservices_catastro.pdf
"""

import requests
from typing import Dict, List, Optional
import json
import xml.etree.ElementTree as ET
from datetime import datetime


class CatastroService:
    """
    Servicio para interactuar con la API oficial del Catastro español
    """

    # URL base para consultas de datos catastrales (CONSULTA_DNPRC)
    BASE_URL_DNPRC = "http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejeroCodigos.asmx/Consulta_DNPRC"

    # URL base para consultas de datos por referencia catastral (CONSULTA_DNPLOC)
    BASE_URL_DNPLOC = "http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejeroCodigos.asmx/Consulta_DNPLOC"

    # URL para consultas de coordenadas
    BASE_URL_CPMRC = "http://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCoordenadas.asmx/Consulta_CPMRC"

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (compatible; CatastroService/1.0)'
        })

    def consultar_referencia_catastral(self, referencia: str) -> Optional[Dict]:
        """
        Consulta información de una referencia catastral

        Args:
            referencia: Referencia catastral (ej: "03106A002000090000YL")

        Returns:
            Diccionario con la información catastral o None si hay error
        """
        try:
            # Extraer provincia y municipio de la referencia
            # Los primeros 2 dígitos son la provincia
            provincia = referencia[:2]
            municipio = referencia[2:5]

            # Parámetros para la consulta
            params = {
                'Provincia': provincia,
                'Municipio': municipio,
                'RC': referencia
            }

            print(f"Consultando referencia catastral: {referencia}")
            print(f"Provincia: {provincia}, Municipio: {municipio}")

            # Realizar petición a la API
            response = self.session.get(
                self.BASE_URL_CPMRC,
                params=params,
                timeout=30
            )

            print(f"Status Code: {response.status_code}")

            if response.status_code != 200:
                print(f"Error: Código {response.status_code}")
                return None

            # Parsear respuesta XML
            datos = self._parsear_respuesta_xml(response.text, referencia)

            return datos

        except Exception as e:
            print(f"Error al consultar referencia catastral: {e}")
            import traceback
            traceback.print_exc()
            return None

    def _parsear_respuesta_xml(self, xml_text: str, referencia: str) -> Dict:
        """
        Parsea la respuesta XML de la API del Catastro
        """
        try:
            # Guardar XML para inspección
            with open('/home/user/gestion-herencia/catastro_response.xml', 'w', encoding='utf-8') as f:
                f.write(xml_text)

            root = ET.fromstring(xml_text)

            # Crear estructura de datos
            datos = {
                "referencia_catastral": referencia,
                "fecha_consulta": datetime.now().isoformat(),
                "datos": {}
            }

            # Buscar información en el XML
            # El formato exacto depende de la respuesta de la API
            for elem in root.iter():
                if elem.text and elem.text.strip():
                    datos["datos"][elem.tag] = elem.text.strip()

            return datos

        except Exception as e:
            print(f"Error parseando XML: {e}")
            # Devolver estructura básica con el XML raw
            return {
                "referencia_catastral": referencia,
                "fecha_consulta": datetime.now().isoformat(),
                "xml_raw": xml_text,
                "datos": {}
            }

    def consultar_multiples_referencias(self, referencias: List[str]) -> List[Dict]:
        """
        Consulta múltiples referencias catastrales

        Args:
            referencias: Lista de referencias catastrales

        Returns:
            Lista de diccionarios con la información
        """
        resultados = []

        for ref in referencias:
            print(f"\n{'='*60}")
            resultado = self.consultar_referencia_catastral(ref)
            if resultado:
                resultados.append(resultado)
            else:
                # Agregar entrada de error
                resultados.append({
                    "referencia_catastral": ref,
                    "fecha_consulta": datetime.now().isoformat(),
                    "error": "No se pudo obtener información"
                })

        return resultados

    def guardar_resultados_json(self, resultados: List[Dict], archivo: str):
        """
        Guarda los resultados en un archivo JSON

        Args:
            resultados: Lista de resultados
            archivo: Ruta del archivo JSON
        """
        try:
            with open(archivo, 'w', encoding='utf-8') as f:
                json.dump(resultados, f, indent=2, ensure_ascii=False)
            print(f"\nResultados guardados en: {archivo}")
            return True
        except Exception as e:
            print(f"Error guardando JSON: {e}")
            return False


def main():
    """
    Función principal para probar el servicio
    """
    # Crear instancia del servicio
    servicio = CatastroService()

    # Referencia catastral de ejemplo
    referencia_ejemplo = "03106A002000090000YL"

    print("="*60)
    print("SERVICIO DE CONSULTA CATASTRAL")
    print("="*60)
    print(f"\nUsando API oficial del Catastro español")
    print(f"URL base: {servicio.BASE_URL_CPMRC}\n")

    # Consultar una referencia
    resultado = servicio.consultar_referencia_catastral(referencia_ejemplo)

    if resultado:
        print(f"\n{'='*60}")
        print("RESULTADO:")
        print('='*60)
        print(json.dumps(resultado, indent=2, ensure_ascii=False))

        # Guardar en JSON
        servicio.guardar_resultados_json([resultado], '/home/user/gestion-herencia/datos_catastrales.json')
    else:
        print("\nNo se pudo obtener información de la referencia catastral")

    # Ejemplo con múltiples referencias
    print(f"\n\n{'='*60}")
    print("EJEMPLO CON MÚLTIPLES REFERENCIAS")
    print('='*60)

    referencias = [
        "03106A002000090000YL",
        # Añadir más referencias aquí
    ]

    resultados = servicio.consultar_multiples_referencias(referencias)
    servicio.guardar_resultados_json(resultados, '/home/user/gestion-herencia/datos_catastrales_multiples.json')


if __name__ == "__main__":
    main()
