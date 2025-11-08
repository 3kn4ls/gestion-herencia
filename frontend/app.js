/**
 * Gestor de Datos Catastrales - Frontend Application
 * Versión actualizada para datos reales del catastro
 */

class CatastroApp {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.valoraciones = null;
        this.filters = {
            clase: 'all',
            provincia: 'all',
            municipio: 'all',
            uso: 'all'
        };
        this.initializeEventListeners();
    }

    /**
     * Normaliza los datos para trabajar con ambos formatos
     */
    normalizeProperty(prop) {
        // Si tiene datos_descriptivos, es formato nuevo
        if (prop.datos_descriptivos) {
            const loc = prop.datos_descriptivos.localizacion || {};
            const parcela = prop.parcela_catastral || {};

            // Extraer superficie de diferentes formatos
            let superficie = 0;
            if (parcela.superficie_gráfica) {
                // Formato: "1.197 m2" o "1.197 m²"
                const match = parcela.superficie_gráfica.match(/[\d.,]+/);
                if (match) {
                    superficie = parseFloat(match[0].replace('.', '').replace(',', '.'));
                }
            }

            return {
                referencia_catastral: prop.referencia_catastral,
                fecha_extraccion: prop.fecha_extraccion,
                url_consultada: prop.url_consultada,

                // Localización normalizada
                localizacion: {
                    provincia: loc.provincia || '',
                    municipio: loc.municipio || '',
                    partida: loc.partida || '',
                    poligono: loc.poligono || '',
                    parcela: loc.parcela || '',
                    texto_completo: loc.texto_completo || ''
                },

                // Datos del inmueble normalizados
                datos_inmueble: {
                    clase: prop.datos_descriptivos.clase || '',
                    uso_principal: prop.datos_descriptivos.uso_principal || '',
                    superficie_construida: superficie
                },

                // Parcela catastral
                parcela_catastral: prop.parcela_catastral || {},

                // Cultivos
                cultivos: prop.cultivos || [],

                // Datos originales
                _original: prop
            };
        }

        // Formato antiguo (datos de ejemplo)
        return {
            ...prop,
            localizacion: prop.localizacion || {},
            datos_inmueble: prop.datos_inmueble || {},
            datos_catastrales: prop.datos_catastrales || {},
            cultivos: [],
            _original: prop
        };
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

        // Botón valorar propiedades
        document.getElementById('btnValorar')?.addEventListener('click', () => {
            this.valorarPropiedades();
        });

        // Buscador general
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Filtros específicos
        document.getElementById('filterClase')?.addEventListener('change', (e) => {
            this.filters.clase = e.target.value;
            this.applyFilters();
        });

        document.getElementById('filterProvincia')?.addEventListener('change', (e) => {
            this.filters.provincia = e.target.value;
            this.applyFilters();
        });

        document.getElementById('filterMunicipio')?.addEventListener('change', (e) => {
            this.filters.municipio = e.target.value;
            this.applyFilters();
        });

        document.getElementById('filterUso')?.addEventListener('change', (e) => {
            this.filters.uso = e.target.value;
            this.applyFilters();
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
            // Intentar cargar datos consolidados completos primero
            let response = await fetch('../data/datos_catastrales_consolidados_completo.json');

            if (!response.ok) {
                // Si no existe, cargar los datos normales
                response = await fetch('../data/datos_catastrales_consolidados.json');
            }

            if (!response.ok) throw new Error('No se encontró el archivo');

            const data = await response.json();
            this.loadData(data);
        } catch (error) {
            alert('No se pudieron cargar los datos. Asegúrate de haber ejecutado el extractor primero.');
            console.error(error);
        }
    }

    /**
     * Intenta cargar datos automáticamente al iniciar
     */
    async autoLoadData() {
        try {
            // Intentar cargar archivo consolidado completo silenciosamente
            const response = await fetch('../data/datos_catastrales_consolidados_completo.json');

            if (response.ok) {
                const data = await response.json();
                this.loadData(data);
                console.log('✓ Datos cargados automáticamente');
                return;
            }

            // Si no existe el completo, intentar con el normal
            const response2 = await fetch('../data/datos_catastrales_consolidados.json');
            if (response2.ok) {
                const data = await response2.json();
                this.loadData(data);
                console.log('✓ Datos cargados automáticamente (archivo básico)');
            }
        } catch (error) {
            // Fallo silencioso - no hay datos que cargar
            console.log('ℹ️  No hay datos para cargar automáticamente');
        }
    }

    /**
     * Carga y procesa los datos
     */
    async loadData(data) {
        // Si es un objeto con propiedades, extraer el array
        if (data.propiedades) {
            this.data = data.propiedades;
        } else if (Array.isArray(data)) {
            this.data = data;
        } else {
            this.data = [data];
        }

        // Normalizar todos los datos
        this.data = this.data.map(p => this.normalizeProperty(p));

        this.filteredData = [...this.data];
        this.valoraciones = null; // Reset valoraciones al cargar nuevos datos

        // Verificar si hay valoraciones incorporadas en los datos
        this.checkEmbeddedValuations();

        // Valorar automáticamente si no hay valoraciones incorporadas
        if (!this.valoraciones) {
            console.log('ℹ️  Valorando propiedades automáticamente...');
            await this.valorarPropiedades(true); // true = silencioso (sin alert)
        }

        // Actualizar UI DESPUÉS de que se completen las valoraciones
        this.updateUI();
        this.buildFilters();
    }

    /**
     * Verifica si los datos tienen valoraciones incorporadas
     */
    checkEmbeddedValuations() {
        // Buscar si algún registro tiene valoración_calculada
        const conValoraciones = this.data.some(p =>
            p._original?.valoracion_calculada
        );

        if (conValoraciones) {
            // Crear objeto de valoraciones a partir de los datos incorporados
            const valoraciones = this.data
                .filter(p => p._original?.valoracion_calculada)
                .map(p => p._original.valoracion_calculada);

            if (valoraciones.length > 0) {
                const valorTotal = valoraciones.reduce((sum, v) =>
                    sum + (v.valor_estimado_euros || 0), 0
                );

                this.valoraciones = {
                    resumen: {
                        total_propiedades: valoraciones.length,
                        valor_total_estimado: valorTotal,
                        fecha_valoracion: new Date().toISOString()
                    },
                    valoraciones: valoraciones
                };

                console.log('✓ Valoraciones incorporadas detectadas');
            }
        }
    }

    /**
     * Valora las propiedades usando la API del backend
     */
    async valorarPropiedades(silent = false) {
        if (!this.data || this.data.length === 0) {
            if (!silent) alert('No hay propiedades cargadas para valorar');
            return;
        }

        const btnValorar = document.getElementById('btnValorar');
        const originalText = btnValorar.textContent;

        try {
            if (!silent) {
                btnValorar.textContent = '⏳ Valorando...';
                btnValorar.disabled = true;
            }

            // Enviar datos originales (sin normalización) a la API
            const propiedadesOriginales = this.data.map(p => p._original || p);

            const response = await fetch('/api/valorar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(propiedadesOriginales)
            });

            if (!response.ok) {
                throw new Error('Error al valorar las propiedades');
            }

            this.valoraciones = await response.json();
            console.log('Valoraciones recibidas:', this.valoraciones);

            // Actualizar UI con las valoraciones
            this.updateUI();

            if (!silent) {
                alert(`✅ Valoración completada\n\nValor total estimado: ${this.formatCurrency(this.valoraciones.resumen.valor_total_estimado)}`);
            } else {
                console.log('✅ Valoración automática completada:', this.formatCurrency(this.valoraciones.resumen.valor_total_estimado));
            }

        } catch (error) {
            console.error('Error:', error);
            if (!silent) alert('Error al valorar las propiedades. Asegúrate de que el servidor está corriendo.');
        } finally {
            if (!silent) {
                btnValorar.textContent = originalText;
                btnValorar.disabled = false;
            }
        }
    }

    /**
     * Construye los filtros dinámicamente basados en los datos
     */
    buildFilters() {
        const clases = new Set();
        const provincias = new Set();
        const municipios = new Set();
        const usos = new Set();

        this.data.forEach(prop => {
            if (prop.datos_inmueble?.clase) clases.add(prop.datos_inmueble.clase);
            if (prop.localizacion?.provincia) provincias.add(prop.localizacion.provincia);
            if (prop.localizacion?.municipio) municipios.add(prop.localizacion.municipio);
            if (prop.datos_inmueble?.uso_principal) usos.add(prop.datos_inmueble.uso_principal);
        });

        this.updateFilterSelect('filterClase', clases);
        this.updateFilterSelect('filterProvincia', provincias);
        this.updateFilterSelect('filterMunicipio', municipios);
        this.updateFilterSelect('filterUso', usos);
    }

    /**
     * Actualiza un select de filtro
     */
    updateFilterSelect(id, values) {
        const select = document.getElementById(id);
        if (!select) return;

        // Mantener la opción "Todos"
        select.innerHTML = '<option value="all">Todos</option>';

        // Añadir opciones únicas ordenadas
        Array.from(values)
            .sort()
            .forEach(value => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = value;
                select.appendChild(option);
            });
    }

    /**
     * Aplica los filtros activos
     */
    applyFilters() {
        this.filteredData = this.data.filter(prop => {
            // Filtro por clase
            if (this.filters.clase !== 'all' && prop.datos_inmueble?.clase !== this.filters.clase) {
                return false;
            }

            // Filtro por provincia
            if (this.filters.provincia !== 'all' && prop.localizacion?.provincia !== this.filters.provincia) {
                return false;
            }

            // Filtro por municipio
            if (this.filters.municipio !== 'all' && prop.localizacion?.municipio !== this.filters.municipio) {
                return false;
            }

            // Filtro por uso
            if (this.filters.uso !== 'all' && prop.datos_inmueble?.uso_principal !== this.filters.uso) {
                return false;
            }

            return true;
        });

        this.renderProperties();
        this.updateFilteredCount();
    }

    /**
     * Actualiza el contador de resultados filtrados
     */
    updateFilteredCount() {
        const total = this.data.length;
        const filtered = this.filteredData.length;

        const countElement = document.getElementById('filteredCount');
        if (countElement) {
            countElement.textContent = filtered === total
                ? `Mostrando ${total} propiedades`
                : `Mostrando ${filtered} de ${total} propiedades`;
        }
    }

    /**
     * Actualiza toda la interfaz
     */
    updateUI() {
        this.showSections();
        this.updateSummary();
        this.renderProperties();
        this.updateFilteredCount();
    }

    /**
     * Muestra las secciones ocultas
     */
    showSections() {
        document.getElementById('summarySection').classList.remove('hidden');
        document.getElementById('filtersSection')?.classList.remove('hidden');
        document.getElementById('searchSection').classList.remove('hidden');
        document.getElementById('propertiesSection').classList.remove('hidden');
    }

    /**
     * Actualiza el resumen general
     */
    updateSummary() {
        const totalPropiedades = this.data.length;

        // Superficie total
        const superficieTotal = this.data.reduce((sum, prop) => {
            return sum + (prop.datos_inmueble?.superficie_construida || 0);
        }, 0);

        // Contar por clase
        const claseCounts = {};
        this.data.forEach(prop => {
            const clase = prop.datos_inmueble?.clase || 'Sin clase';
            claseCounts[clase] = (claseCounts[clase] || 0) + 1;
        });

        document.getElementById('totalPropiedades').textContent = totalPropiedades;
        document.getElementById('superficieTotal').textContent = this.formatNumber(superficieTotal) + ' m²';

        // Mostrar distribución por clase o valor total si hay valoraciones
        if (this.valoraciones && this.valoraciones.resumen) {
            const valorTotal = this.formatCurrency(this.valoraciones.resumen.valor_total_estimado);
            document.getElementById('distribucionClase').innerHTML = `<strong>${valorTotal}</strong>`;
            document.getElementById('distribucionClase').parentElement.querySelector('.stat-label').textContent = 'Valor Estimado Total';
        } else {
            const claseText = Object.entries(claseCounts)
                .map(([clase, count]) => `${clase}: ${count}`)
                .join(', ');
            document.getElementById('distribucionClase').textContent = claseText;
            document.getElementById('distribucionClase').parentElement.querySelector('.stat-label').textContent = 'Distribución';
        }

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
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">No se encontraron propiedades con los filtros seleccionados</p>';
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

        const loc = property.localizacion || {};
        const inmueble = property.datos_inmueble || {};

        const direccion = loc.texto_completo ||
            `${loc.partida || ''} ${loc.municipio || ''} (${loc.provincia || ''})`.trim() ||
            'Dirección no disponible';

        const clase = inmueble.clase || 'N/A';
        const uso = inmueble.uso_principal || 'N/A';
        const superficie = inmueble.superficie_construida || 0;

        // Buscar valoración y valor de referencia
        let valoracionHTML = '';

        // Valor calculado
        const valorCalculado = this.valoraciones?.valoraciones?.find(
            v => v.referencia_catastral === property.referencia_catastral
        )?.valor_estimado_euros;

        // Valor de referencia oficial
        const valorRefOficial = property._original?.valor_referencia_oficial?.valor_referencia;

        // Comparación
        const comparacion = property._original?.comparacion;

        if (valorCalculado || valorRefOficial) {
            valoracionHTML = '<div style="grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.5rem;">';

            if (valorCalculado) {
                valoracionHTML += `
                    <div style="background: var(--success-bg); padding: 0.5rem; border-radius: 4px; text-align: center;">
                        <div style="font-size: 0.75rem; color: var(--success);">💰 Valor Calculado</div>
                        <div style="font-weight: bold; color: var(--success);">${this.formatCurrency(valorCalculado)}</div>
                    </div>
                `;
            }

            if (valorRefOficial) {
                valoracionHTML += `
                    <div style="background: #e0f2fe; padding: 0.5rem; border-radius: 4px; text-align: center;">
                        <div style="font-size: 0.75rem; color: #0369a1;">📊 Valor Oficial</div>
                        <div style="font-weight: bold; color: #0369a1;">${this.formatCurrency(valorRefOficial)}</div>
                    </div>
                `;
            }

            valoracionHTML += '</div>';

            // Mostrar diferencia si existe comparación
            if (comparacion) {
                const colorDif = comparacion.diferencia_euros >= 0 ? 'var(--success)' : 'var(--danger-color)';
                const signo = comparacion.diferencia_euros >= 0 ? '+' : '';
                valoracionHTML += `
                    <div style="grid-column: 1 / -1; text-align: center; font-size: 0.8rem; color: ${colorDif}; margin-top: 0.25rem;">
                        Diferencia: ${signo}${this.formatCurrency(comparacion.diferencia_euros)} (${signo}${comparacion.diferencia_porcentaje.toFixed(1)}%)
                    </div>
                `;
            }
        }

        card.innerHTML = `
            <div class="property-header">
                <div>
                    <div class="property-ref">${property.referencia_catastral}</div>
                    <div style="margin-top: 0.5rem; color: var(--text-secondary); font-size: 0.9rem;">${direccion}</div>
                </div>
                <div class="property-type">${clase}</div>
            </div>
            <div class="property-details">
                <div class="detail-item">
                    <span class="detail-label">Uso</span>
                    <span class="detail-value">${uso}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Superficie</span>
                    <span class="detail-value">${this.formatNumber(superficie)} m²</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Provincia</span>
                    <span class="detail-value">${loc.provincia || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Municipio</span>
                    <span class="detail-value">${loc.municipio || 'N/A'}</span>
                </div>
                ${valoracionHTML}
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

        const loc = property.localizacion || {};
        const inmueble = property.datos_inmueble || {};
        const parcela = property.parcela_catastral || {};

        const direccion = loc.texto_completo || `${loc.municipio || ''} (${loc.provincia || ''})`;

        let html = `
            <h2>${property.referencia_catastral}</h2>
            <p style="color: var(--text-secondary); margin-bottom: 2rem;">${direccion}</p>

            <h3>📍 Localización</h3>
            <div class="modal-detail-grid">
                ${this.createDetailItem('Provincia', loc.provincia)}
                ${this.createDetailItem('Municipio', loc.municipio)}
                ${loc.partida ? this.createDetailItem('Partida', loc.partida) : ''}
                ${loc.poligono ? this.createDetailItem('Polígono', loc.poligono) : ''}
                ${loc.parcela ? this.createDetailItem('Parcela', loc.parcela) : ''}
            </div>

            <h3>🏠 Datos del Inmueble</h3>
            <div class="modal-detail-grid">
                ${this.createDetailItem('Clase', inmueble.clase)}
                ${this.createDetailItem('Uso Principal', inmueble.uso_principal)}
                ${inmueble.superficie_construida ? this.createDetailItem('Superficie', this.formatNumber(inmueble.superficie_construida) + ' m²') : ''}
            </div>
        `;

        // Parcela catastral (si existe)
        if (Object.keys(parcela).length > 0) {
            html += `
                <h3>🗺️ Parcela Catastral</h3>
                <div class="modal-detail-grid">
                    ${Object.entries(parcela).map(([key, value]) =>
                        this.createDetailItem(this.formatLabel(key), value)
                    ).join('')}
                </div>
            `;
        }

        // Cultivos (si existen)
        if (property.cultivos && property.cultivos.length > 0) {
            html += `
                <h3>🌾 Cultivos</h3>
                <div class="table-responsive" style="margin-top: 1rem;">
                    <table class="cultivos-table">
                        <thead>
                            <tr>
                                <th>Subparcela</th>
                                <th>Cultivo/Aprovechamiento</th>
                                <th>Intensidad</th>
                                <th>Superficie (m²)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${property.cultivos.map(c => `
                                <tr>
                                    <td>${c.subparcela}</td>
                                    <td>${c.cultivo_aprovechamiento}</td>
                                    <td>${c.intensidad_productiva}</td>
                                    <td>${c.superficie_m2}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        // Datos catastrales (formato antiguo)
        const catastrales = property.datos_catastrales || property._original?.datos_catastrales;
        if (catastrales) {
            html += `
                <h3>💰 Datos Catastrales</h3>
                <div class="modal-detail-grid">
                    ${this.createDetailItem('Valor Catastral', this.formatCurrency(catastrales.valor_catastral))}
                    ${this.createDetailItem('Valor Suelo', this.formatCurrency(catastrales.valor_suelo))}
                    ${this.createDetailItem('Valor Construcción', this.formatCurrency(catastrales.valor_construccion))}
                </div>
            `;
        }

        // Valoración calculada y valor de referencia oficial
        const valoracion = this.valoraciones?.valoraciones?.find(
            v => v.referencia_catastral === property.referencia_catastral
        );
        const valorRefOficial = property._original?.valor_referencia_oficial;
        const comparacion = property._original?.comparacion;

        if (valoracion || valorRefOficial) {
            html += `<h3>💰 Valoraciones</h3>`;

            // Comparación visual si hay ambos valores
            if (comparacion) {
                const colorDif = comparacion.diferencia_euros >= 0 ? 'var(--success)' : 'var(--danger-color)';
                const signo = comparacion.diferencia_euros >= 0 ? '+' : '';
                const bgColor = comparacion.diferencia_euros >= 0 ? 'var(--success-bg)' : '#fee2e2';

                html += `
                    <div style="background: ${bgColor}; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                            <div style="text-align: center;">
                                <div style="font-size: 0.9rem; color: var(--text-secondary);">💰 Valor Calculado</div>
                                <div style="font-size: 1.5rem; font-weight: bold; color: var(--success);">${this.formatCurrency(comparacion.valor_calculado)}</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 0.9rem; color: var(--text-secondary);">📊 Valor Oficial (Catastro)</div>
                                <div style="font-size: 1.5rem; font-weight: bold; color: #0369a1;">${this.formatCurrency(comparacion.valor_oficial)}</div>
                            </div>
                        </div>
                        <div style="text-align: center; padding-top: 0.5rem; border-top: 1px solid rgba(0,0,0,0.1);">
                            <div style="font-size: 0.9rem; color: var(--text-secondary);">Diferencia</div>
                            <div style="font-size: 1.2rem; font-weight: bold; color: ${colorDif};">
                                ${signo}${this.formatCurrency(comparacion.diferencia_euros)} (${signo}${comparacion.diferencia_porcentaje.toFixed(2)}%)
                            </div>
                            <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem;">
                                ${comparacion.mayor === 'calculado' ? 'El valor calculado es mayor' : comparacion.mayor === 'oficial' ? 'El valor oficial es mayor' : 'Los valores coinciden'}
                            </div>
                        </div>
                    </div>
                `;
            }

            // Detalles de valoración calculada
            if (valoracion) {
                html += `
                    <h4>📊 Detalle de Valoración Calculada</h4>
                    <div class="modal-detail-grid">
                        ${!comparacion ? this.createDetailItem('Valor Estimado', `<strong style="color: var(--success); font-size: 1.2em;">${this.formatCurrency(valoracion.valor_estimado_euros)}</strong>`) : ''}
                        ${this.createDetailItem('Tipo Valoración', valoracion.tipo_valoracion === 'rustico' ? 'Rústico' : 'Urbano')}
                        ${this.createDetailItem('Método', valoracion.metodo)}
                        ${valoracion.valor_catastral ? this.createDetailItem('Valor Catastral', this.formatCurrency(valoracion.valor_catastral)) : ''}
                        ${valoracion.coeficiente ? this.createDetailItem('Coeficiente Aplicado', valoracion.coeficiente) : ''}
                        ${valoracion.superficie_total_ha ? this.createDetailItem('Superficie Total', `${valoracion.superficie_total_ha} ha (${this.formatNumber(valoracion.superficie_total_m2)} m²)`) : ''}
                        ${valoracion.valor_por_ha ? this.createDetailItem('Precio por Hectárea', this.formatCurrency(valoracion.valor_por_ha)) : ''}
                    </div>
                `;

                // Detalles de cultivos si es rústico
                if (valoracion.detalles_cultivos && valoracion.detalles_cultivos.length > 0) {
                    html += `
                        <h4 style="margin-top: 1rem;">🌾 Desglose por Cultivos</h4>
                        <div class="table-responsive" style="margin-top: 1rem;">
                            <table class="cultivos-table">
                                <thead>
                                    <tr>
                                        <th>Cultivo</th>
                                        <th>Superficie (ha)</th>
                                        <th>Precio/ha</th>
                                        <th>Valor Estimado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${valoracion.detalles_cultivos.map(c => `
                                        <tr>
                                            <td>${c.cultivo}</td>
                                            <td>${c.superficie_ha} ha</td>
                                            <td>${this.formatCurrency(c.precio_ha)}</td>
                                            <td><strong>${this.formatCurrency(c.valor_estimado)}</strong></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `;
                }

                // Advertencias
                if (valoracion.advertencias && valoracion.advertencias.length > 0) {
                    html += `
                        <div style="margin-top: 1rem; padding: 1rem; background: var(--warning-bg); border-radius: 8px; font-size: 0.85rem;">
                            <strong>⚠️ Advertencias:</strong>
                            <ul style="margin: 0.5rem 0 0 1.5rem; padding: 0;">
                                ${valoracion.advertencias.map(adv => `<li>${adv}</li>`).join('')}
                            </ul>
                        </div>
                    `;
                }

                if (valoracion.fuente_criterios || valoracion.fuente_precios) {
                    html += `
                        <div style="margin-top: 0.5rem; font-size: 0.8rem; color: var(--text-secondary);">
                            <em>Fuente: ${valoracion.fuente_criterios || valoracion.fuente_precios}</em>
                        </div>
                    `;
                }
            }

            // Detalles del valor de referencia oficial
            if (valorRefOficial) {
                html += `
                    <h4 style="margin-top: 1.5rem;">📊 Valor de Referencia Oficial (Catastro)</h4>
                    <div class="modal-detail-grid">
                        ${!comparacion ? this.createDetailItem('Valor de Referencia', `<strong style="color: #0369a1; font-size: 1.2em;">${this.formatCurrency(valorRefOficial.valor_referencia)}</strong>`) : ''}
                        ${this.createDetailItem('Ejercicio', valorRefOficial.ejercicio || '2025')}
                        ${this.createDetailItem('Fecha Consulta', valorRefOficial.fecha_consulta || 'N/A')}
                        ${this.createDetailItem('Finalidad', valorRefOficial.finalidad || 'N/A')}
                    </div>
                    <div style="margin-top: 0.5rem; padding: 0.75rem; background: #e0f2fe; border-radius: 8px; font-size: 0.85rem; color: #0369a1;">
                        <strong>ℹ️ Nota:</strong> Este es el valor de referencia oficial publicado por el Catastro para el ejercicio ${valorRefOficial.ejercicio || '2025'}.
                        Se utiliza como base para la tributación de transmisiones inmobiliarias.
                    </div>
                `;
            }
        }

        // Enlace a catastro
        if (property.url_consultada) {
            html += `
                <div style="margin-top: 2rem;">
                    <a href="${property.url_consultada}" target="_blank" class="btn btn-sec">
                        🔗 Ver en Catastro
                    </a>
                </div>
            `;
        }

        html += `
            <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--border-color); font-size: 0.85rem; color: var(--text-secondary);">
                Fecha de extracción: ${this.formatDate(property.fecha_extraccion)}
            </div>
        `;

        modalBody.innerHTML = html;
        modal.style.display = 'block';
    }

    /**
     * Formatea un label de campo
     */
    formatLabel(key) {
        return key
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Crea un item de detalle para el modal
     */
    createDetailItem(label, value) {
        if (!value && value !== 0) return '';
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
     * Maneja la búsqueda general
     */
    handleSearch(query) {
        const searchTerm = query.toLowerCase().trim();

        if (!searchTerm) {
            this.applyFilters();
            return;
        }

        this.filteredData = this.data.filter(property => {
            const ref = property.referencia_catastral?.toLowerCase() || '';
            const provincia = property.localizacion?.provincia?.toLowerCase() || '';
            const municipio = property.localizacion?.municipio?.toLowerCase() || '';
            const partida = property.localizacion?.partida?.toLowerCase() || '';
            const clase = property.datos_inmueble?.clase?.toLowerCase() || '';
            const uso = property.datos_inmueble?.uso_principal?.toLowerCase() || '';

            return ref.includes(searchTerm) ||
                provincia.includes(searchTerm) ||
                municipio.includes(searchTerm) ||
                partida.includes(searchTerm) ||
                clase.includes(searchTerm) ||
                uso.includes(searchTerm);
        });

        this.renderProperties();
        this.updateFilteredCount();
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

    // Intentar cargar datos consolidados automáticamente
    window.app.autoLoadData();
});
