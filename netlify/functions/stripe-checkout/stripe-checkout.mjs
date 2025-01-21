const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  console.log('Function started');
  console.log('Request body:', event.body);

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method not allowed' }),
    };
  }

  try {
    const { priceId } = JSON.parse(event.body);
    console.log('Price ID received:', priceId);

    // Price ID mapping - using exact IDs from pricing.astro
    const PRICE_IDS = {
      price_starter_id: 'price_starter_id',
      price_growth_id: 'price_growth_id',
      price_pro_id: 'price_pro_id',
      price_elite_id: 'price_elite_id'
    };

    // Validate price ID
    if (!priceId || !PRICE_IDS[priceId]) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid price ID' }),
      };
    }

    // Create Checkout Session
    console.log('Creating checkout session...');
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.PUBLIC_SITE_URL}/success`,
      cancel_url: `${process.env.PUBLIC_SITE_URL}/cancel`,
    });

    console.log('Session created:', session.id);
    return {
      statusCode: 200,
      body: JSON.stringify({ sessionId: session.id }),
    };
  } catch (error) {
    console.error('Detailed error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        stack: error.stack
      }),
    };
  }
};