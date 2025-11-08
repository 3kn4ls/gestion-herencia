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
     */
    getCriteriosDefault() {
        return {
            PRECIOS_RUSTICO: {
                valencia: {
                    olivar_secano: { valor: 35000, nombre: "Olivar Secano", unidad: "€/ha" },
                    olivar_regadio: { valor: 65000, nombre: "Olivar Regadío", unidad: "€/ha" },
                    almendr_secano: { valor: 20000, nombre: "Almendro Secano", unidad: "€/ha" },
                    almendr_regadio: { valor: 35000, nombre: "Almendro Regadío", unidad: "€/ha" },
                    vina_secano: { valor: 25000, nombre: "Viña Secano", unidad: "€/ha" },
                    vina_regadio: { valor: 45000, nombre: "Viña Regadío", unidad: "€/ha" },
                    frutal_secano: { valor: 28000, nombre: "Frutal Secano", unidad: "€/ha" },
                    frutal_regadio: { valor: 55000, nombre: "Frutal Regadío", unidad: "€/ha" },
                    cereal_secano: { valor: 8000, nombre: "Cereal Secano", unidad: "€/ha" },
                    cereal_regadio: { valor: 18000, nombre: "Cereal Regadío", unidad: "€/ha" },
                    pastos: { valor: 5000, nombre: "Pastos", unidad: "€/ha" },
                    forestal: { valor: 6000, nombre: "Forestal", unidad: "€/ha" },
                    improductivo: { valor: 2000, nombre: "Improductivo", unidad: "€/ha" },
                    default: { valor: 10000, nombre: "Por Defecto", unidad: "€/ha" }
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
        // Precios rústico
        const rusticoContainer = document.getElementById('preciosRustico');
        rusticoContainer.innerHTML = '';

        const preciosRustico = this.criteriosActuales.PRECIOS_RUSTICO.valencia;
        for (const [key, data] of Object.entries(preciosRustico)) {
            const div = document.createElement('div');
            div.className = 'config-item';
            div.innerHTML = `
                <label for="precio_${key}">${data.nombre}</label>
                <input
                    type="number"
                    id="precio_${key}"
                    value="${data.valor}"
                    min="0"
                    step="1000"
                    data-type="rustico"
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
        // Leer precios rústico
        const preciosInputs = document.querySelectorAll('[data-type="rustico"]');
        preciosInputs.forEach(input => {
            const key = input.dataset.key;
            const valor = parseFloat(input.value) || 0;
            this.criteriosActuales.PRECIOS_RUSTICO.valencia[key].valor = valor;
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
        const precios = {};
        const coeficientes = {};

        // Convertir precios rústico
        const preciosRustico = this.criteriosActuales.PRECIOS_RUSTICO.valencia;
        for (const [key, data] of Object.entries(preciosRustico)) {
            precios[key] = data.valor;
        }

        // Convertir coeficientes urbano
        const coefUrbano = this.criteriosActuales.COEFICIENTES_URBANO.valencia;
        for (const [key, data] of Object.entries(coefUrbano)) {
            coeficientes[key] = data.valor;
        }

        return {
            PRECIOS_RUSTICO: {
                valencia: precios
            },
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
