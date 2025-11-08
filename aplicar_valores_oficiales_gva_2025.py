#!/usr/bin/env python3
"""
Aplica los valores oficiales GVA 2025 al valorador
Basado en el sistema de ámbitos territoriales de la Generalitat Valenciana
"""

import json
import os
import shutil
from datetime import datetime


def aplicar_valores_oficiales_gva():
    """
    Aplica los valores oficiales del JSON al valorador
    """
    print("=" * 70)
    print("APLICACIÓN DE VALORES OFICIALES GVA 2025")
    print("=" * 70)
    print()

    # Leer JSON con valores oficiales
    json_path = "data/valores_gva_2025_oficial.json"

    if not os.path.exists(json_path):
        print(f"❌ No se encontró: {json_path}")
        return

    with open(json_path, 'r', encoding='utf-8') as f:
        datos_gva = json.load(f)

    print(f"✓ Valores oficiales cargados: {json_path}")
    print(f"  Fuente: {datos_gva['fuente']['organismo']}")
    print(f"  Vigencia: {datos_gva['fuente']['vigencia']['desde']} → {datos_gva['fuente']['vigencia']['hasta']}")
    print()

    # Crear estructura de precios por ámbito territorial
    precios_rustico = {}

    # Ámbito 13: Safor-Litoral (Oliva, Piles)
    ambito_13 = datos_gva['municipios']['oliva']['rustico']['valores']
    precios_rustico['ambito_13_safor_litoral'] = {
        'olivar_secano': ambito_13['olivar_secano']['valor'],
        'olivar_regadio': ambito_13['olivar_regadio']['valor'],
        'almendro_secano': ambito_13['almendro_secano']['valor'],
        'almendro_regadio': ambito_13['almendro_regadio']['valor'],
        'vina_secano': ambito_13['vinedo_secano']['valor'],
        'vina_regadio': ambito_13['vinedo_regadio']['valor'],
        'frutal_secano': 0,  # No especificado
        'frutal_regadio': ambito_13['frutales_regadio']['valor'],
        'citricos_regadio': ambito_13['agrios_regadio']['valor'],
        'cereal_secano': 0,  # No especificado
        'cereal_regadio': 0,  # No especificado
        'horticola_regadio': ambito_13['horticolas_regadio']['valor'],
        'arroz_regadio': ambito_13['arroz_regadio']['valor'],
        'pastos': ambito_13['pastos']['valor'],
        'forestal': 0,  # No especificado
        'labor_secano': ambito_13['labor_secano']['valor'],
        'improductivo': ambito_13['improductivo']['valor'],
        'default': 10000
    }

    # Ámbito 17: Marina Alta-Interior (Vall de Gallinera)
    ambito_17 = datos_gva['municipios']['vall_de_gallinera']['rustico']['valores']
    precios_rustico['ambito_17_marina_alta_interior'] = {
        'olivar_secano': ambito_17['olivar_secano']['valor'],
        'olivar_regadio': ambito_17['olivar_regadio']['valor'],
        'almendro_secano': ambito_17['almendro_secano']['valor'],
        'almendro_regadio': ambito_17['almendro_regadio']['valor'],
        'vina_secano': ambito_17['vinedo_secano']['valor'],
        'vina_regadio': ambito_17['vinedo_regadio']['valor'],
        'frutal_secano': 0,  # No especificado
        'frutal_regadio': ambito_17['frutales_regadio']['valor'],
        'citricos_regadio': ambito_17['agrios_regadio']['valor'],
        'cereal_secano': 0,  # No especificado
        'cereal_regadio': 0,  # No especificado
        'horticola_regadio': ambito_17['horticolas_regadio']['valor'],
        'pastos': ambito_17['pastos']['valor'],
        'forestal': 0,  # No especificado
        'labor_secano': ambito_17['labor_secano']['valor'],
        'improductivo': ambito_17['improductivo']['valor'],
        'default': 10000
    }

    # Mantener valencia como fallback genérico (usar ámbito 13)
    precios_rustico['valencia'] = precios_rustico['ambito_13_safor_litoral'].copy()

    # Mantener otros fallbacks
    precios_rustico['nacional'] = {
        'olivar_secano': 18905,
        'olivar_regadio': 38027,
        'default': 10200
    }

    precios_rustico['default'] = {
        'olivar_secano': 18905,
        'olivar_regadio': 38027,
        'default': 10200
    }

    # Mostrar resumen
    print("📊 VALORES A APLICAR:")
    print()
    print("Ámbito 13: Safor-Litoral (Oliva, Piles)")
    print("-" * 70)
    print(f"  Olivar Secano:     {precios_rustico['ambito_13_safor_litoral']['olivar_secano']:>10,} €/ha")
    print(f"  Olivar Regadío:    {precios_rustico['ambito_13_safor_litoral']['olivar_regadio']:>10,} €/ha")
    print(f"  Almendro Secano:   {precios_rustico['ambito_13_safor_litoral']['almendro_secano']:>10,} €/ha")
    print(f"  Almendro Regadío:  {precios_rustico['ambito_13_safor_litoral']['almendro_regadio']:>10,} €/ha")
    print(f"  Agrios Regadío:    {precios_rustico['ambito_13_safor_litoral']['citricos_regadio']:>10,} €/ha")
    print()
    print("Ámbito 17: Marina Alta-Interior (Vall de Gallinera)")
    print("-" * 70)
    print(f"  Olivar Secano:     {precios_rustico['ambito_17_marina_alta_interior']['olivar_secano']:>10,} €/ha")
    print(f"  Olivar Regadío:    {precios_rustico['ambito_17_marina_alta_interior']['olivar_regadio']:>10,} €/ha")
    print(f"  Almendro Secano:   {precios_rustico['ambito_17_marina_alta_interior']['almendro_secano']:>10,} €/ha")
    print(f"  Almendro Regadío:  {precios_rustico['ambito_17_marina_alta_interior']['almendro_regadio']:>10,} €/ha")
    print(f"  Agrios Regadío:    {precios_rustico['ambito_17_marina_alta_interior']['citricos_regadio']:>10,} €/ha")
    print()

    # Confirmación
    print("¿Aplicar estos valores oficiales al valorador? (s/n): ", end='')
    if input().strip().lower() != 's':
        print("❌ Operación cancelada")
        return

    # Crear backup
    valorador_path = "valorador_inmuebles.py"
    if not os.path.exists(valorador_path):
        print(f"❌ No se encontró: {valorador_path}")
        return

    backup_path = f"{valorador_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    shutil.copy2(valorador_path, backup_path)
    print(f"✓ Backup creado: {backup_path}")

    # Leer archivo actual
    with open(valorador_path, 'r', encoding='utf-8') as f:
        contenido = f.read()

    # Generar nuevo código Python para PRECIOS_RUSTICO
    nuevo_precios = "    PRECIOS_RUSTICO = {\n"

    # Ámbito 13
    nuevo_precios += "        # Ámbito 13: Safor-Litoral (Oliva, Piles)\n"
    nuevo_precios += "        # Fuente: NNTT_2025 GVA - Anejo II\n"
    nuevo_precios += "        \"ambito_13_safor_litoral\": {\n"
    for key, valor in precios_rustico['ambito_13_safor_litoral'].items():
        nuevo_precios += f"            \"{key}\": {valor},\n"
    nuevo_precios += "        },\n\n"

    # Ámbito 17
    nuevo_precios += "        # Ámbito 17: Marina Alta-Interior (Vall de Gallinera)\n"
    nuevo_precios += "        # Fuente: NNTT_2025 GVA - Anejo II\n"
    nuevo_precios += "        \"ambito_17_marina_alta_interior\": {\n"
    for key, valor in precios_rustico['ambito_17_marina_alta_interior'].items():
        nuevo_precios += f"            \"{key}\": {valor},\n"
    nuevo_precios += "        },\n\n"

    # Valencia (fallback)
    nuevo_precios += "        # Comunidad Valenciana (fallback general - usa Ámbito 13)\n"
    nuevo_precios += "        \"valencia\": {\n"
    for key, valor in precios_rustico['valencia'].items():
        nuevo_precios += f"            \"{key}\": {valor},\n"
    nuevo_precios += "        },\n\n"

    # Nacional
    nuevo_precios += "        # Nacional (media España)\n"
    nuevo_precios += "        \"nacional\": {\n"
    for key, valor in precios_rustico['nacional'].items():
        nuevo_precios += f"            \"{key}\": {valor},\n"
    nuevo_precios += "        },\n\n"

    # Default
    nuevo_precios += "        # Default\n"
    nuevo_precios += "        \"default\": {\n"
    for key, valor in precios_rustico['default'].items():
        nuevo_precios += f"            \"{key}\": {valor},\n"
    nuevo_precios += "        }\n"

    nuevo_precios += "    }"

    # Reemplazar PRECIOS_RUSTICO
    import re
    patron_rustico = r'PRECIOS_RUSTICO\s*=\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}'

    if re.search(patron_rustico, contenido, re.DOTALL):
        contenido = re.sub(patron_rustico, nuevo_precios, contenido, flags=re.DOTALL)
        print("✓ PRECIOS_RUSTICO actualizado con valores oficiales GVA")
    else:
        print("⚠️  No se pudo encontrar PRECIOS_RUSTICO")
        return

    # Añadir comentario con fuente
    comentario_fuente = f'''
    # ============================================================================
    # VALORES OFICIALES GVA 2025 - SISTEMA DE ÁMBITOS TERRITORIALES
    # ============================================================================
    # Fuente: {datos_gva['fuente']['documento']}
    # Organismo: {datos_gva['fuente']['organismo']}
    # Vigencia: {datos_gva['fuente']['vigencia']['desde']} → {datos_gva['fuente']['vigencia']['hasta']}
    # Aplicado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
    #
    # Ámbitos Territoriales:
    # - Ámbito 13 (Safor-Litoral): Oliva, Piles
    # - Ámbito 17 (Marina Alta-Interior): Vall de Gallinera
    # ============================================================================

'''

    # Insertar comentario
    if '# Precios medios de terrenos rústicos' in contenido:
        contenido = contenido.replace(
            '    # Precios medios de terrenos rústicos',
            comentario_fuente + '    # Módulos de valor por ámbito territorial (€/hectárea)'
        )

    # Guardar archivo actualizado
    with open(valorador_path, 'w', encoding='utf-8') as f:
        f.write(contenido)

    print(f"✓ Archivo actualizado: {valorador_path}")
    print()

    print("=" * 70)
    print("✅ VALORES OFICIALES GVA APLICADOS")
    print("=" * 70)
    print()
    print("PRÓXIMOS PASOS:")
    print()
    print("1. Verificar que identificar_region() usa ámbitos territoriales")
    print("   El método debe identificar:")
    print("   - Oliva, Piles → ambito_13_safor_litoral")
    print("   - Vall de Gallinera → ambito_17_marina_alta_interior")
    print()
    print("2. Regenerar valoraciones:")
    print("   python valorador_inmuebles.py")
    print()
    print("3. Consolidar datos:")
    print("   python consolidar_valoraciones.py")
    print()
    print("4. Si algo falla, restaurar backup:")
    print(f"   cp {backup_path} {valorador_path}")
    print()


if __name__ == "__main__":
    try:
        aplicar_valores_oficiales_gva()
    except KeyboardInterrupt:
        print("\n\n⚠️  Proceso interrumpido")
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
