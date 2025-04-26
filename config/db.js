const mongoose = require("mongoose");

const mongoURI ="mongodb+srv://d-transaction-app:mongodb@cluster0.cgkt3.mongodb.net/transaction-app?retryWrites=true&w=majority&appName=Cluster0";

  
  const connectToMongoDB = async () => {
    try {
      await mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 5000, 
      });
      console.log("MongoDB connected successfully!");
    } catch (error) {
      console.error("Error connecting to MongoDB:", error.message);
      process.exit(1); 
    }
  };
  
  connectToMongoDB();
  
  module.exports = mongoose;
  
