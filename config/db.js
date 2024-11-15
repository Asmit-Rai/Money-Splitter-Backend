const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://d-transaction-app:mongodb@cluster0.cgkt3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  });

module.exports = mongoose;
