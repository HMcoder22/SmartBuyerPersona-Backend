const dotenv = require('dotenv');
const express = require('express');
const router = express.Router();
dotenv.config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// create a checkout session for the relevant product
router.post('/create-checkout-session', async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'T-shirt',
                        },
                        unit_amount: 400000, // 
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `https://lakindu.com/success.html`,
            cancel_url: `https://lakindu.com/cancel.html`,
        });
        
        // response payment gateway redirect urls as response
        res.json(status = 200, session);
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
