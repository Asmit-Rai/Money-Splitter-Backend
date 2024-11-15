const { MongoClient, ServerApiVersion } = require('mongodb');

// Hardcoded MongoDB connection string (replace with your actual credentials)
const uri = "mongodb+srv://d-transaction-app:mongodb@cluster0.cgkt3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Function to connect to MongoDB
const connectToMongoDB = async () => {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("MongoDB connected successfully!");

    // Optional: Ping the database
    await client.db("money_splitter").command({ ping: 1 });
    console.log("Pinged the database successfully.");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
    process.exit(1); // Exit process on failure
  }
};

// Call the connection function
connectToMongoDB();

module.exports = client;
