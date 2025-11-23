/**
 * Script de actualización de coeficientes agronómicos
 * Se ejecuta al iniciar la aplicación para actualizar los valores de las parcelas
 */

const Propiedad = require('../models/Propiedad');

// Datos de coeficientes por referencia catastral
const coeficientesData = [
  // Planes
  {
    referencia_catastral: '03106A002000090000YL',
    coefFA: 1.00, coefCS: 0.85, coefFLS: 1.10, coefCP: 1.00, coefDE: 0.80,
    coefJustificacion: 'Pequeña, pero con acceso carretera.'
  },
  {
    referencia_catastral: '03106A002001800000YO',
    coefFA: 0.90, coefCS: 1.10, coefFLS: 1.10, coefCP: 0.90, coefDE: 0.80,
    coefJustificacion: 'Superficie grande (+), cultivos mixtos (-).'
  },

  // Vall de Gallinera
  {
    referencia_catastral: '03136A007002950000ZS',
    coefFA: 1.00, coefCS: 1.00, coefFLS: 0.90, coefCP: 1.00, coefDE: 0.80,
    coefJustificacion: 'Abandonado, zona interior.'
  },
  {
    referencia_catastral: '03136A007002810000ZT',
    coefFA: 0.60, coefCS: 0.70, coefFLS: 1.00, coefCP: 1.00, coefDE: 0.90,
    coefJustificacion: 'Pinar (bajo valor), minifundio (493m2).'
  },
  {
    referencia_catastral: '03136A004001200000ZY',
    coefFA: 1.10, coefCS: 0.90, coefFLS: 1.20, coefCP: 1.00, coefDE: 0.80,
    coefJustificacion: 'Muy cerca población (50m), acceso ctra.'
  },
  {
    referencia_catastral: '03136A006002310000ZB',
    coefFA: 1.20, coefCS: 0.80, coefFLS: 0.70, coefCP: 0.85, coefDE: 0.70,
    coefJustificacion: 'Regadío potencial (+), sin acceso y pendiente (-).'
  },
  {
    referencia_catastral: '03136A004000090000ZE',
    coefFA: 1.10, coefCS: 0.90, coefFLS: 1.15, coefCP: 1.00, coefDE: 1.00,
    coefJustificacion: 'En producción, carretera, llano.'
  },
  {
    referencia_catastral: '03136A004002220000ZT',
    coefFA: 0.50, coefCS: 1.10, coefFLS: 0.80, coefCP: 0.80, coefDE: 0.70,
    coefJustificacion: 'Forestal, bancales, torre eléctrica (servidumbre).'
  },
  {
    referencia_catastral: '03136A004002310000ZD',
    coefFA: 0.50, coefCS: 0.75, coefFLS: 0.80, coefCP: 0.80, coefDE: 0.70,
    coefJustificacion: 'Discrepancia masiva catastro/escritura. Forestal.'
  },
  {
    referencia_catastral: '03136A007001730000ZW',
    coefFA: 0.40, coefCS: 1.00, coefFLS: 0.90, coefCP: 1.00, coefDE: 0.60,
    coefJustificacion: 'Pastos sin agua y abandonado (valor mínimo).'
  },
  {
    referencia_catastral: '03136A004001250000ZT',
    coefFA: 0.30, coefCS: 0.95, coefFLS: 0.80, coefCP: 1.00, coefDE: 0.90,
    coefJustificacion: 'Matorral sin acceso directo.'
  },
  {
    referencia_catastral: '03136A006001950000ZH',
    coefFA: 1.15, coefCS: 0.70, coefFLS: 0.70, coefCP: 1.00, coefDE: 0.80,
    coefJustificacion: 'Regadío pero muy pequeño y sin acceso ctra.'
  },
  {
    referencia_catastral: '03136A007002280000ZS',
    coefFA: 1.00, coefCS: 0.90, coefFLS: 0.90, coefCP: 0.80, coefDE: 0.80,
    coefJustificacion: 'Forma alargada (difícil labor), abandonado.'
  },
  {
    referencia_catastral: '03136A006002580000ZW',
    coefFA: 1.05, coefCS: 1.10, coefFLS: 1.15, coefCP: 0.90, coefDE: 0.85,
    coefJustificacion: 'Gran superficie, carretera, fuente cerca (+).'
  },
  {
    referencia_catastral: '03136A006002600000ZH',
    coefFA: 1.00, coefCS: 1.00, coefFLS: 0.90, coefCP: 1.00, coefDE: 0.80,
    coefJustificacion: 'Estándar abandonado.'
  },
  {
    referencia_catastral: '03136A007003790000ZK',
    coefFA: 1.00, coefCS: 0.90, coefFLS: 1.10, coefCP: 0.95, coefDE: 0.80,
    coefJustificacion: 'Acceso carretera, bancales ligeros.'
  },
  {
    referencia_catastral: '03136A007004240000ZU',
    coefFA: 1.00, coefCS: 0.70, coefFLS: 1.10, coefCP: 1.00, coefDE: 0.80,
    coefJustificacion: 'Minifundio pero con buen acceso.'
  },
  {
    referencia_catastral: '03136A001000630000ZY',
    coefFA: 0.30, coefCS: 1.10, coefFLS: 0.80, coefCP: 1.00, coefDE: 0.90,
    coefJustificacion: 'Gran superficie pero improductiva (Solana).'
  },
  {
    referencia_catastral: '03136A001000670000ZL',
    coefFA: 0.90, coefCS: 0.95, coefFLS: 1.10, coefCP: 1.05, coefDE: 0.80,
    coefJustificacion: 'IP04 (Baja prod.), pero forma cuadrada y ctra.'
  },
  {
    referencia_catastral: '03136A003000430000ZW',
    coefFA: 0.50, coefCS: 0.60, coefFLS: 0.80, coefCP: 1.00, coefDE: 1.00,
    coefJustificacion: 'Corral de piedra (Valor arquitectónico vs agrario).'
  },
  {
    referencia_catastral: '03136A004000790000ZU',
    coefFA: 1.05, coefCS: 0.95, coefFLS: 1.20, coefCP: 1.00, coefDE: 0.80,
    coefJustificacion: 'Muy cerca población (50m).'
  },
  {
    referencia_catastral: '03136A004001880000ZL',
    coefFA: 1.00, coefCS: 0.95, coefFLS: 1.10, coefCP: 0.90, coefDE: 0.70,
    coefJustificacion: 'Árboles muertos (coste arranque), acceso ctra.'
  },
  {
    referencia_catastral: '7806511YJ3070N0000AA',
    coefFA: 0.20, coefCS: 0.50, coefFLS: 1.00, coefCP: 0.80, coefDE: 1.00,
    coefJustificacion: 'Retal urbano/rústico anexo a casa.'
  },

  // Piles (Valencia)
  {
    referencia_catastral: '46197A001002690000FX',
    coefFA: 1.35, coefCS: 1.05, coefFLS: 1.30, coefCP: 1.10, coefDE: 1.00,
    coefJustificacion: 'Premium: En producción, rotonda pueblo (expectativa urb).'
  },

  // Oliva (Valencia)
  {
    referencia_catastral: '46183A020000880000HR',
    coefFA: 1.30, coefCS: 1.00, coefFLS: 1.15, coefCP: 1.10, coefDE: 1.00,
    coefJustificacion: 'Joya Agraria: Regadío, goteo, producción, ctra.'
  },
  {
    referencia_catastral: '46183A008001360000HX',
    coefFA: 1.25, coefCS: 0.90, coefFLS: 1.10, coefCP: 1.10, coefDE: 1.00,
    coefJustificacion: 'Limpio, cerca mar, rectangular.'
  },
  {
    referencia_catastral: '46183A003002660000HW',
    coefFA: 1.20, coefCS: 0.95, coefFLS: 1.00, coefCP: 1.10, coefDE: 0.80,
    coefJustificacion: 'Regadío abandonado, entorno semi-urbano.'
  },
  {
    referencia_catastral: '46183A010001180000HF',
    coefFA: 1.15, coefCS: 0.90, coefFLS: 1.00, coefCP: 1.10, coefDE: 0.75,
    coefJustificacion: 'Zona inundable (-), abandonado.'
  },
  {
    referencia_catastral: '46183A008004210000HK',
    coefFA: 1.20, coefCS: 0.90, coefFLS: 1.00, coefCP: 1.05, coefDE: 0.80,
    coefJustificacion: 'Regadío abandonado, llano.'
  },
  {
    referencia_catastral: '46183A009007320000HW',
    coefFA: 1.20, coefCS: 0.95, coefFLS: 1.15, coefCP: 1.10, coefDE: 0.80,
    coefJustificacion: 'Cerca mar y ctra, rodeada casas (FLS alto).'
  },
  {
    referencia_catastral: '46183A009007330000HA',
    coefFA: 0.80, coefCS: 0.75, coefFLS: 1.15, coefCP: 1.10, coefDE: 0.80,
    coefJustificacion: 'Parte del lote "Font del Maset". Pequeña.'
  },
  {
    referencia_catastral: '46183A009007340000HB',
    coefFA: 1.20, coefCS: 0.90, coefFLS: 1.15, coefCP: 1.10, coefDE: 0.80,
    coefJustificacion: 'Parte del lote "Font del Maset".'
  },
  {
    referencia_catastral: '46183A009007350000HY',
    coefFA: 1.20, coefCS: 0.90, coefFLS: 1.15, coefCP: 1.10, coefDE: 0.80,
    coefJustificacion: 'Parte del lote "Font del Maset".'
  }
];

/**
 * Actualiza los coeficientes agronómicos de las propiedades
 */
async function updateCoeficientes() {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   📊 ACTUALIZANDO COEFICIENTES AGRONÓMICOS...          ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');

  let actualizadas = 0;
  let noEncontradas = 0;
  let errores = 0;

  for (const data of coeficientesData) {
    try {
      const resultado = await Propiedad.findOneAndUpdate(
        { referencia_catastral: data.referencia_catastral },
        {
          $set: {
            coefFA: data.coefFA,
            coefCS: data.coefCS,
            coefFLS: data.coefFLS,
            coefCP: data.coefCP,
            coefDE: data.coefDE,
            coefJustificacion: data.coefJustificacion
          }
        },
        { new: true }
      );

      if (resultado) {
        actualizadas++;
        console.log(`  ✅ ${data.referencia_catastral} - Coeficientes actualizados`);
      } else {
        noEncontradas++;
        console.log(`  ⚠️  ${data.referencia_catastral} - No encontrada en BD`);
      }
    } catch (error) {
      errores++;
      console.error(`  ❌ ${data.referencia_catastral} - Error: ${error.message}`);
    }
  }

  console.log('');
  console.log('════════════════════════════════════════════════════════════');
  console.log(`  📈 Resumen de actualización de coeficientes:`);
  console.log(`     ✅ Actualizadas: ${actualizadas}`);
  console.log(`     ⚠️  No encontradas: ${noEncontradas}`);
  console.log(`     ❌ Errores: ${errores}`);
  console.log(`     📋 Total procesadas: ${coeficientesData.length}`);
  console.log('════════════════════════════════════════════════════════════');
  console.log('');

  return { actualizadas, noEncontradas, errores };
}

module.exports = updateCoeficientes;
