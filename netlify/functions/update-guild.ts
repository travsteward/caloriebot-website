import { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { sessionId, guildId } = JSON.parse(event.body || '{}');

    // Call the bot's API to update the guild
    const response = await fetch(`${process.env.CALORIEBOT_API_URL}/subscriptions/update-guild`, {
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

    if (!response.ok) {
      throw new Error('Failed to update guild');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};