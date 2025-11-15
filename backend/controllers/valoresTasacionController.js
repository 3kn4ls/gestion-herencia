const ValoresTasacion = require('../models/ValoresTasacion');

// @desc    Obtener valores de tasación (único documento)
// @route   GET /api/valores-tasacion
// @access  Public
exports.getValoresTasacion = async (req, res) => {
  try {
    const valores = await ValoresTasacion.findOne();

    if (!valores) {
      return res.status(404).json({
        success: false,
        error: 'No se encontraron valores de tasación. Debe crear el documento inicial.'
      });
    }

    res.json({
      success: true,
      data: valores
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Actualizar valores de tasación
// @route   PUT /api/valores-tasacion
// @access  Public
exports.updateValoresTasacion = async (req, res) => {
  try {
    // Buscar el documento existente
    let valores = await ValoresTasacion.findOne();

    if (!valores) {
      // Si no existe, crearlo
      valores = await ValoresTasacion.create(req.body);
      return res.status(201).json({
        success: true,
        data: valores,
        message: 'Valores de tasación creados'
      });
    }

    // Si existe, actualizarlo
    // Actualizar fecha
    req.body.fecha = new Date().getFullYear().toString();

    valores = await ValoresTasacion.findByIdAndUpdate(
      valores._id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.json({
      success: true,
      data: valores,
      message: 'Valores de tasación actualizados'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Resetear a valores por defecto
// @route   POST /api/valores-tasacion/reset
// @access  Public
exports.resetValoresTasacion = async (req, res) => {
  try {
    const valores = await ValoresTasacion.findOne();

    if (!valores) {
      return res.status(404).json({
        success: false,
        error: 'No se encontraron valores de tasación'
      });
    }

    // Aquí podrías cargar valores por defecto desde un archivo
    // Por ahora solo retornamos el documento existente
    res.json({
      success: true,
      data: valores,
      message: 'Utiliza POST con los valores por defecto en el body para resetear'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
