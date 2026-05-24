import { success } from '$lib/utils/response.js';

export function GET() {
  return success({message: 'in main public'})
}