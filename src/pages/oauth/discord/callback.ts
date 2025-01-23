import type { APIRoute } from 'astro';
import Stripe from 'stripe';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const priceId = url.searchParams.get('state');

  console.log('Received callback:', { code, priceId });  // Debug log

  if (!code || !priceId) {
    console.error('Missing code or priceId');
    return new Response('Missing required parameters', { status: 400 });
  }

  try {
    // Get Discord token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: import.meta.env.DISCORD_CLIENT_ID,
        client_secret: import.meta.env.DISCORD_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${import.meta.env.PUBLIC_SITE_URL}/oauth/discord/callback`,
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();

    // Get user info and save to DB (implement your DB logic here)
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to get user info');
    }

    const userData = await userResponse.json();

    // TODO: Save userData to your database here
    console.log('Discord user data:', userData);

    // Create Stripe session with just the price ID
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${import.meta.env.PUBLIC_SITE_URL}/success`,
      cancel_url: `${import.meta.env.PUBLIC_SITE_URL}/cancel`,
      metadata: {
        discord_id: userData.id  // Just pass the discord ID for reference
      }
    });

    return new Response(null, {
      status: 302,
      headers: {
        Location: session.url || '/error',
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/error?message=failed-to-process',
      },
    });
  }
};