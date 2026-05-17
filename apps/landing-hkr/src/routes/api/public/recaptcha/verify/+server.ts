import { json, type RequestHandler } from '@sveltejs/kit';
import { RECAPTCHA_SECRETKEY } from '$env/static/private';

async function verifyRecaptcha(token: string): Promise<{ success: boolean; score?: number; errorCodes?: string[] }> {
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${encodeURIComponent(RECAPTCHA_SECRETKEY)}&response=${encodeURIComponent(token)}`,
    });

    return await response.json();
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return { success: false, errorCodes: ['connection-error'] };
  }
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { token } = await request.json();

    if (!token) {
      return json(
        { success: false, error: 'Missing token' },
        { status: 400 }
      );
    }

    const verification = await verifyRecaptcha(token);

    if (!verification.success) {
      return json(
        { 
          success: false, 
          error: 'reCAPTCHA verification failed',
          score: verification.score,
          errorCodes: verification.errorCodes
        },
        { status: 400 }
      );
    }

    return json({ 
      success: true, 
      score: verification.score 
    });

  } catch (error) {
    console.error('Error in reCAPTCHA verification:', error);
    return json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
};

export const GET: RequestHandler = async () => {
  return json({ message: 'reCAPTCHA verification endpoint is running' });
};