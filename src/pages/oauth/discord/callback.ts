import type { APIRoute } from 'astro';
import Stripe from 'stripe';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const priceId = url.searchParams.get('state');

  if (!code || !priceId) {
    console.error('Missing parameters:', { code, priceId });
    return new Response('Missing required parameters', { status: 400 });
  }

  try {
    // Exchange code for Discord token
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
      const error = await tokenResponse.text();
      console.error('Discord token error:', error);
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();

    // Get Discord user info
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      const error = await userResponse.text();
      console.error('Discord user info error:', error);
      throw new Error('Failed to get Discord user info');
    }

    const userData = await userResponse.json();

    // Create Stripe checkout session with Discord data
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${import.meta.env.PUBLIC_SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}&discord_token=${tokenData.access_token}`,
      cancel_url: `${import.meta.env.PUBLIC_SITE_URL}/cancel`,
      metadata: {
        discord_id: userData.id,
        discord_email: userData.email,
        discord_username: userData.username,
        discord_token: tokenData.access_token
      }
    });

    // Redirect to Stripe checkout
    return new Response(null, {
      status: 302,
      headers: {
        Location: session.url || '/error',
      },
    });
  } catch (error) {
    console.error('Discord callback error:', error);
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/error?message=failed-to-process',
      },
    });
  }
};