#!/usr/bin/env python3
"""
Servicio de extracción de datos catastrales
Este servicio proporciona una estructura completa para extraer y gestionar datos del catastro español

NOTA: El scraping directo del catastro está bloqueado por protecciones anti-bot.
Para uso en producción, se recomienda:
1. Usar Selenium con un navegador real
2. Consultar la API oficial del catastro (requiere acceso autorizado)
3. Extraer datos manualmente y cargarlos en el sistema
"""

import json
from typing import Dict, List, Optional
from datetime import datetime
import os


class CatastroScraperService:
    """
    Servicio principal para gestionar datos catastrales
    """

    def __init__(self, data_dir: str = "/home/user/gestion-herencia/data"):
        """
        Inicializa el servicio

        Args:
            data_dir: Directorio donde se guardan los datos JSON
        """
        self.data_dir = data_dir
        os.makedirs(data_dir, exist_ok=True)

    def extraer_datos_catastro(self, referencia: str) -> Dict:
        """
        Extrae datos del catastro para una referencia catastral

        NOTA: En producción, aquí iría el código de webscraping real con Selenium
        Por ahora, genera datos de ejemplo basados en la estructura real del catastro

        Args:
            referencia: Referencia catastral (ej: "03106A002000090000YL")

        Returns:
            Diccionario con los datos extraídos
        """
        print(f"Extrayendo datos para referencia: {referencia}")

        # Datos de ejemplo basados en la estructura real del catastro español
        # Estos datos reflejan la información que normalmente se encuentra en la página del catastro
        datos = {
            "referencia_catastral": referencia,
            "fecha_extraccion": datetime.now().isoformat(),
            "localizacion": {
                "provincia": self._extraer_provincia(referencia),
                "municipio": self._extraer_municipio(referencia),
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
                "ano_reforma": None
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
            },
            "titulares": {
                # Por privacidad, no se incluyen nombres reales
                "num_titulares": 1,
                "porcentajes": [100]
            },
            "cargas": [],
            "observaciones": "Datos de ejemplo - Reemplazar con datos reales del catastro",
            "url_consultada": f"https://www1.sedecatastro.gob.es/CYCBienInmueble/OVCConCiud.aspx?RefC={referencia}"
        }

        return datos

    def _extraer_provincia(self, referencia: str) -> str:
        """Extrae el código de provincia de la referencia catastral"""
        codigo_provincia = referencia[:2]
        provincias = {
            "03": "Alicante",
            "28": "Madrid",
            "08": "Barcelona",
            # Añadir más provincias según necesidad
        }
        return provincias.get(codigo_provincia, f"Provincia {codigo_provincia}")

    def _extraer_municipio(self, referencia: str) -> str:
        """Extrae el código de municipio de la referencia catastral"""
        codigo_municipio = referencia[2:5]
        return f"Municipio {codigo_municipio}"

    def procesar_multiples_referencias(
        self,
        referencias: List[str],
        guardar_individual: bool = True,
        guardar_consolidado: bool = True
    ) -> List[Dict]:
        """
        Procesa múltiples referencias catastrales

        Args:
            referencias: Lista de referencias catastrales
            guardar_individual: Si True, guarda cada referencia en un archivo JSON separado
            guardar_consolidado: Si True, guarda todas las referencias en un único JSON

        Returns:
            Lista de diccionarios con los datos extraídos
        """
        resultados = []

        print(f"\nProcesando {len(referencias)} referencias catastrales...")
        print("="*60)

        for i, ref in enumerate(referencias, 1):
            print(f"\n[{i}/{len(referencias)}] Procesando: {ref}")

            try:
                datos = self.extraer_datos_catastro(ref)
                resultados.append(datos)

                if guardar_individual:
                    archivo = os.path.join(self.data_dir, f"{ref}.json")
                    self._guardar_json(datos, archivo)
                    print(f"  ✓ Guardado en: {archivo}")

            except Exception as e:
                print(f"  ✗ Error: {e}")
                resultados.append({
                    "referencia_catastral": ref,
                    "error": str(e),
                    "fecha_extraccion": datetime.now().isoformat()
                })

        if guardar_consolidado and resultados:
            archivo_consolidado = os.path.join(self.data_dir, "datos_catastrales_consolidados.json")
            self._guardar_json(resultados, archivo_consolidado)
            print(f"\n✓ Datos consolidados guardados en: {archivo_consolidado}")

        print(f"\n{'='*60}")
        print(f"Proceso completado: {len(resultados)} referencias procesadas")

        return resultados

    def _guardar_json(self, datos: Dict or List, archivo: str):
        """Guarda datos en un archivo JSON"""
        with open(archivo, 'w', encoding='utf-8') as f:
            json.dump(datos, f, indent=2, ensure_ascii=False)

    def cargar_datos(self, archivo: str) -> Optional[Dict or List]:
        """Carga datos desde un archivo JSON"""
        try:
            with open(archivo, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error cargando datos: {e}")
            return None

    def generar_resumen(self, referencias: List[str]) -> Dict:
        """
        Genera un resumen de las propiedades consultadas

        Args:
            referencias: Lista de referencias catastrales

        Returns:
            Diccionario con estadísticas resumidas
        """
        resultados = self.procesar_multiples_referencias(
            referencias,
            guardar_individual=False,
            guardar_consolidado=False
        )

        resumen = {
            "total_propiedades": len(resultados),
            "fecha_generacion": datetime.now().isoformat(),
            "estadisticas": {
                "valor_catastral_total": sum(
                    r.get("datos_catastrales", {}).get("valor_catastral", 0)
                    for r in resultados
                ),
                "superficie_total_construida": sum(
                    r.get("datos_inmueble", {}).get("superficie_construida", 0)
                    for r in resultados
                ),
                "tipos_inmuebles": {}
            },
            "propiedades": resultados
        }

        # Contar tipos de inmuebles
        for r in resultados:
            tipo = r.get("datos_inmueble", {}).get("tipo", "Desconocido")
            resumen["estadisticas"]["tipos_inmuebles"][tipo] = \
                resumen["estadisticas"]["tipos_inmuebles"].get(tipo, 0) + 1

        return resumen


def main():
    """
    Función principal - Ejemplo de uso del servicio
    """
    print("="*60)
    print("SERVICIO DE EXTRACCIÓN DE DATOS CATASTRALES")
    print("="*60)

    # Crear instancia del servicio
    servicio = CatastroScraperService()

    # Lista de referencias catastrales de ejemplo
    referencias = [
        "03106A002000090000YL",
        "03106A002000100000YM",
        "03106A002000110000YN",
    ]

    # Procesar referencias
    resultados = servicio.procesar_multiples_referencias(
        referencias,
        guardar_individual=True,
        guardar_consolidado=True
    )

    # Generar resumen
    print("\n" + "="*60)
    print("GENERANDO RESUMEN")
    print("="*60)

    resumen = servicio.generar_resumen(referencias)
    archivo_resumen = os.path.join(servicio.data_dir, "resumen_propiedades.json")
    servicio._guardar_json(resumen, archivo_resumen)

    print(f"\n✓ Resumen guardado en: {archivo_resumen}")
    print(f"\nEstadísticas:")
    print(f"  - Total propiedades: {resumen['total_propiedades']}")
    print(f"  - Valor catastral total: {resumen['estadisticas']['valor_catastral_total']:,.2f} €")
    print(f"  - Superficie total: {resumen['estadisticas']['superficie_total_construida']:,.2f} m²")

    print("\n" + "="*60)
    print("PROCESO COMPLETADO")
    print("="*60)
    print(f"\nArchivos generados en: {servicio.data_dir}")


if __name__ == "__main__":
    main()
