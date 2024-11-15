const { MongoClient, ServerApiVersion } = require('mongodb');

// Use environment variables for sensitive information
require('dotenv').config();

const uri = `mongodb+srv://d-transaction-app:${process.env.DB_PASSWORD}@cluster0.cgkt3.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Connect to the MongoDB server and export the client for use in your application
const connectToMongoDB = async () => {
  try {
    // Connect the client to the server
    await client.connect();

    // Ping the database to confirm a successful connection
    await client.db().command({ ping: 1 });
    console.log("Connected successfully to MongoDB!");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1); // Exit the process if unable to connect
  }
};

// Call the function to initiate the connection
connectToMongoDB();

module.exports = client;
