#!/usr/bin/env python3
"""
Script para extraer y estructurar datos del PDF de la GVA
NNTT_2025_Urbana y Rústica.pdf

Este script NO modifica la aplicación, solo crea/actualiza:
- data/valores_gva_2025.json (datos extraídos)
"""

import json
import os
from datetime import datetime
from typing import Dict, Any, Optional


class ExtractorDatosGVA:
    """
    Extractor interactivo de datos del PDF oficial de la GVA
    """

    def __init__(self):
        self.template_path = "data/valores_gva_2025_template.json"
        self.output_path = "data/valores_gva_2025.json"
        self.datos = None

    def cargar_template(self):
        """Carga el template o datos existentes"""
        if os.path.exists(self.output_path):
            print(f"📂 Cargando datos existentes: {self.output_path}")
            with open(self.output_path, 'r', encoding='utf-8') as f:
                self.datos = json.load(f)
            print("✓ Datos cargados (se actualizarán)")
        elif os.path.exists(self.template_path):
            print(f"📋 Cargando template: {self.template_path}")
            with open(self.template_path, 'r', encoding='utf-8') as f:
                self.datos = json.load(f)
            print("✓ Template cargado")
        else:
            print("❌ No se encuentra ni template ni datos existentes")
            return False

        return True

    def guardar_datos(self):
        """Guarda los datos actualizados"""
        self.datos['fuente']['fecha_extraccion'] = datetime.now().isoformat()

        os.makedirs("data", exist_ok=True)
        with open(self.output_path, 'w', encoding='utf-8') as f:
            json.dump(self.datos, f, indent=2, ensure_ascii=False)

        print(f"\n✅ Datos guardados en: {self.output_path}")

    def mostrar_menu_principal(self):
        """Muestra el menú principal"""
        print("\n" + "=" * 70)
        print("EXTRACTOR DE DATOS - PDF GVA 2025")
        print("=" * 70)
        print("\n¿Qué deseas hacer?\n")
        print("1. Introducir/actualizar datos de OLIVA")
        print("2. Introducir/actualizar datos de PLANES")
        print("3. Introducir/actualizar datos de VALL DE GALLINERA")
        print("4. Ver resumen de datos actuales")
        print("5. Exportar a formato simplificado (para valorador)")
        print("6. Añadir notas/observaciones generales")
        print("0. Guardar y salir")
        print()

        opcion = input("Selecciona una opción: ").strip()
        return opcion

    def introducir_datos_municipio(self, municipio_key: str, municipio_nombre: str):
        """Introduce datos para un municipio específico"""
        municipio = self.datos['municipios'][municipio_key]

        while True:
            print(f"\n{'=' * 70}")
            print(f"MUNICIPIO: {municipio_nombre.upper()}")
            print(f"{'=' * 70}\n")
            print("1. Datos RÚSTICO (€/ha por cultivo)")
            print("2. Datos URBANO (coeficientes)")
            print("3. Información general del municipio")
            print("0. Volver al menú principal")
            print()

            opcion = input("Selecciona: ").strip()

            if opcion == "1":
                self.introducir_rustico(municipio, municipio_nombre)
            elif opcion == "2":
                self.introducir_urbano(municipio, municipio_nombre)
            elif opcion == "3":
                self.introducir_info_general(municipio, municipio_nombre)
            elif opcion == "0":
                break

    def introducir_rustico(self, municipio: Dict, nombre: str):
        """Introduce valores rústicos"""
        print(f"\n{'=' * 70}")
        print(f"SUELO RÚSTICO - {nombre}")
        print(f"{'=' * 70}\n")
        print("Introduce los valores del PDF (€/ha)")
        print("Deja en blanco para mantener valor actual o usar N/A si no aplica\n")

        valores = municipio['rustico']['valores']

        cultivos = {
            'olivar_secano': 'Olivar Secano',
            'olivar_regadio': 'Olivar Regadío',
            'almendro_secano': 'Almendro Secano',
            'almendro_regadio': 'Almendro Regadío',
            'vina_secano': 'Viña Secano',
            'vina_regadio': 'Viña Regadío',
            'frutal_secano': 'Frutal Secano',
            'frutal_regadio': 'Frutal Regadío',
            'citricos_regadio': 'Cítricos Regadío',
            'cereal_secano': 'Cereal Secano',
            'cereal_regadio': 'Cereal Regadío',
            'horticola_secano': 'Hortícola Secano',
            'horticola_regadio': 'Hortícola Regadío',
            'pastos': 'Pastos',
            'prado': 'Prado',
            'forestal': 'Forestal',
            'monte_bajo': 'Monte Bajo',
            'erial': 'Erial/Baldío',
            'improductivo': 'Improductivo'
        }

        for key, nombre_cultivo in cultivos.items():
            valor_actual = valores[key]['valor']
            denominacion_actual = valores[key].get('denominacion_oficial', '')

            actual_str = f" [Actual: {valor_actual:,.0f} €/ha]" if valor_actual else " [Sin datos]"

            # Valor
            while True:
                valor_input = input(f"  {nombre_cultivo}{actual_str}: ").strip()

                if not valor_input:  # Mantener actual
                    break

                if valor_input.upper() in ['N/A', 'NA', 'NO', 'X']:
                    valores[key]['valor'] = 0
                    valores[key]['notas'] = "No aplica según PDF oficial"
                    break

                try:
                    valor = float(valor_input.replace('.', '').replace(',', '.'))
                    valores[key]['valor'] = valor
                    break
                except ValueError:
                    print("    ❌ Valor inválido. Usa número, N/A, o Enter para mantener")

            # Denominación oficial (opcional)
            if valor_input and valor_input.upper() not in ['N/A', 'NA', 'NO', 'X']:
                denom = input(f"    Denominación oficial en PDF (Enter=omitir): ").strip()
                if denom:
                    valores[key]['denominacion_oficial'] = denom

        # Zonificación
        print("\n¿Este municipio tiene zonificación (diferentes valores por zona)? (s/n): ", end='')
        zonif = input().strip().lower()
        if zonif == 's':
            self.introducir_zonificacion_rustica(municipio)

    def introducir_urbano(self, municipio: Dict, nombre: str):
        """Introduce coeficientes urbanos"""
        print(f"\n{'=' * 70}")
        print(f"SUELO URBANO - {nombre}")
        print(f"{'=' * 70}\n")
        print("Introduce los coeficientes multiplicadores")
        print("Deja en blanco para mantener valor actual o usar N/A si no aplica\n")

        valores = municipio['urbano']['valores']

        tipos = {
            'vivienda': 'Vivienda',
            'local_comercial': 'Local Comercial',
            'oficina': 'Oficina',
            'industrial': 'Industrial',
            'almacen': 'Almacén',
            'garaje': 'Garaje',
            'trastero': 'Trastero',
            'solar': 'Solar'
        }

        for key, nombre_tipo in tipos.items():
            valor_actual = valores[key]['coeficiente']

            actual_str = f" [Actual: {valor_actual:.2f}]" if valor_actual else " [Sin datos]"

            while True:
                valor_input = input(f"  {nombre_tipo}{actual_str}: ").strip()

                if not valor_input:  # Mantener actual
                    break

                if valor_input.upper() in ['N/A', 'NA', 'NO', 'X']:
                    valores[key]['coeficiente'] = 0
                    valores[key]['notas'] = "No aplica según PDF oficial"
                    break

                try:
                    valor = float(valor_input.replace(',', '.'))
                    valores[key]['coeficiente'] = valor
                    break
                except ValueError:
                    print("    ❌ Valor inválido. Usa número, N/A, o Enter para mantener")

            # Denominación oficial (opcional)
            if valor_input and valor_input.upper() not in ['N/A', 'NA', 'NO', 'X']:
                denom = input(f"    Denominación oficial en PDF (Enter=omitir): ").strip()
                if denom:
                    valores[key]['denominacion_oficial'] = denom

        # Zonificación urbana
        print("\n¿Este municipio tiene zonificación urbana? (s/n): ", end='')
        zonif = input().strip().lower()
        if zonif == 's':
            self.introducir_zonificacion_urbana(municipio)

    def introducir_zonificacion_rustica(self, municipio: Dict):
        """Introduce zonificación para rústico"""
        print("\n📍 ZONIFICACIÓN RÚSTICA\n")
        print("Introduce las zonas del municipio con valores diferenciados:")

        zonas = []
        while True:
            print(f"\nZona #{len(zonas) + 1}")
            nombre = input("  Nombre de la zona (Enter=terminar): ").strip()
            if not nombre:
                break

            descripcion = input("  Descripción: ").strip()

            zona = {
                "nombre": nombre,
                "descripcion": descripcion,
                "valores_especificos": {}
            }

            print("  ¿Qué cultivos tienen valores diferentes en esta zona?")
            print("  (Introduce tipos separados por coma, ej: olivar_secano,almendro_secano)")
            cultivos_zona = input("  Cultivos: ").strip()

            if cultivos_zona:
                for cultivo in cultivos_zona.split(','):
                    cultivo = cultivo.strip()
                    valor = input(f"    Valor {cultivo} (€/ha): ").strip()
                    if valor:
                        try:
                            zona['valores_especificos'][cultivo] = float(valor.replace('.', '').replace(',', '.'))
                        except:
                            pass

            zonas.append(zona)

        if zonas:
            municipio['rustico']['zonificacion']['zonas'] = zonas

    def introducir_zonificacion_urbana(self, municipio: Dict):
        """Introduce zonificación para urbano"""
        print("\n📍 ZONIFICACIÓN URBANA\n")
        print("Introduce las zonas del municipio con coeficientes diferenciados:")

        zonas = []
        while True:
            print(f"\nZona #{len(zonas) + 1}")
            nombre = input("  Nombre de la zona (Enter=terminar): ").strip()
            if not nombre:
                break

            descripcion = input("  Descripción: ").strip()

            zona = {
                "nombre": nombre,
                "descripcion": descripcion,
                "coeficientes_especificos": {}
            }

            print("  ¿Qué tipos tienen coeficientes diferentes en esta zona?")
            print("  (Introduce tipos separados por coma, ej: vivienda,local_comercial)")
            tipos_zona = input("  Tipos: ").strip()

            if tipos_zona:
                for tipo in tipos_zona.split(','):
                    tipo = tipo.strip()
                    coef = input(f"    Coeficiente {tipo}: ").strip()
                    if coef:
                        try:
                            zona['coeficientes_especificos'][tipo] = float(coef.replace(',', '.'))
                        except:
                            pass

            zonas.append(zona)

        if zonas:
            municipio['urbano']['zonificacion']['zonas'] = zonas

    def introducir_info_general(self, municipio: Dict, nombre: str):
        """Introduce información general del municipio"""
        print(f"\n{'=' * 70}")
        print(f"INFORMACIÓN GENERAL - {nombre}")
        print(f"{'=' * 70}\n")

        codigo = input(f"Código INE [{municipio.get('codigo_ine', 'N/A')}]: ").strip()
        if codigo:
            municipio['codigo_ine'] = codigo

        print("\nNotas adicionales (Enter=omitir):")
        notas = input().strip()
        if notas:
            if 'notas_generales' not in municipio:
                municipio['notas_generales'] = []
            municipio['notas_generales'].append({
                'fecha': datetime.now().isoformat(),
                'texto': notas
            })

    def ver_resumen(self):
        """Muestra resumen de datos actuales"""
        print("\n" + "=" * 70)
        print("RESUMEN DE DATOS ACTUALES")
        print("=" * 70)

        for muni_key, muni_data in self.datos['municipios'].items():
            nombre = muni_data['nombre_oficial']
            print(f"\n📍 {nombre.upper()}")
            print("-" * 70)

            # Rústico
            rustico = muni_data['rustico']['valores']
            valores_rustico = [k for k, v in rustico.items()
                             if isinstance(v, dict) and v.get('valor') is not None and v.get('valor') > 0]
            print(f"  Rústico: {len(valores_rustico)} cultivos con datos")

            if valores_rustico:
                print("    Ejemplos:")
                for k in valores_rustico[:3]:
                    v = rustico[k]['valor']
                    print(f"      • {k}: {v:,.0f} €/ha")

            # Urbano
            urbano = muni_data['urbano']['valores']
            valores_urbano = [k for k, v in urbano.items()
                            if isinstance(v, dict) and v.get('coeficiente') is not None and v.get('coeficiente') > 0]
            print(f"  Urbano: {len(valores_urbano)} tipos con datos")

            if valores_urbano:
                print("    Ejemplos:")
                for k in valores_urbano[:3]:
                    v = urbano[k]['coeficiente']
                    print(f"      • {k}: {v:.2f}")

        print("\n" + "=" * 70)
        input("\nPresiona Enter para continuar...")

    def exportar_simplificado(self):
        """Exporta versión simplificada para el valorador"""
        print("\n" + "=" * 70)
        print("EXPORTAR FORMATO SIMPLIFICADO")
        print("=" * 70)

        simplificado = {
            "fuente": self.datos['fuente'],
            "municipios": {}
        }

        for muni_key, muni_data in self.datos['municipios'].items():
            # Extraer solo valores numéricos
            precios_rustico = {}
            for k, v in muni_data['rustico']['valores'].items():
                if isinstance(v, dict) and v.get('valor') is not None:
                    precios_rustico[k] = v['valor']

            coef_urbano = {}
            for k, v in muni_data['urbano']['valores'].items():
                if isinstance(v, dict) and v.get('coeficiente') is not None:
                    coef_urbano[k] = v['coeficiente']

            simplificado['municipios'][muni_key] = {
                "nombre": muni_data['nombre_oficial'],
                "provincia": muni_data['provincia'],
                "rustico": precios_rustico,
                "urbano": coef_urbano
            }

        output_simple = "data/valores_gva_2025_simplificado.json"
        with open(output_simple, 'w', encoding='utf-8') as f:
            json.dump(simplificado, f, indent=2, ensure_ascii=False)

        print(f"\n✅ Exportado a: {output_simple}")
        print("\nEste archivo puede usarse para importar valores al valorador")
        input("\nPresiona Enter para continuar...")

    def anadir_notas(self):
        """Añade notas generales"""
        print("\n" + "=" * 70)
        print("NOTAS Y OBSERVACIONES GENERALES")
        print("=" * 70)

        print("\nNotas actuales:")
        for nota in self.datos['notas'].get('observaciones', []):
            print(f"  • {nota}")

        print("\nAñadir nueva nota (Enter=omitir):")
        nota = input().strip()
        if nota:
            if 'observaciones' not in self.datos['notas']:
                self.datos['notas']['observaciones'] = []
            self.datos['notas']['observaciones'].append(nota)
            print("✓ Nota añadida")

    def run(self):
        """Ejecuta el extractor interactivo"""
        print("\n" + "=" * 70)
        print("EXTRACTOR DE DATOS PDF GVA 2025")
        print("=" * 70)
        print()
        print("Este script te ayudará a extraer y estructurar todos los datos")
        print("del PDF oficial de la Generalitat Valenciana.")
        print()
        print("Documento: NNTT_2025_Urbana y Rústica.pdf")
        print()

        if not self.cargar_template():
            return

        try:
            while True:
                opcion = self.mostrar_menu_principal()

                if opcion == "1":
                    self.introducir_datos_municipio("oliva", "Oliva")
                elif opcion == "2":
                    self.introducir_datos_municipio("planes", "Planes")
                elif opcion == "3":
                    self.introducir_datos_municipio("vall_de_gallinera", "Vall de Gallinera")
                elif opcion == "4":
                    self.ver_resumen()
                elif opcion == "5":
                    self.exportar_simplificado()
                elif opcion == "6":
                    self.anadir_notas()
                elif opcion == "0":
                    print("\n💾 Guardando datos...")
                    self.guardar_datos()
                    print("\n✅ Proceso completado")
                    break
                else:
                    print("\n❌ Opción no válida")

        except KeyboardInterrupt:
            print("\n\n⚠️  Proceso interrumpido")
            print("¿Deseas guardar los cambios? (s/n): ", end='')
            if input().strip().lower() == 's':
                self.guardar_datos()


if __name__ == "__main__":
    extractor = ExtractorDatosGVA()
    extractor.run()
