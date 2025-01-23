import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const priceId = url.searchParams.get('state');

  console.log('Received callback with:', { code, priceId });

  if (!code || !priceId) {
    const errorMessage = `Missing required parameters - Received: code=${code}, priceId=${priceId}`;
    console.error(errorMessage);
    return new Response(errorMessage, {
      status: 400,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
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

    // Get Discord user info
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to get user info');
    }

    const userData = await userResponse.json();

    // Call our Stripe checkout function
    const response = await fetch('/.netlify/functions/stripe-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId: priceId,
        discordId: userData.id
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Stripe checkout error:', errorData);
      throw new Error('Failed to create checkout session');
    }

    const responseData = await response.json();
    console.log('Stripe response:', responseData);

    if (!responseData.sessionId) {
      throw new Error('No session ID in response');
    }

    // Redirect to Stripe checkout
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/checkout?session_id=${responseData.sessionId}`,
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