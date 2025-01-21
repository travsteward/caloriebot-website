const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method not allowed' }),
    };
  }

  try {
    const { priceId } = JSON.parse(event.body);

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

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId, // Use the priceId directly since it matches Stripe's format
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.PUBLIC_SITE_URL}/success`,
      cancel_url: `${process.env.PUBLIC_SITE_URL}/cancel`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ sessionId: session.id }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};