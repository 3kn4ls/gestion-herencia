#!/usr/bin/env python3
"""
Aplica los valores oficiales de la GVA al valorador
"""

import json
import os
import re


def aplicar_valores_gva():
    """
    Lee la configuración oficial y actualiza valorador_inmuebles.py
    """
    print("=" * 70)
    print("APLICACIÓN DE VALORES OFICIALES GVA 2025")
    print("=" * 70)
    print()

    # Leer configuración
    archivo_config = "config/valores_oficiales_gva_2025.json"

    if not os.path.exists(archivo_config):
        print(f"❌ No se encontró: {archivo_config}")
        print()
        print("Ejecuta primero: python configurar_valores_gva.py")
        return

    with open(archivo_config, 'r', encoding='utf-8') as f:
        config = json.load(f)

    print(f"✓ Configuración cargada: {archivo_config}")
    print(f"  Fuente: {config['fuente']}")
    print(f"  Municipios: {', '.join(config['municipios'])}")
    print()

    # Actualizar valorador_inmuebles.py
    archivo_valorador = "valorador_inmuebles.py"

    if not os.path.exists(archivo_valorador):
        print(f"❌ No se encontró: {archivo_valorador}")
        return

    # Crear backup
    with open(archivo_valorador, 'r', encoding='utf-8') as f:
        contenido_original = f.read()

    with open(archivo_valorador + '.backup', 'w', encoding='utf-8') as f:
        f.write(contenido_original)

    print(f"✓ Backup creado: {archivo_valorador}.backup")

    # Añadir soporte para múltiples municipios en el valorador
    # Buscar la clase CriteriosValoracion y añadir los valores por municipio

    nuevo_contenido = contenido_original

    # Insertar configuración de municipios antes de PRECIOS_RUSTICO
    municipios_config = f"""
    # Configuración de municipios con valores oficiales GVA 2025
    # Fuente: {config['fuente']}
    MUNICIPIOS_GVA = {json.dumps(config['municipios'], ensure_ascii=False)}

    # Mapeo de municipios a configuraciones específicas
    MAPEO_MUNICIPIOS = {{
"""

    for muni in config['municipios']:
        muni_key = muni.lower().replace(' ', '_')
        municipios_config += f"        '{muni.lower()}': '{muni_key}',\n"
        municipios_config += f"        '{muni_key}': '{muni_key}',\n"

    municipios_config += "    }\n"

    # Buscar donde insertar (antes de PRECIOS_RUSTICO)
    patron_precios = r'(\s+# Precios medios de terrenos rústicos)'
    if re.search(patron_precios, nuevo_contenido):
        nuevo_contenido = re.sub(
            patron_precios,
            municipios_config + r'\1',
            nuevo_contenido
        )
        print("✓ Configuración de municipios añadida")

    # Añadir valores para cada municipio
    # Crear diccionario con todos los municipios
    todos_precios_rustico = {}
    todos_coef_urbano = {}

    for muni in config['municipios']:
        muni_key = muni.lower().replace(' ', '_')
        todos_precios_rustico[muni_key] = config['PRECIOS_RUSTICO'][muni_key]
        todos_coef_urbano[muni_key] = config['COEFICIENTES_URBANO'][muni_key]

    # Mantener valencia como fallback
    todos_precios_rustico['valencia'] = config['PRECIOS_RUSTICO'].get(
        'oliva',
        list(config['PRECIOS_RUSTICO'].values())[0]
    )
    todos_coef_urbano['valencia'] = config['COEFICIENTES_URBANO'].get(
        'oliva',
        list(config['COEFICIENTES_URBANO'].values())[0]
    )

    # Actualizar PRECIOS_RUSTICO completo
    nuevo_precios_rustico = f"""    PRECIOS_RUSTICO = {json.dumps(todos_precios_rustico, indent=8, ensure_ascii=False)}"""

    # Reemplazar PRECIOS_RUSTICO
    patron_rustico = r'PRECIOS_RUSTICO\s*=\s*\{[^}]+\{[^}]+\}[^}]*\}'
    if re.search(patron_rustico, nuevo_contenido, re.DOTALL):
        nuevo_contenido = re.sub(
            patron_rustico,
            nuevo_precios_rustico,
            nuevo_contenido,
            flags=re.DOTALL
        )
        print("✓ PRECIOS_RUSTICO actualizado con valores GVA")

    # Actualizar COEFICIENTES_URBANO completo
    nuevo_coef_urbano = f"""    COEFICIENTES_URBANO = {json.dumps(todos_coef_urbano, indent=8, ensure_ascii=False)}"""

    # Reemplazar COEFICIENTES_URBANO
    patron_urbano = r'COEFICIENTES_URBANO\s*=\s*\{[^}]+\{[^}]+\}[^}]*\}'
    if re.search(patron_urbano, nuevo_contenido, re.DOTALL):
        nuevo_contenido = re.sub(
            patron_urbano,
            nuevo_coef_urbano,
            nuevo_contenido,
            flags=re.DOTALL
        )
        print("✓ COEFICIENTES_URBANO actualizado con valores GVA")

    # Actualizar método identificar_region para soportar municipios específicos
    nuevo_metodo_region = '''    def identificar_region(self, provincia: str, municipio: str = "") -> str:
        """
        Identifica la región para aplicar precios correctos
        Ahora soporta identificación por municipio específico

        Args:
            provincia: Nombre de la provincia
            municipio: Nombre del municipio (opcional, más preciso)

        Returns:
            Clave de región
        """
        # Primero intentar identificar por municipio
        if municipio:
            municipio_lower = municipio.lower()
            municipio_normalizado = municipio_lower.replace(' de ', ' ').replace('  ', ' ').strip()

            # Buscar en mapeo de municipios
            if hasattr(self, 'MAPEO_MUNICIPIOS'):
                if municipio_lower in self.MAPEO_MUNICIPIOS:
                    return self.MAPEO_MUNICIPIOS[municipio_lower]
                if municipio_normalizado in self.MAPEO_MUNICIPIOS:
                    return self.MAPEO_MUNICIPIOS[municipio_normalizado]

            # Búsqueda parcial
            for key in self.MAPEO_MUNICIPIOS.keys():
                if municipio_normalizado in key or key in municipio_normalizado:
                    return self.MAPEO_MUNICIPIOS[key]

        # Si no se encuentra municipio, usar provincia como antes
        provincia_lower = provincia.lower()

        if provincia_lower in ["alicante", "valencia", "castellon", "castellón"]:
            return "valencia"

        if provincia_lower in ["badajoz", "cáceres", "caceres"]:
            return "extremadura"

        # Por defecto usar precios nacionales
        return "nacional"'''

    # Reemplazar método identificar_region
    patron_metodo = r'def identificar_region\(self[^:]+:[^:]+\):[^}]+?return "nacional"'
    if re.search(patron_metodo, nuevo_contenido, re.DOTALL):
        nuevo_contenido = re.sub(
            patron_metodo,
            nuevo_metodo_region,
            nuevo_contenido,
            flags=re.DOTALL
        )
        print("✓ Método identificar_region actualizado para soportar municipios")

    # Guardar archivo actualizado
    with open(archivo_valorador, 'w', encoding='utf-8') as f:
        f.write(nuevo_contenido)

    print(f"✓ Archivo actualizado: {archivo_valorador}")
    print()

    # Mostrar resumen de valores aplicados
    print("=" * 70)
    print("VALORES APLICADOS:")
    print("=" * 70)
    print()

    for muni in config['municipios']:
        muni_key = muni.lower().replace(' ', '_')
        print(f"\n{muni.upper()}:")
        print("-" * 70)

        print("\n  Rústico (€/ha):")
        precios = config['PRECIOS_RUSTICO'][muni_key]
        for key, valor in precios.items():
            if valor > 0:
                nombre = key.replace('_', ' ').title()
                print(f"    {nombre:20s}: {valor:>10,.0f} €/ha")

        print("\n  Urbano (coeficientes):")
        coefs = config['COEFICIENTES_URBANO'][muni_key]
        for key, valor in coefs.items():
            if valor > 0:
                nombre = key.replace('_', ' ').title()
                print(f"    {nombre:20s}: {valor:>10.2f}")

    print("\n" + "=" * 70)
    print("✅ APLICACIÓN COMPLETADA")
    print("=" * 70)
    print()
    print("PRÓXIMOS PASOS:")
    print()
    print("1. Regenerar valoraciones:")
    print("   python valorador_inmuebles.py")
    print()
    print("2. Consolidar con valores oficiales:")
    print("   python consolidar_valoraciones.py")
    print()
    print("3. Visualizar:")
    print("   python server.py")
    print()


if __name__ == "__main__":
    aplicar_valores_gva()
