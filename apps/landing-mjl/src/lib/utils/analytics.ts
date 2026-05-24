import { browser } from '$app/environment';

export function trackEvent(type: string, data: Record<string, any>) {
  if (!browser) return;

  const payload = {
    type,
    ...data
  };

  navigator.sendBeacon('/api/public/analytics', JSON.stringify(payload));
}