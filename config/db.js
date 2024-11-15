const mongoose = require("mongoose");

const mongoURI = "mongodb+srv://d-transaction-app:mongodb@cluster0.cgkt3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const connectToMongoDB = async () => {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
    });
    console.log("MongoDB connected successfully!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1); // Exit the process if unable to connect
  }
};

connectToMongoDB();

module.exports = mongoose;
