import { json, type Handle } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { sequence } from '@sveltejs/kit/hooks';
import { building } from '$app/environment';
import { auth } from '$lib/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { addCorsHeaders, handleCorsPreflightRequest, hydrateRequestAuth, isProtectedRoute, requireAuthenticatedUser } from '$lib/utils/routing';

const handleParaglide: Handle = ({ event, resolve }) => paraglideMiddleware(event.request, ({ request, locale }) => {
	event.request = request;

	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
	});
});

export const customHandle: Handle = async ({ resolve, event }) => {
  const { url, request } = event

  // Handle API routes
  if (url.pathname.startsWith('/api')) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') return handleCorsPreflightRequest(request)
  }

  try {
    await hydrateRequestAuth(event);
  } catch (err) {
    console.error('Failed to hydrate request auth:', err);
    event.locals.auth = null;
    event.locals.user = null;
    event.locals.isPrivilegedRole = false;
  }

  if (url.pathname.startsWith('/api')) {
    // Check authentication for protected routes
    if (isProtectedRoute(url.pathname)) {
      try {
        requireAuthenticatedUser(event.locals)
      } catch (err) {
        console.error('No user:', err);
        return addCorsHeaders(json({ message: 'Forbidden' }, { status: 401 }), request);
      }
    }
  }

  // Process the request and add CORS headers
  const response = await resolve(event)
  return addCorsHeaders(response, request)
}

const handleBetterAuth: Handle = async ({ event, resolve }) => {
  if (event.request.method === 'OPTIONS' && event.url.pathname.startsWith('/api/auth')) {
    return handleCorsPreflightRequest(event.request);
  }

  const response = await svelteKitHandler({
    auth,
    event,
    resolve,
    building,
  });

  if (event.url.pathname === '/api/auth/sign-in/email' && response.status === 401) {
    return addCorsHeaders(
      json({ message: 'Invalid credentials' }, { status: 403 }),
      event.request,
    );
  }

  if (event.url.pathname.startsWith('/api/auth')) {
    return addCorsHeaders(response, event.request);
  }

  return response;
};

export const handle = sequence(handleBetterAuth, customHandle, handleParaglide)
