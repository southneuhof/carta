declare module 'svelte' {
  interface HTMLAttributes<T> {
    'bind:this'?: T;
  }
}

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
      reset: (widgetId?: number) => void;
    };
  }
}

export {};
