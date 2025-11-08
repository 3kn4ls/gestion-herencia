#!/usr/bin/env python3
"""
Sistema de Valoración de Inmuebles
Estima el precio de mercado basándose en datos del catastro y criterios de mercado

Criterios basados en:
- Ministerio de Agricultura (MAPA) - Datos 2022
- Cocampo - Actualización 2024/2025
- Coeficientes multiplicadores por CCAA
"""

import json
from datetime import datetime
from typing import Dict, List, Optional


class CriteriosValoracion:
    """
    Criterios de valoración actualizables
    Basados en datos de mercado 2024/2025
    """


    # ============================================================================
    # VALORES OFICIALES GVA 2025 - SISTEMA DE ÁMBITOS TERRITORIALES
    # ============================================================================
    # Fuente: NNTT_2025_Urbana y Rústica.pdf - Anejo II: Módulos de valor de los bienes inmuebles de naturaleza rústica
    # Organismo: Generalitat Valenciana - Agència Tributària Valenciana (ATV)
    # Vigencia: 2025-01-01 → 2025-12-31
    # Aplicado: 2025-11-08 17:37:20
    #
    # Ámbitos Territoriales:
    # - Ámbito 13 (Safor-Litoral): Oliva, Piles
    # - Ámbito 17 (Marina Alta-Interior): Vall de Gallinera
    # ============================================================================

    # Módulos de valor por ámbito territorial (€/hectárea)
    # Fuente: NNTT_2025 GVA - Anejo II
    PRECIOS_RUSTICO = {
        # Ámbito 13: Safor-Litoral (Oliva, Piles)
        # Fuente: NNTT_2025 GVA - Anejo II
        "ambito_13_safor_litoral": {
            "olivar_secano": 12200,
            "olivar_regadio": 24400,
            "almendro_secano": 6100,
            "almendro_regadio": 18300,
            "vina_secano": 9200,
            "vina_regadio": 18300,
            "frutal_secano": 0,
            "frutal_regadio": 30500,
            "citricos_regadio": 50800,
            "cereal_secano": 0,
            "cereal_regadio": 0,
            "horticola_regadio": 30500,
            "arroz_regadio": 18300,
            "pastos": 3000,
            "forestal": 0,
            "labor_secano": 4900,
            "labor_regadio": 27800,
            "pinar_maderable": 1800,
            "matorral": 1000,
            "improductivo": 1000,
            "default": 10000,
        },

        # Ámbito 17: Marina Alta-Interior (Vall de Gallinera)
        # Fuente: NNTT_2025 GVA - Anejo II
        "ambito_17_marina_alta_interior": {
            "olivar_secano": 15600,
            "olivar_regadio": 19500,
            "almendro_secano": 7800,
            "almendro_regadio": 19500,
            "vina_secano": 7800,
            "vina_regadio": 15600,
            "frutal_secano": 0,
            "frutal_regadio": 26000,
            "citricos_regadio": 39000,
            "cereal_secano": 0,
            "cereal_regadio": 0,
            "horticola_regadio": 26000,
            "pastos": 3100,
            "forestal": 0,
            "labor_secano": 6200,
            "labor_regadio": 20800,
            "pinar_maderable": 1900,
            "matorral": 1000,
            "improductivo": 1000,
            "default": 10000,
        },

        # Comunidad Valenciana (fallback general - usa Ámbito 13)
        "valencia": {
            "olivar_secano": 12200,
            "olivar_regadio": 24400,
            "almendro_secano": 6100,
            "almendro_regadio": 18300,
            "vina_secano": 9200,
            "vina_regadio": 18300,
            "frutal_secano": 0,
            "frutal_regadio": 30500,
            "citricos_regadio": 50800,
            "cereal_secano": 0,
            "cereal_regadio": 0,
            "horticola_regadio": 30500,
            "arroz_regadio": 18300,
            "pastos": 3000,
            "forestal": 0,
            "labor_secano": 4900,
            "labor_regadio": 27800,
            "pinar_maderable": 1800,
            "matorral": 1000,
            "improductivo": 1000,
            "default": 10000,
        },

        # Nacional (media España)
        "nacional": {
            "olivar_secano": 18905,
            "olivar_regadio": 38027,
            "default": 10200,
        },

        # Default
        "default": {
            "olivar_secano": 18905,
            "olivar_regadio": 38027,
            "default": 10200,
        }
    }

    # Nacional (media España)
    # NOTA: Estos valores se mantienen como referencia histórica
    # pero NO se usan para Oliva, Piles y Vall de Gallinera
    PRECIOS_RUSTICO_OLD = {
        "nacional": {
            "olivar_secano": 18905,      # MAPA 2022
            "olivar_regadio": 38027,     # MAPA 2022
            "olivar_total": 22844,       # MAPA 2022
            "default": 10200             # 1,02 €/m² = 10.200 €/ha
        },

        # Extremadura
        "extremadura": {
            "olivar_total": 8168,        # MAPA 2022
            "default": 6000
        },

        # Otras regiones (usar precios nacionales o ajustar)
        "default": {
            "olivar_secano": 18905,
            "olivar_regadio": 38027,
            "default": 10200
        }
    }

    # Coeficientes multiplicadores valor catastral -> valor mercado
    # Para inmuebles URBANOS
    # Fuente: Órdenes de las CCAA para 2025
    # NOTA: Estos coeficientes se actualizan anualmente por cada CCAA
    COEFICIENTES_URBANO = {
        "valencia": {
            "vivienda": 0.5,  # Aproximado - consultar Orden oficial
            "local": 0.5,
            "oficina": 0.5,
            "garaje": 0.4,
            "trastero": 0.4,
            "default": 0.5
        },
        "default": {
            "vivienda": 0.5,
            "local": 0.5,
            "default": 0.5
        }
    }

    # Factores de ajuste adicionales
    FACTORES_AJUSTE = {
        "antiguedad": {
            "nueva": 1.2,           # < 5 años
            "reciente": 1.1,        # 5-15 años
            "media": 1.0,           # 15-30 años
            "antigua": 0.9,         # 30-50 años
            "muy_antigua": 0.8      # > 50 años
        },
        "estado": {
            "excelente": 1.15,
            "bueno": 1.05,
            "normal": 1.0,
            "regular": 0.9,
            "malo": 0.75
        },
        "localizacion": {
            "centro": 1.3,
            "zona_buena": 1.1,
            "normal": 1.0,
            "periferia": 0.9,
            "rural": 0.8
        }
    }


class ValoradorInmuebles:
    """
    Valorador de inmuebles según datos del catastro
    """

    def __init__(self):
        self.criterios = CriteriosValoracion()

    def identificar_tipo_cultivo(self, texto_cultivo: str) -> str:
        """
        Identifica el tipo de cultivo a partir del texto del catastro

        Args:
            texto_cultivo: Texto del cultivo (ej: "O- Olivos secano")

        Returns:
            Tipo de cultivo normalizado
        """
        texto = texto_cultivo.lower()

        if "olivo" in texto or "oliv" in texto or "o-" in texto:
            if "secano" in texto:
                return "olivar_secano"
            elif "regadio" in texto or "regadío" in texto:
                return "olivar_regadio"
            return "olivar_secano"  # Por defecto secano

        # Frutos secos (almendro, etc.) - incluye "F-" del catastro
        if "almendro" in texto or "almendra" in texto or "a-" in texto or "f-" in texto or "fruto" in texto:
            if "secano" in texto:
                return "almendro_secano"
            return "almendro_regadio"

        if "vid" in texto or "viña" in texto or "v-" in texto:
            if "secano" in texto:
                return "vina_secano"
            return "vina_regadio"

        # Frutales (no confundir con frutos secos)
        if "frutal" in texto or "frt" in texto:
            if "secano" in texto:
                return "frutal_secano"
            return "frutal_regadio"

        if "cereal" in texto or "cer" in texto or "trigo" in texto or "cebada" in texto:
            if "secano" in texto:
                return "cereal_secano"
            return "cereal_regadio"

        # Labor o labradío (CR en catastro)
        if "labor" in texto or "labradio" in texto or "labradío" in texto or "cr" in texto:
            if "regadio" in texto or "regadío" in texto:
                return "labor_regadio"
            return "labor_secano"

        if "past" in texto or "prado" in texto or "e-" in texto:
            return "pastos"

        # MM - Pinar maderable (código específico MM)
        if "mm" in texto or ("pinar" in texto and "maderable" in texto):
            return "pinar_maderable"

        # MT - Matorral (código específico MT)
        if "mt" in texto or ("matorral" in texto and "maderable" not in texto):
            return "matorral"

        # I- - Improductivo
        if "i-" in texto or "improductivo" in texto or "erial" in texto:
            return "improductivo"

        if "forestal" in texto:
            return "forestal"

        return "default"

    def identificar_region(self, provincia: str, municipio: str = "") -> str:
        """
        Identifica el ámbito territorial para aplicar módulos de valor correctos

        Usa el sistema de ámbitos territoriales de la GVA que agrupa municipios
        con características agronómicas similares.

        Args:
            provincia: Nombre de la provincia
            municipio: Nombre del municipio (opcional, más preciso)

        Returns:
            Clave de ámbito territorial o región
        """
        # Primero intentar identificar por municipio (ámbitos territoriales GVA)
        if municipio:
            municipio_lower = municipio.lower().strip()

            # Ámbito 13: Safor-Litoral (Oliva, Piles)
            if municipio_lower in ['oliva', 'piles']:
                return 'ambito_13_safor_litoral'

            # Ámbito 17: Marina Alta-Interior (Vall de Gallinera, Planes)
            if municipio_lower in ['vall de gallinera', 'vall_de_gallinera', 'planes']:
                return 'ambito_17_marina_alta_interior'

        # Fallback a identificación por provincia
        provincia_lower = provincia.lower()

        if provincia_lower in ["alicante", "valencia", "castellon", "castellón"]:
            return "valencia"

        if provincia_lower in ["badajoz", "cáceres", "caceres"]:
            return "extremadura"

        # Por defecto usar precios nacionales
        return "nacional"

    def valorar_rustico(self, propiedad: Dict) -> Dict:
        """
        Valora un inmueble rústico

        Args:
            propiedad: Datos del inmueble del catastro

        Returns:
            Diccionario con valoración
        """
        # Soportar ambos formatos de datos
        datos_desc = propiedad.get("datos_descriptivos", {})
        parcela = propiedad.get("parcela_catastral", {})
        cultivos = propiedad.get("cultivos", [])

        # Obtener localización (puede estar en datos_descriptivos o directamente en propiedad)
        loc = datos_desc.get("localizacion", {}) or propiedad.get("localizacion", {})

        # Obtener superficie
        superficie_m2 = 0
        if parcela.get("superficie_gráfica"):
            import re
            match = re.search(r'[\d.,]+', parcela["superficie_gráfica"])
            if match:
                superficie_m2 = float(match.group().replace('.', '').replace(',', '.'))

        superficie_ha = superficie_m2 / 10000  # Convertir m² a ha

        # Identificar región (ahora con soporte para municipio)
        provincia = loc.get("provincia", "")
        municipio = loc.get("municipio", "")
        region = self.identificar_region(provincia, municipio)

        # Valorar por cultivos
        valor_total = 0
        detalles_cultivos = []

        if cultivos:
            for cultivo in cultivos:
                # Superficie de este cultivo
                sup_cultivo_m2 = float(cultivo.get("superficie_m2", "0").replace('.', '').replace(',', '.'))
                sup_cultivo_ha = sup_cultivo_m2 / 10000

                # Identificar tipo de cultivo
                cultivo_texto = cultivo.get("cultivo_aprovechamiento", "")
                tipo_cultivo = self.identificar_tipo_cultivo(cultivo_texto)

                # Obtener precio por hectárea
                precios_region = self.criterios.PRECIOS_RUSTICO.get(
                    region,
                    self.criterios.PRECIOS_RUSTICO["default"]
                )
                precio_ha = precios_region.get(tipo_cultivo, precios_region.get("default", 5000))

                # Calcular valor del cultivo
                valor_cultivo = sup_cultivo_ha * precio_ha

                valor_total += valor_cultivo

                detalles_cultivos.append({
                    "cultivo": cultivo.get("cultivo_aprovechamiento", ""),
                    "tipo_identificado": tipo_cultivo,
                    "superficie_m2": sup_cultivo_m2,
                    "superficie_ha": round(sup_cultivo_ha, 4),
                    "precio_ha": precio_ha,
                    "valor_estimado": round(valor_cultivo, 2)
                })
        else:
            # Si no hay cultivos, usar precio por defecto
            precios_region = self.criterios.PRECIOS_RUSTICO.get(
                region,
                self.criterios.PRECIOS_RUSTICO["default"]
            )
            precio_ha = precios_region.get("default", 5000)
            valor_total = superficie_ha * precio_ha

            detalles_cultivos.append({
                "cultivo": "Sin especificar",
                "tipo_identificado": "default",
                "superficie_m2": superficie_m2,
                "superficie_ha": round(superficie_ha, 4),
                "precio_ha": precio_ha,
                "valor_estimado": round(valor_total, 2)
            })

        return {
            "tipo_valoracion": "rustico",
            "metodo": "precio_mercado_cultivo",
            "superficie_total_m2": superficie_m2,
            "superficie_total_ha": round(superficie_ha, 4),
            "region": region,
            "provincia": provincia,
            "valor_estimado_euros": round(valor_total, 2),
            "valor_por_ha": round(valor_total / superficie_ha if superficie_ha > 0 else 0, 2),
            "valor_por_m2": round(valor_total / superficie_m2 if superficie_m2 > 0 else 0, 2),
            "detalles_cultivos": detalles_cultivos,
            "fuente_precios": f"Cocampo 2024/2025 - Región {region}",
            "advertencias": [
                "Valoración estimada basada en precios medios de mercado 2024/2025",
                "No incluye valor catastral (no disponible en datos extraídos)",
                "Precio real puede variar según ubicación exacta, accesos, agua, etc.",
                "Recomendable tasación oficial para operaciones importantes"
            ]
        }

    def valorar_urbano(self, propiedad: Dict) -> Dict:
        """
        Valora un inmueble urbano

        Args:
            propiedad: Datos del inmueble

        Returns:
            Diccionario con valoración
        """
        # Para urbanos necesitaríamos el valor catastral
        # que no está disponible en los datos actuales del scraper

        datos_catastrales = propiedad.get("datos_catastrales", {})
        valor_catastral = datos_catastrales.get("valor_catastral", 0)

        if valor_catastral == 0:
            return {
                "tipo_valoracion": "urbano",
                "metodo": "no_disponible",
                "error": "No se dispone del valor catastral para realizar la valoración",
                "advertencias": [
                    "Para inmuebles urbanos se necesita el valor catastral",
                    "El scraper actual no extrae el valor catastral (dato protegido)",
                    "Consultar directamente en la Sede Electrónica del Catastro"
                ]
            }

        # Si tuviéramos el valor catastral
        datos_desc = propiedad.get("datos_descriptivos", {})
        loc = datos_desc.get("localizacion", {}) or propiedad.get("localizacion", {})
        provincia = loc.get("provincia", "")
        municipio = loc.get("municipio", "")
        region = self.identificar_region(provincia, municipio)

        coefs = self.criterios.COEFICIENTES_URBANO.get(
            region,
            self.criterios.COEFICIENTES_URBANO["default"]
        )

        tipo_inmueble = propiedad.get("datos_inmueble", {}).get("tipo", "").lower()
        coeficiente = coefs.get(tipo_inmueble, coefs.get("default", 0.5))

        valor_estimado = valor_catastral * coeficiente

        return {
            "tipo_valoracion": "urbano",
            "metodo": "coeficiente_multiplicador",
            "valor_catastral": valor_catastral,
            "coeficiente": coeficiente,
            "region": region,
            "valor_estimado_euros": round(valor_estimado, 2),
            "fuente_criterios": f"Orden CCAA {region} 2025 (estimado)",
            "advertencias": [
                "Valoración estimada basada en coeficientes orientativos",
                "Coeficientes reales deben consultarse en Orden oficial de la CCAA",
                "Recomendable tasación oficial para operaciones importantes"
            ]
        }

    def valorar_propiedad(self, propiedad: Dict) -> Dict:
        """
        Valora una propiedad (rústica o urbana)

        Args:
            propiedad: Datos del inmueble del catastro

        Returns:
            Diccionario con valoración completa
        """
        # Soportar ambos formatos: nuevo (datos_descriptivos) y viejo (datos_inmueble)
        datos_desc = propiedad.get("datos_descriptivos", {})
        datos_inmueble = propiedad.get("datos_inmueble", {})

        # Intentar obtener clase de cualquiera de los dos formatos
        clase = datos_desc.get("clase", "") or datos_inmueble.get("clase", "")
        uso_principal = datos_desc.get("uso_principal", "") or datos_inmueble.get("uso_principal", "")

        clase_lower = clase.lower()

        valoracion = {
            "referencia_catastral": propiedad.get("referencia_catastral", ""),
            "fecha_valoracion": datetime.now().isoformat(),
            "clase": clase,
            "uso_principal": uso_principal
        }

        if "rústico" in clase_lower or "rustico" in clase_lower:
            valoracion.update(self.valorar_rustico(propiedad))
        else:
            valoracion.update(self.valorar_urbano(propiedad))

        return valoracion

    def valorar_multiples(self, propiedades: List[Dict]) -> Dict:
        """
        Valora múltiples propiedades y genera resumen

        Args:
            propiedades: Lista de propiedades

        Returns:
            Diccionario con valoraciones y resumen
        """
        valoraciones = []
        valor_total = 0

        for prop in propiedades:
            val = self.valorar_propiedad(prop)
            valoraciones.append(val)

            if "valor_estimado_euros" in val:
                valor_total += val["valor_estimado_euros"]

        resumen = {
            "total_propiedades": len(propiedades),
            "valor_total_estimado": round(valor_total, 2),
            "fecha_valoracion": datetime.now().isoformat(),
            "criterios_utilizados": {
                "fuente_rusticos": "Cocampo 2024/2025, MAPA 2022",
                "fuente_urbanos": "Coeficientes CCAA estimados 2025",
                "advertencia": "Valoraciones orientativas, no sustituyen tasación oficial"
            }
        }

        return {
            "resumen": resumen,
            "valoraciones": valoraciones
        }


def main():
    """
    Ejemplo de uso del valorador
    """
    import os

    print("=" * 60)
    print("SISTEMA DE VALORACIÓN DE INMUEBLES")
    print("=" * 60)
    print()

    # Cargar datos del catastro
    archivo_datos = "data/datos_catastrales_consolidados.json"

    if not os.path.exists(archivo_datos):
        print(f"❌ No se encontró el archivo: {archivo_datos}")
        print("\nEjecuta primero: python extraer_datos_reales.py")
        return

    with open(archivo_datos, 'r', encoding='utf-8') as f:
        propiedades = json.load(f)

    print(f"✓ Cargadas {len(propiedades)} propiedades\n")

    # Crear valorador
    valorador = ValoradorInmuebles()

    # Valorar todas las propiedades
    resultado = valorador.valorar_multiples(propiedades)

    # Guardar resultado
    archivo_valoraciones = "data/valoraciones.json"
    with open(archivo_valoraciones, 'w', encoding='utf-8') as f:
        json.dump(resultado, f, indent=2, ensure_ascii=False)

    print(f"✓ Valoraciones guardadas en: {archivo_valoraciones}\n")

    # Mostrar resumen
    resumen = resultado["resumen"]
    print("=" * 60)
    print("RESUMEN DE VALORACIÓN")
    print("=" * 60)
    print(f"\nTotal propiedades: {resumen['total_propiedades']}")
    print(f"Valor total estimado: {resumen['valor_total_estimado']:,.2f} €")
    print(f"\nFecha: {resumen['fecha_valoracion']}")

    # Mostrar detalle de cada propiedad
    print("\n" + "=" * 60)
    print("DETALLE POR PROPIEDAD")
    print("=" * 60)

    for val in resultado["valoraciones"]:
        print(f"\n📋 {val['referencia_catastral']}")
        print(f"   Clase: {val['clase']}")
        print(f"   Uso: {val['uso_principal']}")

        if "valor_estimado_euros" in val:
            print(f"   💰 Valor estimado: {val['valor_estimado_euros']:,.2f} €")

            if val.get("tipo_valoracion") == "rustico":
                print(f"   📏 Superficie: {val['superficie_total_ha']:.4f} ha ({val['superficie_total_m2']:.0f} m²)")
                print(f"   📊 Precio/ha: {val['valor_por_ha']:,.2f} €/ha")
                print(f"   📊 Precio/m²: {val['valor_por_m2']:.2f} €/m²")

                if val.get("detalles_cultivos"):
                    print(f"   🌾 Cultivos:")
                    for cult in val["detalles_cultivos"]:
                        print(f"      - {cult['cultivo']}: {cult['superficie_ha']:.4f} ha → {cult['valor_estimado']:,.2f} €")
        else:
            print(f"   ⚠️  {val.get('error', 'No se pudo valorar')}")

    print("\n" + "=" * 60)
    print("✅ PROCESO COMPLETADO")
    print("=" * 60)
    print(f"\nArchivos generados:")
    print(f"  - {archivo_valoraciones}")
    print()


if __name__ == "__main__":
    main()
