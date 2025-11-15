const express = require('express');
const router = express.Router();
const {
  getPropiedades,
  getPropiedadById,
  getPropiedadByReferencia,
  createPropiedad,
  updatePropiedad,
  deletePropiedad,
  searchPropiedades
} = require('../controllers/propiedadesController');

router.route('/')
  .get(getPropiedades)
  .post(createPropiedad);

router.route('/search')
  .post(searchPropiedades);

router.route('/referencia/:ref')
  .get(getPropiedadByReferencia);

router.route('/:id')
  .get(getPropiedadById)
  .put(updatePropiedad)
  .delete(deletePropiedad);

module.exports = router;
