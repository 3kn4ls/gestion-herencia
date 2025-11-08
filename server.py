#!/usr/bin/env python3
"""
Servidor HTTP simple para servir el frontend
"""

import http.server
import socketserver
import os
import json
from functools import partial
from urllib.parse import urlparse

PORT = 8000
# Usar el directorio donde está ubicado este script (funciona en Windows, macOS y Linux)
DIRECTORY = os.path.dirname(os.path.abspath(__file__))


class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Handler personalizado con CORS habilitado y API para valoraciones"""

    def end_headers(self):
        # Habilitar CORS
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        """Manejar peticiones OPTIONS (CORS preflight)"""
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        """Manejar peticiones POST"""
        parsed_path = urlparse(self.path)

        # Endpoint de valoración
        if parsed_path.path == '/api/valorar':
            self.handle_valoracion()
        else:
            self.send_error(404, "Endpoint no encontrado")

    def handle_valoracion(self):
        """Maneja la valoración de propiedades"""
        try:
            # Leer el cuerpo de la petición
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            propiedades = json.loads(post_data.decode('utf-8'))

            # Importar el valorador
            import sys
            sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
            from valorador_inmuebles import ValoradorInmuebles

            # Crear valorador y valorar propiedades
            valorador = ValoradorInmuebles()
            resultado = valorador.valorar_multiples(propiedades)

            # Enviar respuesta
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(resultado, ensure_ascii=False).encode('utf-8'))

        except Exception as e:
            # Error al valorar
            self.send_response(500)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            error_response = {
                "error": str(e),
                "mensaje": "Error al valorar las propiedades"
            }
            self.wfile.write(json.dumps(error_response, ensure_ascii=False).encode('utf-8'))

    def log_message(self, format, *args):
        """Personalizar mensajes de log"""
        print(f"[{self.log_date_time_string()}] {format % args}")


def main():
    """Inicia el servidor HTTP"""
    # Cambiar al directorio del script
    os.chdir(DIRECTORY)

    # Verificar que los directorios existen
    frontend_exists = os.path.exists('frontend')
    data_exists = os.path.exists('data')

    handler = partial(MyHTTPRequestHandler)

    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print("=" * 60)
        print("🚀 SERVIDOR HTTP INICIADO")
        print("=" * 60)
        print(f"\nServidor corriendo en: http://localhost:{PORT}")
        print(f"Directorio: {os.getcwd()}")
        print(f"\nDirectorios encontrados:")
        print(f"  - frontend/: {'✓ SÍ' if frontend_exists else '✗ NO'}")
        print(f"  - data/: {'✓ SÍ' if data_exists else '✗ NO'}")

        if frontend_exists:
            print(f"\n📋 Accede al frontend en:")
            print(f"   http://localhost:{PORT}/frontend/")
            print(f"   http://localhost:{PORT}/frontend/index.html")
        else:
            print(f"\n⚠️  ADVERTENCIA: No se encontró el directorio 'frontend/'")

        if data_exists:
            print(f"\n📄 Archivos JSON disponibles en:")
            print(f"   http://localhost:{PORT}/data/")
        else:
            print(f"\n⚠️  ADVERTENCIA: No se encontró el directorio 'data/'")
            print(f"   Ejecuta: python catastro_scraper_service.py")

        print(f"\nPresiona Ctrl+C para detener el servidor\n")
        print("=" * 60)

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n⏹️  Servidor detenido")


if __name__ == "__main__":
    main()
