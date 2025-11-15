const express = require('express');
const router = express.Router();
const {
  getValoresTasacion,
  updateValoresTasacion,
  resetValoresTasacion
} = require('../controllers/valoresTasacionController');

router.route('/')
  .get(getValoresTasacion)
  .put(updateValoresTasacion);

router.route('/reset')
  .post(resetValoresTasacion);

module.exports = router;
