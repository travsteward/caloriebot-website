const { Resend } = require('resend');

const resend = new Resend('re_HHTwoZh3_DqSqRi3QUL2xDUgmvGVTWtSM');

exports.handler = async function(event, context) {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  try {
    console.log('Received request body:', event.body);
    const { name, email, message } = JSON.parse(event.body);

    // Validate inputs
    if (!name || !email || !message) {
      console.log('Missing fields:', { name, email, message });
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    console.log('Attempting to send email with data:', { name, email });

    // Send email using Resend
    const result = await resend.emails.send({
      from: 'CalorieBot <noreply@caloriebot.ai>',
      to: ['travis.steward@gmail.com'],
      subject: `New Contact Form Submission from ${name}`,
      reply_to: email,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    });

    console.log('Resend API response:', result);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ message: 'Message sent successfully' }),
    };
  } catch (error) {
    console.error('Detailed error:', {
      message: error.message,
      stack: error.stack,
      details: error.response?.data || error.response || error
    });

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }),
    };
  }
};