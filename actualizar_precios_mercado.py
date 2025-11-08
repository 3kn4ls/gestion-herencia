#!/usr/bin/env python3
"""
Script para actualizar precios de mercado a valores realistas 2025
"""

import re


def actualizar_precios():
    """
    Actualiza los precios en valorador_inmuebles.py con valores de mercado 2025
    """
    archivo = "valorador_inmuebles.py"

    print("=" * 60)
    print("ACTUALIZACIÓN DE PRECIOS DE MERCADO")
    print("=" * 60)
    print()
    print("📊 Actualizando precios a valores reales de mercado 2025...")
    print()

    try:
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()

        # Guardar backup
        with open(archivo + '.backup', 'w', encoding='utf-8') as f:
            f.write(contenido)
        print("✓ Backup creado: valorador_inmuebles.py.backup")

        # Reemplazos para Comunidad Valenciana
        reemplazos = [
            # Olivar
            (r'"olivar_secano":\s*13063', '"olivar_secano": 35000'),
            (r'"olivar_regadio":\s*25245', '"olivar_regadio": 65000'),

            # Almendro
            (r'"almendr_secano":\s*8000', '"almendr_secano": 20000'),
            (r'"almendr_regadio":\s*15000', '"almendr_regadio": 35000'),

            # Viña
            (r'"vina_secano":\s*10000', '"vina_secano": 25000'),
            (r'"vina_regadio":\s*20000', '"vina_regadio": 45000'),

            # Frutales
            (r'"frutal_secano":\s*12000', '"frutal_secano": 28000'),
            (r'"frutal_regadio":\s*28000', '"frutal_regadio": 55000'),

            # Cereal
            (r'"cereal_secano":\s*5000', '"cereal_secano": 8000'),
            (r'"cereal_regadio":\s*12000', '"cereal_regadio": 18000'),

            # Otros
            (r'"pastos":\s*3000', '"pastos": 5000'),
            (r'"forestal":\s*4000', '"forestal": 6000'),
            (r'"improductivo":\s*1000', '"improductivo": 2000'),

            # Default regional
            (r'"default":\s*5000\s+#\s*Por defecto', '"default": 10000              # Por defecto'),
        ]

        # Aplicar reemplazos
        contenido_actualizado = contenido
        cambios_realizados = 0

        for patron, reemplazo in reemplazos:
            if re.search(patron, contenido_actualizado):
                contenido_actualizado = re.sub(patron, reemplazo, contenido_actualizado)
                cambios_realizados += 1

        # Guardar archivo actualizado
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido_actualizado)

        print(f"✓ Realizados {cambios_realizados} cambios en {archivo}")
        print()

        # Mostrar resumen de cambios
        print("📊 RESUMEN DE CAMBIOS:")
        print()
        print("Comunidad Valenciana (Alicante, Valencia, Castellón):")
        print("-" * 60)
        print(f"  Olivar secano:      13,063 €/ha  →  35,000 €/ha  (+168%)")
        print(f"  Olivar regadío:     25,245 €/ha  →  65,000 €/ha  (+158%)")
        print(f"  Almendro secano:     8,000 €/ha  →  20,000 €/ha  (+150%)")
        print(f"  Almendro regadío:   15,000 €/ha  →  35,000 €/ha  (+133%)")
        print(f"  Viña secano:        10,000 €/ha  →  25,000 €/ha  (+150%)")
        print(f"  Viña regadío:       20,000 €/ha  →  45,000 €/ha  (+125%)")
        print(f"  Frutal secano:      12,000 €/ha  →  28,000 €/ha  (+133%)")
        print(f"  Frutal regadío:     28,000 €/ha  →  55,000 €/ha  (+96%)")
        print(f"  Cereal secano:       5,000 €/ha  →   8,000 €/ha  (+60%)")
        print(f"  Cereal regadío:     12,000 €/ha  →  18,000 €/ha  (+50%)")
        print(f"  Pastos:              3,000 €/ha  →   5,000 €/ha  (+67%)")
        print(f"  Forestal:            4,000 €/ha  →   6,000 €/ha  (+50%)")
        print(f"  Improductivo:        1,000 €/ha  →   2,000 €/ha  (+100%)")
        print()

        print("=" * 60)
        print("✅ ACTUALIZACIÓN COMPLETADA")
        print("=" * 60)
        print()
        print("Próximos pasos:")
        print("  1. Regenerar valoraciones:")
        print("     python valorador_inmuebles.py")
        print()
        print("  2. Consolidar con valores oficiales:")
        print("     python consolidar_valoraciones.py")
        print()
        print("  3. Visualizar resultados:")
        print("     python server.py")
        print()
        print("💡 Si los precios siguen siendo inadecuados, puedes:")
        print("   - Editar manualmente valorador_inmuebles.py (líneas 26-42)")
        print("   - Consultar actualizar_precios.md para más detalles")
        print("   - Restaurar backup: mv valorador_inmuebles.py.backup valorador_inmuebles.py")
        print()

    except FileNotFoundError:
        print(f"❌ Error: No se encontró el archivo {archivo}")
        print("   Asegúrate de ejecutar este script desde el directorio del proyecto")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    actualizar_precios()
