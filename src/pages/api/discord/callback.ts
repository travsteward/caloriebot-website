import type { APIRoute } from 'astro';
import Stripe from 'stripe';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const stripeSessionId = url.searchParams.get('state') || url.searchParams.get('session_id');

  if (!code || !stripeSessionId) {
    return new Response('Missing required parameters', { status: 400 });
  }

  try {
    // Get Stripe session data to get customer email
    const stripeSession = await stripe.checkout.sessions.retrieve(stripeSessionId);
    const stripeEmail = stripeSession.customer_details?.email;

    // Exchange code for Discord token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: import.meta.env.DISCORD_CLIENT_ID,
        client_secret: import.meta.env.DISCORD_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${import.meta.env.PUBLIC_SITE_URL}/api/discord/callback`,
        scope: 'identify email',
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const tokenData = await tokenResponse.json();

    // Get Discord user info including email
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();

    // Send subscription data to CalorieBot's Heroku app
    const botResponse = await fetch(`${import.meta.env.CALORIEBOT_API_URL}/subscriptions/link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.CALORIEBOT_API_KEY}`
      },
      body: JSON.stringify({
        discord_id: userData.id,
        discord_email: userData.email,
        discord_username: userData.username,
        stripe_email: stripeEmail,
        stripe_session_id: stripeSessionId,
        stripe_subscription_id: stripeSession.subscription,
      }),
    });

    if (!botResponse.ok) {
      throw new Error('Failed to link subscription with CalorieBot');
    }

    // Redirect to dashboard
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/dashboard',
      },
    });
  } catch (error) {
    console.error('Discord callback error:', error);
    return new Response('Failed to process Discord connection', { status: 500 });
  }
};