/**
 * Módulo de Configuración de Valoración
 * Maneja el modal de configuración y los parámetros personalizados
 */

class ConfiguracionValoracion {
    constructor(app) {
        this.app = app;
        this.criteriosDefault = this.getCriteriosDefault();
        this.criteriosActuales = JSON.parse(JSON.stringify(this.criteriosDefault));
        this.initializeEventListeners();
    }

    /**
     * Obtiene los criterios de valoración por defecto
     * Valores oficiales GVA 2025 por ámbitos territoriales
     */
    getCriteriosDefault() {
        return {
            PRECIOS_RUSTICO: {
                // Ámbito 13: Safor-Litoral (Oliva, Piles)
                ambito_13_safor_litoral: {
                    olivar_secano: { valor: 12200, nombre: "Olivar Secano", unidad: "€/ha" },
                    olivar_regadio: { valor: 24400, nombre: "Olivar Regadío", unidad: "€/ha" },
                    almendro_secano: { valor: 6100, nombre: "Frutos Secos Secano", unidad: "€/ha" },
                    almendro_regadio: { valor: 18300, nombre: "Frutos Secos Regadío", unidad: "€/ha" },
                    vina_secano: { valor: 9200, nombre: "Viñedo Secano", unidad: "€/ha" },
                    vina_regadio: { valor: 18300, nombre: "Viñedo Regadío", unidad: "€/ha" },
                    frutal_regadio: { valor: 30500, nombre: "Frutales Regadío", unidad: "€/ha" },
                    citricos_regadio: { valor: 50800, nombre: "Agrios/Cítricos Regadío", unidad: "€/ha" },
                    horticola_regadio: { valor: 30500, nombre: "Hortícolas Regadío", unidad: "€/ha" },
                    arroz_regadio: { valor: 18300, nombre: "Arroz Regadío", unidad: "€/ha" },
                    labor_secano: { valor: 4900, nombre: "Labor/Labradío Secano", unidad: "€/ha" },
                    pastos: { valor: 3000, nombre: "Pastos", unidad: "€/ha" },
                    improductivo: { valor: 600, nombre: "Improductivo/Matorral", unidad: "€/ha" }
                },
                // Ámbito 17: Marina Alta-Interior (Vall de Gallinera, Planes)
                ambito_17_marina_alta_interior: {
                    olivar_secano: { valor: 15600, nombre: "Olivar Secano", unidad: "€/ha" },
                    olivar_regadio: { valor: 19500, nombre: "Olivar Regadío", unidad: "€/ha" },
                    almendro_secano: { valor: 7800, nombre: "Frutos Secos Secano", unidad: "€/ha" },
                    almendro_regadio: { valor: 19500, nombre: "Frutos Secos Regadío", unidad: "€/ha" },
                    vina_secano: { valor: 7800, nombre: "Viñedo Secano", unidad: "€/ha" },
                    vina_regadio: { valor: 15600, nombre: "Viñedo Regadío", unidad: "€/ha" },
                    frutal_regadio: { valor: 26000, nombre: "Frutales Regadío", unidad: "€/ha" },
                    citricos_regadio: { valor: 39000, nombre: "Agrios/Cítricos Regadío", unidad: "€/ha" },
                    horticola_regadio: { valor: 26000, nombre: "Hortícolas Regadío", unidad: "€/ha" },
                    labor_secano: { valor: 6200, nombre: "Labor/Labradío Secano", unidad: "€/ha" },
                    pastos: { valor: 3100, nombre: "Pastos", unidad: "€/ha" },
                    improductivo: { valor: 600, nombre: "Improductivo/Matorral", unidad: "€/ha" }
                }
            },
            COEFICIENTES_URBANO: {
                valencia: {
                    vivienda: { valor: 0.5, nombre: "Vivienda", unidad: "coef" },
                    local: { valor: 0.5, nombre: "Local", unidad: "coef" },
                    oficina: { valor: 0.5, nombre: "Oficina", unidad: "coef" },
                    garaje: { valor: 0.4, nombre: "Garaje", unidad: "coef" },
                    trastero: { valor: 0.4, nombre: "Trastero", unidad: "coef" },
                    default: { valor: 0.5, nombre: "Por Defecto", unidad: "coef" }
                }
            }
        };
    }

    /**
     * Inicializa los event listeners
     */
    initializeEventListeners() {
        // Botón valorar abre el modal de configuración
        document.getElementById('btnValorar')?.addEventListener('click', () => {
            this.openConfigModal();
        });

        // Cerrar modal configuración
        document.querySelector('.close-config')?.addEventListener('click', () => {
            this.closeConfigModal();
        });

        // Cerrar modal al hacer click fuera
        document.getElementById('configModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'configModal') {
                this.closeConfigModal();
            }
        });

        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
            });
        });

        // Restaurar valores por defecto
        document.getElementById('btnRestaurarDefecto')?.addEventListener('click', () => {
            this.restaurarDefecto();
        });

        // Valorar con configuración
        document.getElementById('btnValorarConConfig')?.addEventListener('click', () => {
            this.valorarConConfig();
        });
    }

    /**
     * Abre el modal de configuración
     */
    openConfigModal() {
        if (!this.app.data || this.app.data.length === 0) {
            alert('No hay propiedades cargadas para valorar');
            return;
        }

        // Generar los inputs
        this.renderConfigInputs();

        // Mostrar modal
        document.getElementById('configModal').style.display = 'block';
    }

    /**
     * Cierra el modal de configuración
     */
    closeConfigModal() {
        document.getElementById('configModal').style.display = 'none';
    }

    /**
     * Cambia de pestaña
     */
    switchTab(tab) {
        // Actualizar botones
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // Actualizar contenido
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.getElementById(`tab-${tab}`).classList.remove('hidden');
    }

    /**
     * Renderiza los inputs de configuración
     */
    renderConfigInputs() {
        // Precios rústico - mostrar por ámbito territorial
        const rusticoContainer = document.getElementById('preciosRustico');
        rusticoContainer.innerHTML = '';

        // Título con explicación
        const infoDiv = document.createElement('div');
        infoDiv.className = 'config-info';
        infoDiv.innerHTML = `
            <p><strong>Valores Oficiales GVA 2025 por Ámbitos Territoriales</strong></p>
            <p style="font-size: 0.9em; margin: 5px 0;">
                • Ámbito 13: Oliva, Piles<br>
                • Ámbito 17: Vall de Gallinera, Planes
            </p>
        `;
        rusticoContainer.appendChild(infoDiv);

        // Ámbito 13: Safor-Litoral
        const titulo13 = document.createElement('h4');
        titulo13.textContent = 'Ámbito 13: Safor-Litoral (Oliva, Piles)';
        titulo13.style.marginTop = '20px';
        titulo13.style.borderBottom = '2px solid #4CAF50';
        titulo13.style.paddingBottom = '5px';
        rusticoContainer.appendChild(titulo13);

        const preciosAmbito13 = this.criteriosActuales.PRECIOS_RUSTICO.ambito_13_safor_litoral;
        for (const [key, data] of Object.entries(preciosAmbito13)) {
            const div = document.createElement('div');
            div.className = 'config-item';
            div.innerHTML = `
                <label for="precio_13_${key}">${data.nombre}</label>
                <input
                    type="number"
                    id="precio_13_${key}"
                    value="${data.valor}"
                    min="0"
                    step="100"
                    data-type="rustico"
                    data-ambito="ambito_13_safor_litoral"
                    data-key="${key}"
                >
                <span class="help-text">${data.unidad}</span>
            `;
            rusticoContainer.appendChild(div);
        }

        // Ámbito 17: Marina Alta-Interior
        const titulo17 = document.createElement('h4');
        titulo17.textContent = 'Ámbito 17: Marina Alta-Interior (Vall de Gallinera, Planes)';
        titulo17.style.marginTop = '30px';
        titulo17.style.borderBottom = '2px solid #2196F3';
        titulo17.style.paddingBottom = '5px';
        rusticoContainer.appendChild(titulo17);

        const preciosAmbito17 = this.criteriosActuales.PRECIOS_RUSTICO.ambito_17_marina_alta_interior;
        for (const [key, data] of Object.entries(preciosAmbito17)) {
            const div = document.createElement('div');
            div.className = 'config-item';
            div.innerHTML = `
                <label for="precio_17_${key}">${data.nombre}</label>
                <input
                    type="number"
                    id="precio_17_${key}"
                    value="${data.valor}"
                    min="0"
                    step="100"
                    data-type="rustico"
                    data-ambito="ambito_17_marina_alta_interior"
                    data-key="${key}"
                >
                <span class="help-text">${data.unidad}</span>
            `;
            rusticoContainer.appendChild(div);
        }

        // Coeficientes urbano
        const urbanoContainer = document.getElementById('coeficientesUrbano');
        urbanoContainer.innerHTML = '';

        const coefUrbano = this.criteriosActuales.COEFICIENTES_URBANO.valencia;
        for (const [key, data] of Object.entries(coefUrbano)) {
            const div = document.createElement('div');
            div.className = 'config-item';
            div.innerHTML = `
                <label for="coef_${key}">${data.nombre}</label>
                <input
                    type="number"
                    id="coef_${key}"
                    value="${data.valor}"
                    min="0"
                    max="2"
                    step="0.05"
                    data-type="urbano"
                    data-key="${key}"
                >
                <span class="help-text">${data.unidad}</span>
            `;
            urbanoContainer.appendChild(div);
        }
    }

    /**
     * Lee los valores actuales de los inputs
     */
    leerValoresActuales() {
        // Leer precios rústico por ámbito territorial
        const preciosInputs = document.querySelectorAll('[data-type="rustico"]');
        preciosInputs.forEach(input => {
            const ambito = input.dataset.ambito;
            const key = input.dataset.key;
            const valor = parseFloat(input.value) || 0;
            if (this.criteriosActuales.PRECIOS_RUSTICO[ambito] &&
                this.criteriosActuales.PRECIOS_RUSTICO[ambito][key]) {
                this.criteriosActuales.PRECIOS_RUSTICO[ambito][key].valor = valor;
            }
        });

        // Leer coeficientes urbano
        const coefInputs = document.querySelectorAll('[data-type="urbano"]');
        coefInputs.forEach(input => {
            const key = input.dataset.key;
            const valor = parseFloat(input.value) || 0;
            this.criteriosActuales.COEFICIENTES_URBANO.valencia[key].valor = valor;
        });
    }

    /**
     * Restaura los valores por defecto
     */
    restaurarDefecto() {
        this.criteriosActuales = JSON.parse(JSON.stringify(this.criteriosDefault));
        this.renderConfigInputs();
        alert('✅ Valores restaurados a los predeterminados');
    }

    /**
     * Prepara los criterios para enviar a la API
     */
    prepararCriteriosParaAPI() {
        const preciosRustico = {};
        const coeficientes = {};

        // Convertir precios rústico por ámbito territorial
        for (const [ambito, cultivos] of Object.entries(this.criteriosActuales.PRECIOS_RUSTICO)) {
            preciosRustico[ambito] = {};
            for (const [key, data] of Object.entries(cultivos)) {
                preciosRustico[ambito][key] = data.valor;
            }
        }

        // Convertir coeficientes urbano
        const coefUrbano = this.criteriosActuales.COEFICIENTES_URBANO.valencia;
        for (const [key, data] of Object.entries(coefUrbano)) {
            coeficientes[key] = data.valor;
        }

        return {
            PRECIOS_RUSTICO: preciosRustico,
            COEFICIENTES_URBANO: {
                valencia: coeficientes
            }
        };
    }

    /**
     * Valora las propiedades con la configuración actual
     */
    async valorarConConfig() {
        // Leer valores actuales de los inputs
        this.leerValoresActuales();

        // Cerrar modal
        this.closeConfigModal();

        const btnValorar = document.getElementById('btnValorar');
        const originalText = btnValorar.textContent;

        try {
            btnValorar.textContent = '⏳ Valorando...';
            btnValorar.disabled = true;

            // Preparar datos
            const propiedadesOriginales = this.app.data.map(p => p._original || p);
            const criterios = this.prepararCriteriosParaAPI();

            // Enviar petición con criterios personalizados
            const response = await fetch('/api/valorar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    propiedades: propiedadesOriginales,
                    criterios: criterios
                })
            });

            if (!response.ok) {
                throw new Error('Error al valorar las propiedades');
            }

            this.app.valoraciones = await response.json();
            console.log('Valoraciones recibidas:', this.app.valoraciones);

            // Actualizar UI con las valoraciones
            this.app.updateUI();

            alert(`✅ Valoración completada con parámetros personalizados\n\nValor total estimado: ${this.app.formatCurrency(this.app.valoraciones.resumen.valor_total_estimado)}`);

        } catch (error) {
            console.error('Error:', error);
            alert('Error al valorar las propiedades. Asegúrate de que el servidor está corriendo.');
        } finally {
            btnValorar.textContent = originalText;
            btnValorar.disabled = false;
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Esperar a que la app principal esté inicializada
    setTimeout(() => {
        if (window.app) {
            window.configuracionValoracion = new ConfiguracionValoracion(window.app);
        }
    }, 100);
});
