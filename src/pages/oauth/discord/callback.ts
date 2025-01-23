import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  console.log('Received callback with code:', code);

  if (!code) {
    console.error('Missing code parameter');
    return new Response('Missing required parameters', { status: 400 });
  }

  try {
    console.log('Exchanging code for token...');
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
    console.log('Got token data:', tokenData);

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

    // Redirect back to pricing page with Discord data
    return new Response(null, {
      status: 302,
      headers: {
        Location: `/pricing?discord_id=${userData.id}&discord_token=${tokenData.access_token}`,
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