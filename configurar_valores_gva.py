#!/usr/bin/env python3
"""
Script para configurar valores oficiales de valoración
Basado en Normas Técnicas de Valoración 2025 - Generalitat Valenciana

Municipios: Oliva, Planes, Vall de Gallinera
"""

import json
import os


def configurar_valores_oficiales():
    """
    Configura los valores oficiales según el documento de la Generalitat
    """
    print("=" * 70)
    print("CONFIGURACIÓN DE VALORES OFICIALES DE VALORACIÓN 2025")
    print("=" * 70)
    print()
    print("Basado en: Normas Técnicas de Valoración - Generalitat Valenciana")
    print("Municipios: Oliva, Planes, Vall de Gallinera")
    print()
    print("Por favor, introduce los valores del documento oficial PDF:")
    print()

    # Valores rústicos por municipio
    valores_rusticos = {}

    municipios = ["Oliva", "Planes", "Vall de Gallinera"]

    for municipio in municipios:
        print(f"\n{'=' * 70}")
        print(f"MUNICIPIO: {municipio.upper()}")
        print(f"{'=' * 70}\n")

        print(f"SUELO RÚSTICO - {municipio}")
        print("-" * 70)

        cultivos = {
            "olivar_secano": "Olivar Secano",
            "olivar_regadio": "Olivar Regadío",
            "almendr_secano": "Almendro Secano",
            "almendr_regadio": "Almendro Regadío",
            "vina_secano": "Viña Secano",
            "vina_regadio": "Viña Regadío",
            "frutal_secano": "Frutal Secano",
            "frutal_regadio": "Frutal Regadío",
            "cereal_secano": "Cereal Secano",
            "cereal_regadio": "Cereal Regadío",
            "pastos": "Pastos",
            "forestal": "Forestal",
            "improductivo": "Improductivo"
        }

        valores_municipio = {}

        for key, nombre in cultivos.items():
            while True:
                try:
                    valor_str = input(f"  {nombre} (€/ha): ").strip()
                    if not valor_str:
                        print("    ⚠️  Valor vacío, usando 0")
                        valor = 0
                    else:
                        valor = float(valor_str.replace('.', '').replace(',', '.'))
                    valores_municipio[key] = valor
                    break
                except ValueError:
                    print("    ❌ Error: introduce un número válido")

        valores_rusticos[municipio.lower().replace(' ', '_')] = valores_municipio

    # Valores urbanos por municipio
    print(f"\n\n{'=' * 70}")
    print("SUELO URBANO - COEFICIENTES")
    print(f"{'=' * 70}\n")

    valores_urbanos = {}

    tipos_urbanos = {
        "vivienda": "Vivienda",
        "local": "Local Comercial",
        "oficina": "Oficina",
        "garaje": "Garaje",
        "trastero": "Trastero"
    }

    for municipio in municipios:
        print(f"\n{municipio}:")
        print("-" * 70)

        valores_municipio = {}

        for key, nombre in tipos_urbanos.items():
            while True:
                try:
                    valor_str = input(f"  {nombre} (coeficiente): ").strip()
                    if not valor_str:
                        print("    ⚠️  Valor vacío, usando 0.5")
                        valor = 0.5
                    else:
                        valor = float(valor_str.replace(',', '.'))
                    valores_municipio[key] = valor
                    break
                except ValueError:
                    print("    ❌ Error: introduce un número válido")

        valores_urbanos[municipio.lower().replace(' ', '_')] = valores_municipio

    # Crear configuración completa
    configuracion = {
        "fuente": "Normas Técnicas de Valoración 2025 - Generalitat Valenciana",
        "municipios": municipios,
        "fecha_configuracion": "2025",
        "PRECIOS_RUSTICO": valores_rusticos,
        "COEFICIENTES_URBANO": valores_urbanos
    }

    # Guardar en JSON
    archivo_salida = "config/valores_oficiales_gva_2025.json"
    os.makedirs("config", exist_ok=True)

    with open(archivo_salida, 'w', encoding='utf-8') as f:
        json.dump(configuracion, f, indent=2, ensure_ascii=False)

    print("\n\n" + "=" * 70)
    print("✅ CONFIGURACIÓN GUARDADA")
    print("=" * 70)
    print(f"\nArchivo: {archivo_salida}")

    # Mostrar resumen
    print("\n📊 RESUMEN DE CONFIGURACIÓN:")
    print()

    for municipio in municipios:
        muni_key = municipio.lower().replace(' ', '_')
        print(f"\n{municipio.upper()}:")
        print("-" * 70)

        print("\n  Rústico (€/ha):")
        for key, valor in valores_rusticos[muni_key].items():
            if valor > 0:
                nombre = cultivos.get(key, key)
                print(f"    {nombre:20s}: {valor:>10,.0f} €/ha")

        print("\n  Urbano (coeficientes):")
        for key, valor in valores_urbanos[muni_key].items():
            if valor > 0:
                nombre = tipos_urbanos.get(key, key)
                print(f"    {nombre:20s}: {valor:>10.2f}")

    print("\n" + "=" * 70)
    print("PRÓXIMOS PASOS:")
    print("=" * 70)
    print()
    print("1. Ejecuta: python aplicar_valores_oficiales_gva.py")
    print("   Para aplicar estos valores al valorador")
    print()
    print("2. Ejecuta: python valorador_inmuebles.py")
    print("   Para regenerar las valoraciones con los valores oficiales")
    print()

    return configuracion


if __name__ == "__main__":
    try:
        configurar_valores_oficiales()
    except KeyboardInterrupt:
        print("\n\n⏹️  Proceso interrumpido por el usuario")
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
