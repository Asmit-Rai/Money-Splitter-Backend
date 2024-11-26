const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');

// Route to add a new group
router.post('/add-groups', groupController.addGroup);
router.get('/show-groups', groupController.getData);
router.delete('/:id', groupController.deleteGroup);
router.get('/:id', groupController.getId);


module.exports = router;
