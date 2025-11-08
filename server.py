#!/usr/bin/env python3
"""
Servidor HTTP simple para servir el frontend
"""

import http.server
import socketserver
import os
from functools import partial

PORT = 8000
DIRECTORY = "/home/user/gestion-herencia"


class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Handler personalizado con CORS habilitado"""

    def end_headers(self):
        # Habilitar CORS
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def log_message(self, format, *args):
        """Personalizar mensajes de log"""
        print(f"[{self.log_date_time_string()}] {format % args}")


def main():
    """Inicia el servidor HTTP"""
    os.chdir(DIRECTORY)

    handler = partial(MyHTTPRequestHandler)

    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print("=" * 60)
        print("🚀 SERVIDOR HTTP INICIADO")
        print("=" * 60)
        print(f"\nServidor corriendo en: http://localhost:{PORT}")
        print(f"Directorio: {DIRECTORY}")
        print(f"\n📋 Accede al frontend en:")
        print(f"   http://localhost:{PORT}/frontend/")
        print(f"\n📄 Archivos JSON disponibles en:")
        print(f"   http://localhost:{PORT}/data/")
        print(f"\nPresiona Ctrl+C para detener el servidor\n")
        print("=" * 60)

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n⏹️  Servidor detenido")


if __name__ == "__main__":
    main()
