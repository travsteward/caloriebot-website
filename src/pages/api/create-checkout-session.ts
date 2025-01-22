import type { APIRoute } from 'astro';
import Stripe from 'stripe';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const { priceId } = await request.json();

    // Add logging
    console.log('PUBLIC_SITE_URL:', import.meta.env.PUBLIC_SITE_URL);
    console.log('Success URL:', `${import.meta.env.PUBLIC_SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`);

    // Only allow Pro plan price ID
    if (priceId !== 'price_pro_id') {
      return new Response(
        JSON.stringify({ error: 'Invalid price ID' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${import.meta.env.PUBLIC_SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${import.meta.env.PUBLIC_SITE_URL}/cancel`,
    });

    // Add logging
    console.log('Created session:', session.id);
    console.log('Full session:', session);

    return new Response(
      JSON.stringify({ sessionId: session.id }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create checkout session' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}