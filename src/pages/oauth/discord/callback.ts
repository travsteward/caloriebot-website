import type { APIRoute } from 'astro';
import Stripe from 'stripe';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const guildId = url.searchParams.get('guild_id');
  const permissions = url.searchParams.get('permissions');
  const state = url.searchParams.get('state'); // This is our stripe session ID from earlier

  if (!code || !state) {
    console.error('Missing parameters:', { code, state });
    return new Response('Missing required parameters', { status: 400 });
  }

  try {
    // First, validate the state parameter matches our session ID
    const stripeSession = await stripe.checkout.sessions.retrieve(state);
    const stripeEmail = stripeSession.customer_details?.email;

    // Exchange code for Discord token using proper authentication
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

    // Get Discord user info including email
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

    // Send subscription data to CalorieBot's API
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
        stripe_session_id: state,
        stripe_subscription_id: stripeSession.subscription,
        guild_id: guildId,
        permissions: permissions
      }),
    });

    if (!botResponse.ok) {
      const error = await botResponse.text();
      console.error('Bot API error:', error);
      throw new Error('Failed to link subscription with CalorieBot');
    }

    // Redirect to dashboard
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/dashboard?setup=complete',
      },
    });
  } catch (error) {
    console.error('Discord callback error:', error);
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/error?message=failed-to-link-account',
      },
    });
  }
};