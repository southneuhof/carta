import { json } from '@sveltejs/kit';
import prisma from '$lib/utils/prisma';

export async function POST({ request }) {
  // Get IP address (from headers or fallback)
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  // Get user agent
  const userAgent = request.headers.get('user-agent') || '';

  // Store visit in the database
  await prisma.websiteVisit.create({
    data: {
      ip_address: ip,
      user_agent: userAgent
    }
  });

  return json({ success: true });
}