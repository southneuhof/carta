import { json } from '@sveltejs/kit';

export function GET({ url }) {
  return json({data: 'test'})
}