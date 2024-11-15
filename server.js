const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('./config/db'); 
const groupRoutes = require('./routes/groupRoutes'); 

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/groups', groupRoutes);



const stripe = require('stripe')('sk_test_51QIsU3EbklFJ2mKnnrzbqAr4bY46VehpMZz1PTGJYnyht0ipOwxX4hWMXCaCMvsVpr5nhBw5kC3plHCKSX2Vobh300gBqd7bPM');
// This example sets up an endpoint using the Express framework.
// Watch this video to get started: https://youtu.be/rPR2aJ6XnAc.

// const amount = req.body.amount;
app.post('/payment-sheet', async (req, res) => {
  // Use an existing Customer ID if this is a returning customer.
  const customer = await stripe.customers.create();
  const ephemeralKey = await stripe.ephemeralKeys.create(
    {customer: customer.id},
    {apiVersion: '2024-10-28.acacia'}
  );
  const money= req.body.billAmount;
  const paymentIntent = await stripe.paymentIntents.create({
    amount: money,
    currency: 'eur',
    customer: customer.id,
    // In the latest version of the API, specifying the `automatic_payment_methods` parameter
    // is optional because Stripe enables its functionality by default.
    automatic_payment_methods: {
      enabled: true,
    },
  });

  res.json({
    paymentIntent: paymentIntent.client_secret,
    ephemeralKey: ephemeralKey.secret,
    customer: customer.id,
    publishableKey: 'pk_test_51QIsU3EbklFJ2mKnHm8ptUIow6AueGIYorOvFKJRAzzfZk7AHYCqAqGMZ2tx1vlUe8nDCltXQUIQPIA8mcLBLdt100oydNPXKQ'
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});


