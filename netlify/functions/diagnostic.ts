// Diagnostic function to measure Netlify response times
// Access at: https://caloriebot.ai/.netlify/functions/diagnostic

export const handler = async (event, context) => {
  const startTime = Date.now();

  // Simulate a static file response
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Netlify Diagnostic</title>
  <meta charset="UTF-8">
</head>
<body>
  <h1>Netlify Performance Diagnostic</h1>
  <h2>Request Info</h2>
  <ul>
    <li><strong>Path:</strong> ${event.path}</li>
    <li><strong>Raw URL:</strong> ${event.rawUrl}</li>
    <li><strong>Method:</strong> ${event.httpMethod}</li>
    <li><strong>Headers:</strong> <pre>${JSON.stringify(event.headers, null, 2)}</pre></li>
  </ul>

  <h2>Timing</h2>
  <ul>
    <li><strong>Function Start:</strong> ${startTime}</li>
    <li><strong>Response Time:</strong> ${Date.now() - startTime}ms</li>
  </ul>

  <h2>Environment</h2>
  <ul>
    <li><strong>Node Version:</strong> ${process.version}</li>
    <li><strong>Region:</strong> ${process.env.AWS_REGION || 'unknown'}</li>
    <li><strong>Function Name:</strong> ${context.functionName || 'unknown'}</li>
  </ul>

  <h2>Analysis</h2>
  <p>If this function responds quickly (&lt;100ms) but your static pages are slow (1000ms+),
  the issue is likely:</p>
  <ul>
    <li>Netlify redirect processing overhead</li>
    <li>Edge network latency</li>
    <li>CDN cache misses</li>
    <li>Trailing slash redirects causing double requests</li>
  </ul>
</body>
</html>`;

  const responseTime = Date.now() - startTime;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
      'X-Diagnostic-Response-Time': `${responseTime}ms`,
      'X-Diagnostic-Timestamp': new Date().toISOString(),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
    body: html
  };
};

