<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  
  const dispatch = createEventDispatcher<{
    verify: { token: string };
    error: Error;
    expired: void;
  }>();
  
  export let sitekey: string;
  export let action = 'submit';
  
  let widgetId: number | null = null;
  
  onMount(() => {
    if (typeof window.grecaptcha === 'undefined') {
      const error = new Error('reCAPTCHA has not been loaded');
      console.error(error);
      dispatch('error', error);
      return;
    }
    
    const executeRecaptcha = async () => {
      try {
        const token = await window.grecaptcha.execute(sitekey, { action });
        dispatch('verify', { token });
      } catch (error) {
        console.error('reCAPTCHA error:', error);
        dispatch('error', error instanceof Error ? error : new Error(String(error)));
      }
    };
    
    // Execute reCAPTCHA when component mounts
    window.grecaptcha.ready(executeRecaptcha);
    
    // Cleanup function
    return () => {
      if (widgetId !== null) {
        window.grecaptcha.ready(() => {
          window.grecaptcha.reset(widgetId!);
        });
      }
    };
  });
</script>

<!-- This element is required for reCAPTCHA -->
<div class="g-recaptcha" data-sitekey={sitekey} data-size="invisible"></div>
