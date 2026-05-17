import { modelAPI } from '$lib/server/model-api';

export async function GET(event: any) {
  const url = new URL(event.url);

  if (event.params?.id && !url.searchParams.has('id')) {
    url.searchParams.set('id', event.params.id);
  }

  return modelAPI.detail({
    ...event,
    url,
  });
}
