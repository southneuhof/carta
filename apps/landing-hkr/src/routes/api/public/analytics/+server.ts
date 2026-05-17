import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/utils/prisma';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();

    // Basic validation
    const type = typeof body?.type === 'string' ? body.type : '';
    if (!type) {
      return json({ success: false, error: 'Event type is required' }, { status: 400 });
    }

    // Allowed event types coming from the public site
    const allowedTypes = new Set(['website_visit', 'page_view', 'cta_click', 'contact_click']);
    if (!allowedTypes.has(type)) {
      return json({ success: false, error: 'Invalid event type' }, { status: 400 });
    }

    // Helper to sanitize string fields
    const sanitize = (v: unknown, max = 120) => {
      if (typeof v !== 'string') return undefined;
      // Trim, collapse whitespace, and cap length
      const s = v.replace(/\s+/g, ' ').trim().slice(0, max);
      return s || undefined;
    };

    // Whitelist fields per type
    // All events capture source (path). Clicks also capture target (data attribute) and optional readable name
    const source = sanitize(body?.source, 200);
    const target = sanitize(body?.target, 200);
    const name = sanitize(body?.name, 200);

    // Required fields per event
    if ((type === 'website_visit' || type === 'page_view') && !source) {
      return json({ success: false, error: 'Missing source' }, { status: 400 });
    }
    if ((type === 'cta_click' || type === 'contact_click') && (!source || !target)) {
      return json({ success: false, error: 'Missing source/target' }, { status: 400 });
    }

    const data: {
      type: string;
      source: string;
      target?: string;
      name?: string;
    } = {
      type,
      source: source as string
    };

    if (target) data.target = target;
    if (name) data.name = name;

    await prisma.analyticsEvent.create({
      data
    });

    return json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Failed to process analytics event:', error);
    // Don't return detailed error to the client for security
    return json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
};

// Disable prerendering for this endpoint
export const prerender = false;
