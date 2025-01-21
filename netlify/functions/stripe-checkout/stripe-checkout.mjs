const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  console.log('Function started');
  console.log('Request body:', event.body);

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { priceId } = JSON.parse(event.body);
    console.log('Price ID received:', priceId);

    // Create Checkout Session with the actual price ID
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

    console.log('Session created successfully');
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sessionId: session.id })
    };
  } catch (error) {
    console.error('Detailed error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: error.message,
        type: error.type
      })
    };
  }
};