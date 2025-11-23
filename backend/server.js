const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/database');
// Script de actualización desactivado (backup en scripts/updateCoeficientes.js)
// const updateCoeficientes = require('./scripts/updateCoeficientes');
require('dotenv').config();

// Conectar a MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware simple
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rutas
app.use('/api/propiedades', require('./routes/propiedades'));
app.use('/api/valores-tasacion', require('./routes/valoresTasacion'));
app.use('/api/repartos', require('./routes/repartos'));

// Ruta de health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API Gestión de Herencias',
    version: '1.0.0',
    endpoints: {
      propiedades: '/api/propiedades',
      valoresTasacion: '/api/valores-tasacion',
      repartos: '/api/repartos',
      health: '/health'
    }
  });
});

// Manejador de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada'
  });
});

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Error interno del servidor'
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║                                                        ║');
  console.log('║        🚀 API GESTIÓN HERENCIA INICIADA 🚀            ║');
  console.log('║                                                        ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`✅ Servidor escuchando en puerto ${PORT}`);
  console.log(`📡 http://localhost:${PORT}`);
  console.log('');
  console.log('Endpoints disponibles:');
  console.log(`  📋 GET    /api/propiedades`);
  console.log(`  ➕ POST   /api/propiedades`);
  console.log(`  📝 PUT    /api/propiedades/:id`);
  console.log(`  ❌ DELETE /api/propiedades/:id`);
  console.log('');
  console.log(`  📊 GET    /api/valores-tasacion`);
  console.log(`  📝 PUT    /api/valores-tasacion`);
  console.log('');
  console.log(`  📋 GET    /api/repartos`);
  console.log(`  ➕ POST   /api/repartos`);
  console.log(`  📝 PUT    /api/repartos/:id`);
  console.log(`  ❌ DELETE /api/repartos/:id`);
  console.log('');
  console.log(`  🏥 GET    /health`);
  console.log('');
});
