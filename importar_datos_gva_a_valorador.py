#!/usr/bin/env python3
"""
Script para importar datos extraídos del PDF GVA al valorador

IMPORTANTE: Este script MODIFICA valorador_inmuebles.py
Solo ejecutar cuando los datos estén completos y verificados
"""

import json
import os
import shutil
from datetime import datetime


def importar_datos_gva():
    """
    Importa datos de valores_gva_2025.json al valorador
    """
    print("=" * 70)
    print("IMPORTAR DATOS GVA AL VALORADOR")
    print("=" * 70)
    print()
    print("⚠️  ADVERTENCIA: Este script modificará valorador_inmuebles.py")
    print()

    # Verificar que existen los datos
    datos_path = "data/valores_gva_2025.json"
    if not os.path.exists(datos_path):
        print(f"❌ No se encontró: {datos_path}")
        print()
        print("Ejecuta primero: python extraer_datos_pdf_gva.py")
        return

    # Cargar datos
    with open(datos_path, 'r', encoding='utf-8') as f:
        datos = json.load(f)

    print(f"✓ Datos cargados: {datos_path}")
    print(f"  Fuente: {datos['fuente']['documento']}")
    print(f"  Vigencia: {datos['fuente']['vigencia']['desde']} → {datos['fuente']['vigencia']['hasta']}")
    print()

    # Mostrar resumen
    print("📊 RESUMEN DE DATOS A IMPORTAR:")
    print()

    total_rustico = 0
    total_urbano = 0

    for muni_key, muni_data in datos['municipios'].items():
        nombre = muni_data['nombre_oficial']

        # Contar valores rústicos no nulos
        rustico_count = sum(1 for v in muni_data['rustico']['valores'].values()
                          if isinstance(v, dict) and v.get('valor') is not None and v.get('valor') > 0)

        # Contar coeficientes urbanos no nulos
        urbano_count = sum(1 for v in muni_data['urbano']['valores'].values()
                         if isinstance(v, dict) and v.get('coeficiente') is not None and v.get('coeficiente') > 0)

        print(f"  {nombre}:")
        print(f"    • Rústico: {rustico_count} cultivos")
        print(f"    • Urbano: {urbano_count} tipos")

        total_rustico += rustico_count
        total_urbano += urbano_count

    print()
    print(f"TOTAL: {total_rustico} valores rústicos, {total_urbano} coeficientes urbanos")
    print()

    # Confirmación
    print("¿Deseas continuar con la importación? (s/n): ", end='')
    if input().strip().lower() != 's':
        print("❌ Importación cancelada")
        return

    # Crear backup
    valorador_path = "valorador_inmuebles.py"
    if not os.path.exists(valorador_path):
        print(f"❌ No se encontró: {valorador_path}")
        return

    backup_path = f"{valorador_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    shutil.copy2(valorador_path, backup_path)
    print(f"✓ Backup creado: {backup_path}")

    # Leer valorador actual
    with open(valorador_path, 'r', encoding='utf-8') as f:
        contenido = f.read()

    # Preparar nuevos PRECIOS_RUSTICO
    nuevos_precios_rustico = {}

    for muni_key, muni_data in datos['municipios'].items():
        precios_muni = {}

        for cultivo_key, cultivo_data in muni_data['rustico']['valores'].items():
            if isinstance(cultivo_data, dict) and cultivo_data.get('valor') is not None:
                valor = cultivo_data['valor']
                if valor > 0:  # Solo incluir valores positivos
                    precios_muni[cultivo_key] = valor

        # Añadir default si no existe
        if 'default' not in precios_muni:
            # Usar media de valores existentes o valor fijo
            if precios_muni:
                precios_muni['default'] = int(sum(precios_muni.values()) / len(precios_muni))
            else:
                precios_muni['default'] = 10000

        nuevos_precios_rustico[muni_key] = precios_muni

    # Preparar nuevos COEFICIENTES_URBANO
    nuevos_coef_urbano = {}

    for muni_key, muni_data in datos['municipios'].items():
        coef_muni = {}

        for tipo_key, tipo_data in muni_data['urbano']['valores'].items():
            if isinstance(tipo_data, dict) and tipo_data.get('coeficiente') is not None:
                coef = tipo_data['coeficiente']
                if coef > 0:  # Solo incluir coeficientes positivos
                    coef_muni[tipo_key] = coef

        # Añadir default si no existe
        if 'default' not in coef_muni:
            coef_muni['default'] = 0.5

        nuevos_coef_urbano[muni_key] = coef_muni

    # Añadir valencia como fallback (usar valores de oliva)
    if 'oliva' in nuevos_precios_rustico:
        nuevos_precios_rustico['valencia'] = nuevos_precios_rustico['oliva'].copy()
        nuevos_coef_urbano['valencia'] = nuevos_coef_urbano['oliva'].copy()

    # Generar código Python para los diccionarios
    import pprint

    codigo_precios = "    PRECIOS_RUSTICO = " + pprint.pformat(nuevos_precios_rustico, indent=8, width=100)
    codigo_precios = codigo_precios.replace("'", '"')  # Usar comillas dobles

    codigo_coef = "    COEFICIENTES_URBANO = " + pprint.pformat(nuevos_coef_urbano, indent=8, width=100)
    codigo_coef = codigo_coef.replace("'", '"')  # Usar comillas dobles

    # Buscar y reemplazar PRECIOS_RUSTICO en el contenido
    import re

    # Buscar el bloque PRECIOS_RUSTICO = {...}
    patron_rustico = r'PRECIOS_RUSTICO\s*=\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}'
    if re.search(patron_rustico, contenido, re.DOTALL):
        contenido = re.sub(patron_rustico, codigo_precios.strip(), contenido, flags=re.DOTALL)
        print("✓ PRECIOS_RUSTICO actualizado")
    else:
        print("⚠️  No se pudo encontrar PRECIOS_RUSTICO en el archivo")

    # Buscar y reemplazar COEFICIENTES_URBANO
    patron_urbano = r'COEFICIENTES_URBANO\s*=\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}'
    if re.search(patron_urbano, contenido, re.DOTALL):
        contenido = re.sub(patron_urbano, codigo_coef.strip(), contenido, flags=re.DOTALL)
        print("✓ COEFICIENTES_URBANO actualizado")
    else:
        print("⚠️  No se pudo encontrar COEFICIENTES_URBANO en el archivo")

    # Añadir comentario con fuente de datos
    comentario_fuente = f'''
    # ============================================================================
    # VALORES OFICIALES GVA 2025
    # ============================================================================
    # Fuente: {datos['fuente']['documento']}
    # Organismo: {datos['fuente']['organismo']}
    # Vigencia: {datos['fuente']['vigencia']['desde']} → {datos['fuente']['vigencia']['hasta']}
    # Importado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
    # ============================================================================

'''

    # Insertar comentario antes de PRECIOS_RUSTICO
    contenido = contenido.replace(
        '    # Precios medios de terrenos rústicos',
        comentario_fuente + '    # Precios medios de terrenos rústicos'
    )

    # Guardar archivo actualizado
    with open(valorador_path, 'w', encoding='utf-8') as f:
        f.write(contenido)

    print(f"✓ Archivo actualizado: {valorador_path}")
    print()

    # Mostrar valores aplicados
    print("=" * 70)
    print("VALORES APLICADOS:")
    print("=" * 70)
    print()

    for muni_key in ['oliva', 'planes', 'vall_de_gallinera']:
        if muni_key in nuevos_precios_rustico:
            nombre = datos['municipios'][muni_key]['nombre_oficial']
            print(f"\n{nombre.upper()}:")
            print("-" * 70)

            print("\n  Rústico (€/ha) - Ejemplos:")
            precios = nuevos_precios_rustico[muni_key]
            for k, v in list(precios.items())[:5]:
                if k != 'default':
                    print(f"    {k:25s}: {v:>10,.0f} €/ha")

            print("\n  Urbano (coef) - Ejemplos:")
            coefs = nuevos_coef_urbano[muni_key]
            for k, v in list(coefs.items())[:5]:
                if k != 'default':
                    print(f"    {k:25s}: {v:>10.2f}")

    print("\n" + "=" * 70)
    print("✅ IMPORTACIÓN COMPLETADA")
    print("=" * 70)
    print()
    print("PRÓXIMOS PASOS:")
    print()
    print("1. Verificar cambios:")
    print(f"   diff {backup_path} {valorador_path}")
    print()
    print("2. Regenerar valoraciones:")
    print("   python valorador_inmuebles.py")
    print()
    print("3. Si algo falla, restaurar backup:")
    print(f"   cp {backup_path} {valorador_path}")
    print()


if __name__ == "__main__":
    try:
        importar_datos_gva()
    except KeyboardInterrupt:
        print("\n\n⚠️  Proceso interrumpido")
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
