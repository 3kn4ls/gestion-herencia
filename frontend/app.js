/**
 * Gestor de Datos Catastrales - Frontend Application
 */

class CatastroApp {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.initializeEventListeners();
    }

    /**
     * Inicializa los event listeners
     */
    initializeEventListeners() {
        // Cargar archivo
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files[0]);
        });

        // Cargar datos de ejemplo
        document.getElementById('loadSampleData').addEventListener('click', () => {
            this.loadSampleData();
        });

        // Buscador
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Cerrar modal
        document.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });

        // Cerrar modal al hacer click fuera
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('detailModal');
            if (e.target === modal) {
                this.closeModal();
            }
        });
    }

    /**
     * Maneja la carga de archivos JSON
     */
    handleFileUpload(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.loadData(data);
            } catch (error) {
                alert('Error al leer el archivo JSON: ' + error.message);
            }
        };
        reader.readAsText(file);
    }

    /**
     * Carga datos de ejemplo
     */
    async loadSampleData() {
        try {
            // Intentar cargar el archivo consolidado
            const response = await fetch('../data/datos_catastrales_consolidados.json');

            if (!response.ok) {
                // Si no existe, crear datos de ejemplo
                this.loadData(this.generateSampleData());
                return;
            }

            const data = await response.json();
            this.loadData(data);
        } catch (error) {
            // Si hay error, cargar datos hardcodeados
            this.loadData(this.generateSampleData());
        }
    }

    /**
     * Genera datos de ejemplo para demostración
     */
    generateSampleData() {
        return [
            {
                "referencia_catastral": "03106A002000090000YL",
                "fecha_extraccion": new Date().toISOString(),
                "localizacion": {
                    "provincia": "Alicante",
                    "municipio": "Municipio 106",
                    "via": "CALLE EJEMPLO",
                    "numero": "1",
                    "escalera": "",
                    "planta": "01",
                    "puerta": "A",
                    "codigo_postal": "03000"
                },
                "datos_inmueble": {
                    "tipo": "Vivienda",
                    "clase": "Urbano",
                    "uso_principal": "Residencial",
                    "superficie_construida": 120.5,
                    "superficie_parcela": 0,
                    "ano_construccion": 1990,
                    "ano_reforma": null
                },
                "datos_catastrales": {
                    "valor_catastral": 85420.50,
                    "valor_suelo": 45230.25,
                    "valor_construccion": 40190.25,
                    "ano_valor": 2023
                },
                "coordenadas": {
                    "latitud": 38.3452,
                    "longitud": -0.4815,
                    "sistema": "ETRS89"
                }
            },
            {
                "referencia_catastral": "03106A002000100000YM",
                "fecha_extraccion": new Date().toISOString(),
                "localizacion": {
                    "provincia": "Alicante",
                    "municipio": "Municipio 106",
                    "via": "AVENIDA PRINCIPAL",
                    "numero": "15",
                    "escalera": "B",
                    "planta": "03",
                    "puerta": "B",
                    "codigo_postal": "03001"
                },
                "datos_inmueble": {
                    "tipo": "Vivienda",
                    "clase": "Urbano",
                    "uso_principal": "Residencial",
                    "superficie_construida": 95.0,
                    "superficie_parcela": 0,
                    "ano_construccion": 2005,
                    "ano_reforma": 2015
                },
                "datos_catastrales": {
                    "valor_catastral": 112350.75,
                    "valor_suelo": 62150.50,
                    "valor_construccion": 50200.25,
                    "ano_valor": 2023
                },
                "coordenadas": {
                    "latitud": 38.3465,
                    "longitud": -0.4825,
                    "sistema": "ETRS89"
                }
            }
        ];
    }

    /**
     * Carga y procesa los datos
     */
    loadData(data) {
        // Si es un objeto con propiedades, extraer el array
        if (data.propiedades) {
            this.data = data.propiedades;
        } else if (Array.isArray(data)) {
            this.data = data;
        } else {
            this.data = [data];
        }

        this.filteredData = [...this.data];
        this.updateUI();
    }

    /**
     * Actualiza toda la interfaz
     */
    updateUI() {
        this.showSections();
        this.updateSummary();
        this.renderProperties();
    }

    /**
     * Muestra las secciones ocultas
     */
    showSections() {
        document.getElementById('summarySection').classList.remove('hidden');
        document.getElementById('searchSection').classList.remove('hidden');
        document.getElementById('propertiesSection').classList.remove('hidden');
    }

    /**
     * Actualiza el resumen general
     */
    updateSummary() {
        const totalPropiedades = this.data.length;
        const valorTotal = this.data.reduce((sum, prop) => {
            return sum + (prop.datos_catastrales?.valor_catastral || 0);
        }, 0);
        const superficieTotal = this.data.reduce((sum, prop) => {
            return sum + (prop.datos_inmueble?.superficie_construida || 0);
        }, 0);

        document.getElementById('totalPropiedades').textContent = totalPropiedades;
        document.getElementById('valorTotal').textContent = this.formatCurrency(valorTotal);
        document.getElementById('superficieTotal').textContent = this.formatNumber(superficieTotal) + ' m²';

        // Fecha de última actualización
        const fechas = this.data
            .map(p => p.fecha_extraccion)
            .filter(f => f)
            .sort()
            .reverse();

        if (fechas.length > 0) {
            document.getElementById('fechaActualizacion').textContent =
                this.formatDate(fechas[0]);
        }
    }

    /**
     * Renderiza la lista de propiedades
     */
    renderProperties() {
        const container = document.getElementById('propertiesList');
        container.innerHTML = '';

        if (this.filteredData.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No se encontraron propiedades</p>';
            return;
        }

        this.filteredData.forEach(property => {
            const card = this.createPropertyCard(property);
            container.appendChild(card);
        });
    }

    /**
     * Crea una tarjeta de propiedad
     */
    createPropertyCard(property) {
        const card = document.createElement('div');
        card.className = 'property-card';
        card.onclick = () => this.showPropertyDetail(property);

        const direccion = this.formatDireccion(property.localizacion);
        const tipo = property.datos_inmueble?.tipo || 'N/A';
        const superficie = property.datos_inmueble?.superficie_construida || 0;
        const valor = property.datos_catastrales?.valor_catastral || 0;

        card.innerHTML = `
            <div class="property-header">
                <div>
                    <div class="property-ref">${property.referencia_catastral}</div>
                    <div style="margin-top: 0.5rem; color: var(--text-secondary);">${direccion}</div>
                </div>
                <div class="property-type">${tipo}</div>
            </div>
            <div class="property-details">
                <div class="detail-item">
                    <span class="detail-label">Superficie</span>
                    <span class="detail-value">${this.formatNumber(superficie)} m²</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Valor Catastral</span>
                    <span class="detail-value">${this.formatCurrency(valor)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Provincia</span>
                    <span class="detail-value">${property.localizacion?.provincia || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Año construcción</span>
                    <span class="detail-value">${property.datos_inmueble?.ano_construccion || 'N/A'}</span>
                </div>
            </div>
        `;

        return card;
    }

    /**
     * Muestra el detalle completo de una propiedad en un modal
     */
    showPropertyDetail(property) {
        const modal = document.getElementById('detailModal');
        const modalBody = document.getElementById('modalBody');

        const direccion = this.formatDireccion(property.localizacion);

        modalBody.innerHTML = `
            <h2>${property.referencia_catastral}</h2>
            <p style="color: var(--text-secondary); margin-bottom: 2rem;">${direccion}</p>

            <h3>📍 Localización</h3>
            <div class="modal-detail-grid">
                ${this.createDetailItem('Provincia', property.localizacion?.provincia)}
                ${this.createDetailItem('Municipio', property.localizacion?.municipio)}
                ${this.createDetailItem('Vía', property.localizacion?.via)}
                ${this.createDetailItem('Número', property.localizacion?.numero)}
                ${this.createDetailItem('Escalera', property.localizacion?.escalera || '-')}
                ${this.createDetailItem('Planta', property.localizacion?.planta || '-')}
                ${this.createDetailItem('Puerta', property.localizacion?.puerta || '-')}
                ${this.createDetailItem('Código Postal', property.localizacion?.codigo_postal)}
            </div>

            <h3>🏠 Datos del Inmueble</h3>
            <div class="modal-detail-grid">
                ${this.createDetailItem('Tipo', property.datos_inmueble?.tipo)}
                ${this.createDetailItem('Clase', property.datos_inmueble?.clase)}
                ${this.createDetailItem('Uso Principal', property.datos_inmueble?.uso_principal)}
                ${this.createDetailItem('Superficie Construida', this.formatNumber(property.datos_inmueble?.superficie_construida) + ' m²')}
                ${this.createDetailItem('Superficie Parcela', this.formatNumber(property.datos_inmueble?.superficie_parcela) + ' m²')}
                ${this.createDetailItem('Año Construcción', property.datos_inmueble?.ano_construccion)}
                ${this.createDetailItem('Año Reforma', property.datos_inmueble?.ano_reforma || 'N/A')}
            </div>

            <h3>💰 Datos Catastrales</h3>
            <div class="modal-detail-grid">
                ${this.createDetailItem('Valor Catastral', this.formatCurrency(property.datos_catastrales?.valor_catastral))}
                ${this.createDetailItem('Valor Suelo', this.formatCurrency(property.datos_catastrales?.valor_suelo))}
                ${this.createDetailItem('Valor Construcción', this.formatCurrency(property.datos_catastrales?.valor_construccion))}
                ${this.createDetailItem('Año Valor', property.datos_catastrales?.ano_valor)}
            </div>

            ${property.coordenadas ? `
                <h3>🗺️ Coordenadas</h3>
                <div class="modal-detail-grid">
                    ${this.createDetailItem('Latitud', property.coordenadas.latitud)}
                    ${this.createDetailItem('Longitud', property.coordenadas.longitud)}
                    ${this.createDetailItem('Sistema', property.coordenadas.sistema)}
                </div>
            ` : ''}

            <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--border-color); font-size: 0.85rem; color: var(--text-secondary);">
                Fecha de extracción: ${this.formatDate(property.fecha_extraccion)}
            </div>
        `;

        modal.style.display = 'block';
    }

    /**
     * Crea un item de detalle para el modal
     */
    createDetailItem(label, value) {
        return `
            <div class="modal-detail-item">
                <div class="modal-detail-label">${label}</div>
                <div class="modal-detail-value">${value || 'N/A'}</div>
            </div>
        `;
    }

    /**
     * Cierra el modal
     */
    closeModal() {
        document.getElementById('detailModal').style.display = 'none';
    }

    /**
     * Maneja la búsqueda
     */
    handleSearch(query) {
        const searchTerm = query.toLowerCase().trim();

        if (!searchTerm) {
            this.filteredData = [...this.data];
        } else {
            this.filteredData = this.data.filter(property => {
                const ref = property.referencia_catastral?.toLowerCase() || '';
                const provincia = property.localizacion?.provincia?.toLowerCase() || '';
                const municipio = property.localizacion?.municipio?.toLowerCase() || '';
                const via = property.localizacion?.via?.toLowerCase() || '';
                const tipo = property.datos_inmueble?.tipo?.toLowerCase() || '';

                return ref.includes(searchTerm) ||
                    provincia.includes(searchTerm) ||
                    municipio.includes(searchTerm) ||
                    via.includes(searchTerm) ||
                    tipo.includes(searchTerm);
            });
        }

        this.renderProperties();
    }

    /**
     * Formatea una dirección
     */
    formatDireccion(loc) {
        if (!loc) return 'Dirección no disponible';

        const partes = [
            loc.via,
            loc.numero,
            loc.escalera ? `Esc. ${loc.escalera}` : '',
            loc.planta ? `Planta ${loc.planta}` : '',
            loc.puerta ? `Puerta ${loc.puerta}` : ''
        ].filter(p => p);

        return partes.join(', ');
    }

    /**
     * Formatea un número
     */
    formatNumber(num) {
        if (num === null || num === undefined) return '0';
        return new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(num);
    }

    /**
     * Formatea una moneda
     */
    formatCurrency(num) {
        if (num === null || num === undefined) return '0 €';
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(num);
    }

    /**
     * Formatea una fecha
     */
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CatastroApp();
});
