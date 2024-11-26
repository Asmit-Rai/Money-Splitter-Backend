const express = require('express');
const userController = require('../controllers/userController');
const router = express.Router();

router.post('/add-users', userController.addUser);
router.post('/get-user-id', userController.getUserId)
router.get('/user/:id', userController.getUserById);

module.exports = router;
