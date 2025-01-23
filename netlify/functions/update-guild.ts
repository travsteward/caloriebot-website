import { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  console.log('Update Guild function triggered');
  console.log('Event:', {
    httpMethod: event.httpMethod,
    body: event.body,
    headers: event.headers
  });

  if (event.httpMethod !== 'POST') {
    console.log('Invalid HTTP method:', event.httpMethod);
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { sessionId, guildId } = JSON.parse(event.body || '{}');
    console.log('Parsed request data:', { sessionId, guildId });

    if (!sessionId || !guildId) {
      console.log('Missing required parameters:', { sessionId, guildId });
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required parameters' })
      };
    }

    const apiUrl = `${process.env.CALORIEBOT_API_URL}/subscriptions/update-guild`;
    console.log('Calling API:', {
      url: apiUrl,
      sessionId,
      guildId
    });

    // Call the bot's API to update the guild
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CALORIEBOT_API_KEY}`
      },
      body: JSON.stringify({
        sessionId,
        guildId
      })
    });

    const responseData = await response.json();
    console.log('API Response:', {
      status: response.status,
      ok: response.ok,
      data: responseData
    });

    if (!response.ok) {
      throw new Error(`Failed to update guild: ${JSON.stringify(responseData)}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('Error in update-guild function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};