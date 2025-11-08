#!/usr/bin/env python3
"""
Consolida valoraciones calculadas con valores de referencia oficiales
"""

import json
import os
from datetime import datetime


def consolidar_valoraciones():
    """
    Combina las valoraciones calculadas con los valores de referencia oficiales
    """
    print("=" * 60)
    print("CONSOLIDACIÓN DE VALORACIONES")
    print("=" * 60)
    print()

    # Cargar datos catastrales
    archivo_datos = "data/datos_catastrales_consolidados.json"
    if not os.path.exists(archivo_datos):
        print(f"❌ No se encontró: {archivo_datos}")
        return

    with open(archivo_datos, 'r', encoding='utf-8') as f:
        datos_catastrales = json.load(f)

    print(f"✓ Cargados {len(datos_catastrales)} inmuebles")

    # Cargar valoraciones calculadas
    archivo_valoraciones = "data/valoraciones.json"
    valoraciones_calculadas = {}

    if os.path.exists(archivo_valoraciones):
        with open(archivo_valoraciones, 'r', encoding='utf-8') as f:
            data_val = json.load(f)
            for val in data_val.get("valoraciones", []):
                ref = val.get("referencia_catastral")
                if ref:
                    valoraciones_calculadas[ref] = val
        print(f"✓ Cargadas {len(valoraciones_calculadas)} valoraciones calculadas")
    else:
        print(f"⚠️  No se encontró: {archivo_valoraciones}")
        print("   Ejecuta: python valorador_inmuebles.py")

    # Cargar valores de referencia oficiales
    archivo_ref = "data/valores_referencia.json"
    valores_referencia = {}

    if os.path.exists(archivo_ref):
        with open(archivo_ref, 'r', encoding='utf-8') as f:
            data_ref = json.load(f)
            for ref_data in data_ref:
                ref = ref_data.get("referencia_catastral")
                if ref:
                    valores_referencia[ref] = ref_data
        print(f"✓ Cargados {len(valores_referencia)} valores de referencia oficiales")
    else:
        print(f"⚠️  No se encontró: {archivo_ref}")
        print("   Ejecuta: python extraer_valores_referencia.py")

    # Consolidar todo
    print("\n📊 Consolidando información...")

    consolidado = []

    for inmueble in datos_catastrales:
        ref = inmueble.get("referencia_catastral")

        # Crear registro consolidado
        registro = {
            **inmueble,  # Datos catastrales base
            "valoracion_calculada": valoraciones_calculadas.get(ref),
            "valor_referencia_oficial": valores_referencia.get(ref)
        }

        # Calcular diferencia si hay ambos valores
        if registro["valoracion_calculada"] and registro["valor_referencia_oficial"]:
            val_calc = registro["valoracion_calculada"].get("valor_estimado_euros", 0)
            val_ref = registro["valor_referencia_oficial"].get("valor_referencia", 0)

            if val_calc > 0 and val_ref > 0:
                diferencia = val_calc - val_ref
                diferencia_pct = (diferencia / val_ref) * 100

                registro["comparacion"] = {
                    "valor_calculado": val_calc,
                    "valor_oficial": val_ref,
                    "diferencia_euros": round(diferencia, 2),
                    "diferencia_porcentaje": round(diferencia_pct, 2),
                    "mayor": "calculado" if val_calc > val_ref else "oficial" if val_ref > val_calc else "igual"
                }

        consolidado.append(registro)

    # Guardar consolidado
    archivo_salida = "data/datos_catastrales_consolidados_completo.json"
    with open(archivo_salida, 'w', encoding='utf-8') as f:
        json.dump(consolidado, f, indent=2, ensure_ascii=False)

    print(f"✓ Datos consolidados guardados en: {archivo_salida}")

    # Crear resumen
    resumen = {
        "fecha_consolidacion": datetime.now().isoformat(),
        "total_inmuebles": len(consolidado),
        "con_valoracion_calculada": sum(1 for r in consolidado if r.get("valoracion_calculada")),
        "con_valor_referencia": sum(1 for r in consolidado if r.get("valor_referencia_oficial")),
        "con_comparacion": sum(1 for r in consolidado if r.get("comparacion")),
        "estadisticas": {}
    }

    # Calcular estadísticas de comparación
    if any(r.get("comparacion") for r in consolidado):
        comparaciones = [r["comparacion"] for r in consolidado if r.get("comparacion")]

        total_val_calc = sum(c["valor_calculado"] for c in comparaciones)
        total_val_ref = sum(c["valor_oficial"] for c in comparaciones)
        diferencias = [c["diferencia_porcentaje"] for c in comparaciones]

        resumen["estadisticas"] = {
            "suma_valoraciones_calculadas": round(total_val_calc, 2),
            "suma_valores_referencia": round(total_val_ref, 2),
            "diferencia_total_euros": round(total_val_calc - total_val_ref, 2),
            "diferencia_media_porcentaje": round(sum(diferencias) / len(diferencias), 2),
            "diferencia_minima_porcentaje": round(min(diferencias), 2),
            "diferencia_maxima_porcentaje": round(max(diferencias), 2)
        }

    # Guardar resumen
    archivo_resumen = "data/resumen_consolidado.json"
    with open(archivo_resumen, 'w', encoding='utf-8') as f:
        json.dump(resumen, f, indent=2, ensure_ascii=False)

    print(f"✓ Resumen guardado en: {archivo_resumen}")

    # Mostrar resumen en pantalla
    print("\n" + "=" * 60)
    print("RESUMEN DE CONSOLIDACIÓN")
    print("=" * 60)
    print(f"\nTotal inmuebles: {resumen['total_inmuebles']}")
    print(f"Con valoración calculada: {resumen['con_valoracion_calculada']}")
    print(f"Con valor de referencia oficial: {resumen['con_valor_referencia']}")
    print(f"Con comparación: {resumen['con_comparacion']}")

    if resumen["estadisticas"]:
        print("\n📊 COMPARACIÓN DE VALORES:")
        stats = resumen["estadisticas"]
        print(f"  Suma valoraciones calculadas: {stats['suma_valoraciones_calculadas']:,.2f} €")
        print(f"  Suma valores de referencia:   {stats['suma_valores_referencia']:,.2f} €")
        print(f"  Diferencia total:             {stats['diferencia_total_euros']:,.2f} €")
        print(f"\n  Diferencia media:             {stats['diferencia_media_porcentaje']:+.2f}%")
        print(f"  Diferencia mínima:            {stats['diferencia_minima_porcentaje']:+.2f}%")
        print(f"  Diferencia máxima:            {stats['diferencia_maxima_porcentaje']:+.2f}%")

    # Mostrar detalle por inmueble
    print("\n" + "=" * 60)
    print("DETALLE POR INMUEBLE")
    print("=" * 60)

    for registro in consolidado:
        ref = registro.get("referencia_catastral")
        print(f"\n📋 {ref}")

        if registro.get("valoracion_calculada"):
            val_calc = registro["valoracion_calculada"].get("valor_estimado_euros", 0)
            print(f"   💰 Valoración calculada: {val_calc:,.2f} €")

        if registro.get("valor_referencia_oficial"):
            val_ref = registro["valor_referencia_oficial"].get("valor_referencia", 0)
            print(f"   📊 Valor referencia oficial: {val_ref:,.2f} €")

        if registro.get("comparacion"):
            comp = registro["comparacion"]
            print(f"   📈 Diferencia: {comp['diferencia_euros']:+,.2f} € ({comp['diferencia_porcentaje']:+.2f}%)")
            if comp["mayor"] == "calculado":
                print(f"      → Valoración calculada es {abs(comp['diferencia_porcentaje']):.2f}% mayor")
            elif comp["mayor"] == "oficial":
                print(f"      → Valor oficial es {abs(comp['diferencia_porcentaje']):.2f}% mayor")
            else:
                print(f"      → Valores son iguales")

    print("\n" + "=" * 60)
    print("✅ CONSOLIDACIÓN COMPLETADA")
    print("=" * 60)
    print()


if __name__ == "__main__":
    consolidar_valoraciones()
