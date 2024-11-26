const express = require('express');
const userController = require('../controllers/userController'); // Correct path
const router = express.Router();

// Define routes
router.post('/add-users', userController.addUser);
router.post('/get-user-id', userController.getUserId);
router.get('/user/:id', userController.getUserById); 

module.exports = router;
