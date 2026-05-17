import type { ParamMatcher } from '@sveltejs/kit';

export const match = ((param: string): param is ('private' | 'public') => {
	return param === 'private' || param === 'public';
}) satisfies ParamMatcher;