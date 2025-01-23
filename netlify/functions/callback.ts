import type { APIRoute } from 'astro';

// Export a handler function for Netlify
export const handler = async (event, context) => {
  console.log('Raw Request URL:', event.rawUrl);

  const url = new URL(event.rawUrl);
  const searchParams = url.searchParams;
  console.log('Search Params:', Array.from(searchParams.entries()));

  const code = searchParams.get('code');
  const priceId = searchParams.get('state');

  console.log('Parsed from request:', {
    code,
    priceId,
    fullUrl: event.rawUrl,
    searchParams: searchParams.toString()
  });

  if (!code || !priceId) {
    const errorMessage = `Missing required parameters - Received: code=${code}, priceId=${priceId}.
    Full URL: ${event.rawUrl}`;
    console.error(errorMessage);
    return {
      statusCode: 400,
      body: errorMessage,
      headers: {
        'Content-Type': 'text/plain'
      }
    };
  }

  try {
    // Get Discord token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: 'https://caloriebot.ai/oauth/discord/callback',
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

    // Call Stripe checkout function
    const response = await fetch('https://caloriebot.ai/.netlify/functions/stripe-checkout', {
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

    // Redirect to Stripe's checkout URL with strict headers
    return {
      statusCode: 302,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Location': responseData.url,  // Use Stripe's provided URL
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*'
      },
      body: ''
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 302,
      headers: {
        Location: '/error?message=failed-to-process',
      },
    };
  }
};