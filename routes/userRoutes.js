const express = require('express');
const userController = require('../controllers/userController');
const router = express.Router();

router.post('/add-user', userController.addUser);
router.get('/get-user/:userId', userController.getUserById);

module.exports = router;
