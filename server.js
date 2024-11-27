// server.js

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('./config/db'); 
const groupRoutes = require('./routes/groupRoutes'); 
const userRoutes = require('./routes/userRoutes'); 
const expenseRoutes = require('./routes/expenseRoutes');

require('dotenv').config(); // Load environment variables
const ethers = require('ethers'); // Correct import
const { create } = require('ipfs-http-client'); // Import create from ipfs-http-client

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/groups', groupRoutes);
app.use('/api/users', userRoutes);
app.use('/api/expenses', expenseRoutes);

// Stripe setup
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Initialize Ethereum provider using Alchemy
const provider = new ethers.providers.JsonRpcProvider(
  `https://eth-goerli.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`
);

// Create a wallet instance
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Pass wallet and provider to storeData
const expenseController = require('./controllers/expenseController');
app.post('/store-data', (req, res) => expenseController.storeData(req, res, wallet, provider));


// Initialize IPFS client using a public gateway (no longer used for pinning)
const ipfs = create({ url: 'https://ipfs.io' }); 











// Existing /payment-sheet endpoint
app.post('/payment-sheet', async (req, res) => {
  try {
    // Create a new customer
    const customer = await stripe.customers.create();

    // Create an ephemeral key for the customer
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2022-11-15' } // Use a supported Stripe API version
    );

    // Calculate the amount in the smallest currency unit (cents)
    const money = Math.round(req.body.billAmount * 100); // Assuming billAmount is in euros

    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: money,
      currency: 'eur', // Consider changing to 'inr' if using Indian Rupees
      customer: customer.id,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      paymentIntentId: paymentIntent.id,
      paymentIntentClientSecret: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY, // Use env variable
    });
  } catch (error) {
    console.error('Error creating payment sheet:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
