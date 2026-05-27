<script lang="ts">
  import type { HTMLAnchorAttributes, HTMLButtonAttributes } from "svelte/elements";

  const {
    children,
    size = 'wide',
    variant = 'filled',
    color = 'primary',
    effect = 'default',
    href,
    type = 'button',
    ...restProps
  } = $props<{
    size?: 'wide' | 'square' | 'hero';
    variant?: 'filled' | 'tonal' | 'outlined' | 'text' | 'tab';
    color?: 'primary' | 'primary-container' | 'secondary' | 'secondary-container' | 'tertiary' | 'tertiary-container';
    effect?: 'default' | 'none' | 'strong';
    href?: HTMLAnchorAttributes['href'];
    type?: HTMLButtonAttributes['type'],
    [key: string]: any;
  }>();
  
  const classMap: any = {
    color: {
      primary: 'bg-primary text-on-primary before:bg-surface/10 active:before:bg-surface/20',
      'primary-container': 'bg-primary-container text-on-surface before:bg-on-surface/5 active:before:bg-on-surface/10',
      secondary: 'bg-secondary text-on-primary before:bg-surface/10 active:before:bg-surface/20',
      'secondary-container': 'bg-secondary-container text-on-surface before:bg-on-surface/5 active:before:bg-on-surface/10',
      tertiary: 'bg-tertiary text-on-surface before:bg-on-surface/5 active:before:bg-on-surface/10',
      'tertiary-container': 'bg-tertiary-container text-on-surface before:bg-on-surface/5 active:before:bg-on-surface/10',
    },
    variant: {
      filled: '',
      tonal: 'bg-primary-container text-on-surface before:bg-on-surface/5 active:before:bg-on-surface/10',
      outlined: 'border border-black/20 text-on-surface before:bg-on-surface/5 active:before:bg-on-surface/10',
      text: 'bg-transparent text-on-surface before:bg-on-surface/5 active:before:bg-on-surface/10',
      tab: 'bg-transparent text-on-surface',
    },
    size: {
      square: 'p-3 aspect-square',
      wide: 'px-6 py-3 text-sm font-semibold',
      hero: 'h-12 px-8 text-lg font-semibold',
    },
    effect: {
      default: 'shadow-sm transition-all duration-200 ease-out hover:shadow-md hover:scale-[1.01] active:scale-[0.99]',
      none: '',
      strong: 'shadow-sm transition-all duration-200 ease-out hover:shadow-md hover:scale-[1.02] active:scale-95',
    }
  }
</script>

{#if href}
  <a
    {...restProps}
    {href}
    class="inline-flex flex-row gap-2 items-center justify-center rounded-full {!restProps.disabled ? 'overlay' : ''} {restProps.class} {classMap.color[color]} {classMap.variant[variant]} {classMap.size[size]} {classMap.effect[effect]}"
  >
    {@render children()}
  </a>
{:else}
  <button
    {...restProps}
    {type}
    class="inline-flex flex-row gap-2 items-center justify-center rounded-full disabled:bg-outline-variant disabled:text-on-surface/50 disabled:shadow-none {!restProps.disabled ? 'overlay' : ''} {restProps.class} {classMap.color[color]} {classMap.variant[variant]} {classMap.size[size]} {classMap.effect[effect]}"
  >
    {@render children()}
  </button>
{/if}
