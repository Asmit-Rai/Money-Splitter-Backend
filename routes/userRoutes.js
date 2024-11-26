const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/add-group', userController.addGroup);
router.post('/get-user-id', userController.getUserId);
router.get('/user/:id', userController.getUserById);

module.exports = router;