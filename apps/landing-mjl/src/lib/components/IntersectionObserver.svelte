<script lang="ts">
  import { onMount } from 'svelte';

  // export let threshold = 0.1;
  // export let rootMargin = '0px 0px -50px 0px';
  // export let once = true;
  // export let animationDelay = 0;
  // export let animationDirection: 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'zoom-in' | 'none' = 'fade-up';

  const {
    threshold = 0.1,
    rootMargin = '0px 0px -50px 0px',
    once = true,
    animationDelay = 0,
    animationDirection = 'fade-up',
    children
  } = $props()

  let isIntersecting = $state(false);
  let hasAnimated = $state(false);
  let element = $state<HTMLElement>()

  let animationClass = $derived.by(() => getAnimationClass(animationDirection));
  let shouldAnimate = $derived.by(() => {
    if (once) {
      return isIntersecting && hasAnimated;
    }
    return isIntersecting;
  });

  function getAnimationClass(direction: string) {
    const base = 'animate-on-scroll';
    switch (direction) {
      case 'fade-up': return `${base} fade-up`;
      case 'fade-down': return `${base} fade-down`;
      case 'fade-left': return `${base} fade-left`;
      case 'fade-right': return `${base} fade-right`;
      case 'zoom-in': return `${base} zoom-in`;
      default: return base;
    }
  }

  let triggerCount = $state(0)

  onMount(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    // Wait for the element to be fully mounted and rendered
    // This is especially important for async-loaded components
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          triggerCount++
          console.log('trigger', triggerCount, entry.isIntersecting)
          
          // Only process if element is actually in viewport
          if (entry.isIntersecting) {
            isIntersecting = true;
            hasAnimated = true;
            
            if (once) {
              observer.unobserve(entry.target);
            }
          } else if (!once) {
            isIntersecting = false;
          }
        });
      },
      { 
        threshold, 
        rootMargin
      }
    );

    setTimeout(() => {
      if (!element) return;

      setTimeout(() => {
        observer.observe(element as Element);
      }, 100);
    }, 100);

    return () => {
      if (element) {
        observer.unobserve(element as Element);
      }
    };
  })
</script>

<div 
  bind:this={element} 
  class="overflow-hidden {shouldAnimate ? 'is-visible' : ''} {animationClass}"
  style="transition-delay: {animationDelay}ms"
  class:is-hidden={!shouldAnimate}
>
  <div class="overflow-hidden">
    {@render children()}
  </div>
</div>

<style>
  .animate-on-scroll {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.6s ease-out, transform 0.6s ease-out;
  }

  .animate-on-scroll.fade-up {
    transform: translateY(20px);
  }

  .animate-on-scroll.fade-down {
    transform: translateY(-20px);
  }

  .animate-on-scroll.fade-left {
    transform: translateX(20px);
  }

  .animate-on-scroll.fade-right {
    transform: translateX(-20px);
  }

  .animate-on-scroll.zoom-in {
    transform: scale(0.9);
  }

  .animate-on-scroll.is-visible {
    opacity: 1;
    transform: translateY(0) translateX(0) scale(1);
  }

  .animate-on-scroll.is-hidden {
    opacity: 0;
  }
</style>