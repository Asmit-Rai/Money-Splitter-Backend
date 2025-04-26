const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('./config/db'); 
const groupRoutes = require('./routes/groupRoutes'); 
const userRoutes = require('./routes/userRoutes'); 
const expenseRoutes = require('./routes/expenseRoutes');
require('dotenv').config(); 

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

app.use('/api/groups', groupRoutes);
app.use('/api/users', userRoutes);
app.use('/api/expenses', expenseRoutes);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
