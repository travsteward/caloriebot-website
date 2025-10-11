import type { APIRoute } from 'astro';

const INDEXNOW_API_KEY = 'caloriebot-indexnow-key-2024';
const BASE_URL = 'https://caloriebot.ai';

interface IndexNowSubmission {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
}

async function submitToIndexNow(urls: string[]): Promise<{ success: boolean; message: string }> {
  try {
    const submission: IndexNowSubmission = {
      host: 'caloriebot.ai',
      key: INDEXNOW_API_KEY,
      keyLocation: `${BASE_URL}/indexnow-key.txt`,
      urlList: urls
    };

    // Submit to Microsoft IndexNow with timeout
    const microsoftPromise = fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submission),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    // Submit to Yandex IndexNow with timeout
    const yandexPromise = fetch('https://yandex.com/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submission),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    // Wait for both submissions with timeout
    const results = await Promise.allSettled([microsoftPromise, yandexPromise]);

    const microsoftResult = results[0];
    const yandexResult = results[1];

    const microsoftSuccess = microsoftResult.status === 'fulfilled' && microsoftResult.value.ok;
    const yandexSuccess = yandexResult.status === 'fulfilled' && yandexResult.value.ok;

    if (microsoftSuccess && yandexSuccess) {
      return {
        success: true,
        message: `Successfully submitted ${urls.length} URLs to Microsoft and Yandex IndexNow`
      };
    } else {
      const errors = [];
      if (microsoftResult.status === 'rejected') {
        errors.push(`Microsoft: ${microsoftResult.reason?.message || 'Unknown error'}`);
      }
      if (yandexResult.status === 'rejected') {
        errors.push(`Yandex: ${yandexResult.reason?.message || 'Unknown error'}`);
      }

      return {
        success: false,
        message: `Partial success - Microsoft: ${microsoftSuccess}, Yandex: ${yandexSuccess}. ${errors.length ? 'Errors: ' + errors.join(', ') : ''}`
      };
    }
  } catch (error) {
    console.error('IndexNow submission error:', error);
    return {
      success: false,
      message: `Error submitting to IndexNow: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { urls } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'URLs array is required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Validate URLs
    const validUrls = urls.filter(url => {
      try {
        const urlObj = new URL(url);
        return urlObj.hostname === 'caloriebot.ai';
      } catch {
        return false;
      }
    });

    if (validUrls.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'No valid URLs provided'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const result = await submitToIndexNow(validUrls);

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({
    message: 'IndexNow API endpoint',
    usage: 'POST with { "urls": ["https://caloriebot.ai/page1", "https://caloriebot.ai/page2"] }',
    key: INDEXNOW_API_KEY,
    keyLocation: `${BASE_URL}/indexnow-key.txt`
  }), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
};
