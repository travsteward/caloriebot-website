const nodemailer = require('nodemailer');

// Configure email transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

exports.handler = async function(event, context) {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  try {
    const { name, email, message } = JSON.parse(event.body);

    // Validate inputs
    if (!name || !email || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Send email
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.CONTACT_EMAIL,
      subject: `New Contact Form Submission from ${name}`,
      text: `
Name: ${name}
Email: ${email}
Message:
${message}
      `,
      html: `
<h2>New Contact Form Submission</h2>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Message:</strong></p>
<p>${message.replace(/\n/g, '<br>')}</p>
      `,
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*', // Adjust this in production
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ message: 'Message sent successfully' }),
    };
  } catch (error) {
    console.error('Error processing contact form:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*', // Adjust this in production
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};