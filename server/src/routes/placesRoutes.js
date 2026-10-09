const express = require('express');
const router = express.Router();
const placesController = require('../controllers/placesController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validatePlace } = require('../middleware/validator');

router.get('/', placesController.getAllPlaces);

router.get('/:id', placesController.getPlaceById);

router.post('/', verifyToken, requireRole('admin'), validatePlace, placesController.createPlace);

router.put('/:id', verifyToken, requireRole('admin'), placesController.updatePlace);

router.delete('/:id', verifyToken, requireRole('admin'), placesController.deletePlace);

module.exports = router;
