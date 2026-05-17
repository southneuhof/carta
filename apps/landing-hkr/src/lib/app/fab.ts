import { writable } from 'svelte/store';

export type Fab = {
  component: ConstructorOfATypedSvelteComponent;
  props: any;
};

export const fabStore = writable<null | Fab>(null);
