<script lang="ts">
	import '../app.css';
	import 'remixicon/fonts/remixicon.css';
	import { onMount } from 'svelte';
	import { navigating } from '$app/stores';
	import { browser } from '$app/environment';
  import { trackEvent } from '$lib/utils/analytics';
	import { page } from '$app/state';

	let { children } = $props();

	if (browser) {
		onMount(() => {
			// Track a website visit once per session.
			const sessionKey = 'hkr_session_visited';
			if (!sessionStorage.getItem(sessionKey)) {
				trackEvent('website_visit', { source: window.location.pathname });
				sessionStorage.setItem(sessionKey, 'true');
			}

			// Track initial page view, excluding the primary menu path.
			if (window.location.pathname !== page.data.primaryMenuPath) {
				trackEvent('page_view', { source: window.location.pathname });
			}

			// Track subsequent navigations, excluding the primary menu path.
			const unsubscribeNavigating = navigating.subscribe(($nav) => {
				if (
					$nav?.to?.url &&
					$nav.to.url.pathname !== window.location.pathname &&
					$nav.to.url.pathname !== page.data.primaryMenuPath
				) {
					trackEvent('page_view', { source: $nav.to.url.pathname });
				}
			});

			// Consolidated click handler for tracked data attributes
			const handleTrackedClick = (event: MouseEvent) => {
				const trackedAttributes = {
					'data-analytics-cta': 'cta_click',
					// 'data-analytics-redirect': 'redirect_click',
					'data-analytics-contact': 'contact_click'
				};

				for (const [attribute, eventType] of Object.entries(trackedAttributes)) {
					const element = (event.target as HTMLElement).closest(`[${attribute}]`);

					if (element) {
						const attributeValue = element.getAttribute(attribute);
						const textContent = element.textContent?.trim() || '';

						trackEvent(eventType, {
							name: textContent,
							source: window.location.pathname,
							target: attributeValue
						});
						
						// A click can only be one type, so we exit after finding the first match.
						return;
					}
				}
			};

			document.addEventListener('click', handleTrackedClick);

			return () => {
				unsubscribeNavigating();
				document.removeEventListener('click', handleTrackedClick);
			};
		});
	}
</script>

<svelte:head>
	<link rel="stylesheet" href="/assets/pannellum/pannellum.css" />
	<script type="text/javascript" src="/assets/pannellum/pannellum.js"></script>
	<!-- <script async src="https://www.google.com/recaptcha/api.js?render=6Lftu-cqAAAAAKR33Iaonf4Kf-vknPIsTTaVWSn0"></script> -->
	<title>HK Realtindo</title>
</svelte:head>

{@render children()}
