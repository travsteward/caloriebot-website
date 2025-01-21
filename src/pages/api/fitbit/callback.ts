import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!code || !state) {
    return new Response('Missing required parameters', { status: 400 });
  }

  try {
    // Option 1: Forward to bot's API endpoint
    const botResponse = await fetch('https://plate-method-discord-bot.herokuapp.com/fitbit/callback', {
      method: 'POST',
      body: JSON.stringify({ code, state }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!botResponse.ok) {
      throw new Error('Failed to forward to bot API');
    }

    // Return success HTML page
    return new Response(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Fitbit Connected</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              background: #23272A;
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              text-align: center;
            }
            .container {
              background: #2C2F33;
              padding: 2rem;
              border-radius: 0.5rem;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            h1 {
              color: #5865F2;
              margin-bottom: 1rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Successfully Connected!</h1>
            <p>Your Fitbit account has been connected to CalorieBot.</p>
            <p>You can close this window now.</p>
          </div>
        </body>
      </html>
    `, {
      headers: {
        'Content-Type': 'text/html'
      }
    });
  } catch (error) {
    console.error('Fitbit callback error:', error);
    return new Response('Failed to process Fitbit connection', { status: 500 });
  }
};