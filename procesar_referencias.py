#!/usr/bin/env python3
"""
Script para procesar un archivo de referencias catastrales y extraer sus datos
Uso: python procesar_referencias.py [archivo]
"""

import sys
import os
from catastro_scraper_service import CatastroScraperService

def main():
    """
    Lee un archivo con referencias catastrales y genera los datos
    """
    # Archivo por defecto
    archivo_referencias = "referencias.txt"

    # Si se pasa un archivo como argumento
    if len(sys.argv) > 1:
        archivo_referencias = sys.argv[1]

    print("=" * 60)
    print("PROCESADOR DE REFERENCIAS CATASTRALES")
    print("=" * 60)
    print(f"\nArchivo de entrada: {archivo_referencias}\n")

    # Verificar que existe el archivo
    if not os.path.exists(archivo_referencias):
        print(f"❌ ERROR: No se encontró el archivo '{archivo_referencias}'")
        print(f"\nCrea un archivo llamado '{archivo_referencias}' con este formato:")
        print("\n--- referencias.txt ---")
        print("03106A002000090000YL")
        print("03106A002000100000YM")
        print("03106A002000110000YN")
        print("--- fin del archivo ---")
        print("\nCada línea debe contener una referencia catastral.\n")
        return

    # Leer referencias del archivo
    print("📖 Leyendo referencias...")
    referencias = []

    with open(archivo_referencias, 'r', encoding='utf-8') as f:
        for linea in f:
            ref = linea.strip()
            # Ignorar líneas vacías y comentarios
            if ref and not ref.startswith('#'):
                referencias.append(ref)

    if not referencias:
        print("❌ ERROR: El archivo está vacío o no contiene referencias válidas")
        return

    print(f"✓ Encontradas {len(referencias)} referencias:\n")
    for i, ref in enumerate(referencias, 1):
        print(f"  {i}. {ref}")

    print("\n" + "=" * 60)
    print("EXTRAYENDO DATOS DEL CATASTRO")
    print("=" * 60)
    print("\n⚠️  NOTA IMPORTANTE:")
    print("El catastro bloquea el scraping automático (error 403).")
    print("Los datos generados son de EJEMPLO con la estructura real.")
    print("\nPara obtener datos reales:")
    print("1. Usa Selenium (ver selenium_scraper_example.py)")
    print("2. O consulta manualmente cada referencia en:")
    print("   https://www1.sedecatastro.gob.es/\n")

    input("Presiona ENTER para continuar...")

    # Crear servicio y procesar
    servicio = CatastroScraperService()

    resultados = servicio.procesar_multiples_referencias(
        referencias,
        guardar_individual=True,
        guardar_consolidado=True
    )

    # Generar resumen
    print("\n" + "=" * 60)
    print("GENERANDO RESUMEN")
    print("=" * 60)

    resumen = servicio.generar_resumen(referencias)
    archivo_resumen = os.path.join(servicio.data_dir, "resumen_propiedades.json")
    servicio._guardar_json(resumen, archivo_resumen)

    print(f"\n✓ Resumen guardado en: {archivo_resumen}")
    print(f"\nEstadísticas:")
    print(f"  - Total propiedades: {resumen['total_propiedades']}")
    print(f"  - Valor catastral total: {resumen['estadisticas']['valor_catastral_total']:,.2f} €")
    print(f"  - Superficie total: {resumen['estadisticas']['superficie_total_construida']:,.2f} m²")

    print("\n" + "=" * 60)
    print("✅ PROCESO COMPLETADO")
    print("=" * 60)
    print(f"\nArchivos generados:")
    print(f"  - Individuales: data/[referencia].json")
    print(f"  - Consolidado: data/datos_catastrales_consolidados.json")
    print(f"  - Resumen: data/resumen_propiedades.json")
    print(f"\nPróximos pasos:")
    print(f"  1. Inicia el servidor: python server.py")
    print(f"  2. Abre el navegador: http://localhost:8000/frontend/")
    print(f"  3. Haz clic en 'Cargar Datos de Ejemplo'\n")

if __name__ == "__main__":
    main()
