import type { Language } from '@prisma/client';

export function isEmptyObject(object: Record<any, any>) {
  return Object.keys(object).length === 0 && object.constructor === Object;
}

export function getLanguagePrefix(pathname: string): string | null {
  const match = pathname.match(/[^/]+?(?=\/|$)/);
  return match ? match[0] : null;
}

export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

export const languages: Language[] = ['id', 'en'];

let n = Date.now();

export function useId() {
  return (++n).toString(36);
}

export const defer = () => {
  let res: (value?: unknown) => void;
  let rej: (reason?: unknown) => void;

  const promise: any = new Promise((resolve, reject) => {
    res = resolve;
    rej = reject;
  });

  promise.resolve = res!;
  promise.reject = rej!;

  return promise;
};

export { parseSearchParams, parseSlug } from '@southneuhof/landing-sveltekit-framework';
