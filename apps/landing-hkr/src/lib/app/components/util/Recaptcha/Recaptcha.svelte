<!------------------------------------------------- definition ----;

          ,\       Component: Recaptcha.svelte
         \\\,_
          \` ,\    Externally loads Google Recaptcha with defer and
     __,.-" =__)   async to avoid rendering issues. Once on:load
   ."        )     fires, our component will attach `recaptcha`
,_/   ,    \/\_    object back to svelte.
\_|    )_-\ \_-`
   `-----` `--`    Exports { Recaptcha, recaptcha, observer} as module
                   which can then be accessed by parent components.

|-----------------------------------------------------------------┐
                                                               └-->
<script context="module" lang="ts">
  // @ts-nocheck
	import { defer } from '$lib/utils/common';

	//svelte-ignore unused-export-let
	export let recaptcha: any;
	/*google method, gives you recaptcha.execute()*/

	//svelte-ignore unused-export-let
	export let observer = defer();
	/*captcha observer, tracks recaptcha.execute*/
</script>

<!----------------------------------------------------------------┐
                                                                                                                               └-->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { onMount, onDestroy } from 'svelte';
	import { default as createDebug } from 'debug';
	import { browser } from '$app/environment';

	const dbg = createDebug('{Recaptcha}');
	const debug = dbg;
	const dispatch = createEventDispatcher();

	export let sitekey;

	export let badge = 'top';
	/*inline|bottomleft|bottomright*/

	export let size = 'invisible';
	/*invisible|normal|compact*/

	export let sleepTime = 0;
	/*wait time before starting injection*/

	let instanceId: any = null;
	/*behold the recaptcha instance*/

	let retryTimer = null;
	/*setInterval tracker for captcha*/

	let wait: any = null;
	/*promise to wait*/

	let recaptchaModal: any = null;
	/*div that houses recaptcha iframe*/

	let iframeSrc = 'google.com/recaptcha/api2/bframe';
	/*src path of google's injected iframe - used with the timer*/

	let openObserver: any = null;
	/*observer tracker*/

	let closeObserver: any = null;
	/*observer tracker*/

	/*---------------------------------------------| dispatchers |--*/

	const eventEmitters = {
		onExpired: async () => {
			console.log('expired?');
			recaptcha.reset(instanceId);
		},
		onError: async (err: any) => {
			const debug = dbg.extend('onError');
			console.log('an error occured during initialization');
			dispatch('error', { msg: 'please check your site key' });
			(captcha.errors as any).push('empty');
			recaptcha.reset(instanceId);
		},
		onSuccess: async (token: any) => {
			const debug = dbg.extend('onSuccess');
			console.log('dispatching success, we have a token');
			dispatch('success', { msg: 'ok', token: token });

			setTimeout(() => recaptcha.reset(instanceId), 1000);
			console.log('resetting, google needs allowed time if visible recaptcha..');

			observer = defer();
			console.log('resetting observer');
		},
		onReady: () => {
			const debug = dbg.extend('onReady');
			dispatch('ready');
			console.log('captcha is ready and available in DOM');
		},
		onOpen: (mutations: any) => {
			const debug = dbg.extend('onOpen');
			dispatch('open');
			console.log('captcha decided to ask a challange');
		},
		onClose: (mutations: any) => {
			const debug = dbg.extend('onClose');
			if (browser && mutations.length === 1 && !(window as any).grecaptcha.getResponse()) {
				console.log('captcha window was closed');
				dispatch('close');
			} /*
                                                                           │close mutation fires twice, probably because
                                                                           │of event bubbling or something. we also want
                                                                           │to avoid signalling when user solves the captcha.
                                                                           */
		}
	}; /*
                                                                    │these emitters are referenced to google recaptcha so
                                                                    │we can track its status through svelte.
                                                                    */

	/*------------------------------------------| event-handlers |--*/

	const captcha: any = {
		ready: false,
		/*captcha loading state*/

		errors: [],

		retryTimer: false,
		/*setInterval timer to update state*/

		isLoaded: () => {
			const debug = dbg.extend('isLoaded');
			captcha.ready =
				browser &&
				window &&
				(window as any).grecaptcha &&
				(window as any).grecaptcha.ready &&
				(document.getElementsByTagName('iframe') as any).find((x: any) => {
					return x.src.includes(iframeSrc);
				})
					? true
					: false;
			console.log('captcha.isLoaded(): ' + captcha.ready);
			return captcha.ready;
		},
		stopTimer: () => {
			const debug = dbg.extend('stopTimer');
			console.log('stopping timer');
			(clearInterval as any)(captcha.retryTimer);
		},
		startTimer: () => {
			const debug = dbg.extend('startTimer');
			console.log('check in 1s intervals');

			captcha.retryTimer = setInterval(() => {
				console.log('checking every second');
				if (captcha.isLoaded()) {
					captcha.stopTimer();
					captcha.modal();
					captcha.openHandle();
					captcha.closeHandle();
					eventEmitters.onReady();
				}

				if (captcha.errors.length > 3) {
					captcha.wipe();
					console.log('too many errors, no recaptcha for you at this  time');
				}
			}, 1000);
		},

		modal: () => {
			const debug = dbg.extend('modal');
			console.log('finding recaptcha iframe');

			const iframe = document.getElementsByTagName('iframe');
			recaptchaModal = (iframe as any).find((x: any) => {
				return x.src.includes(iframeSrc);
			}).parentNode.parentNode;
		},

		openHandle: () => {
			const debug = dbg.extend('openHandler');
			console.log('adding observer');

			openObserver = new MutationObserver((x) => {
				return recaptchaModal.style.opacity == 1 && eventEmitters.onOpen(x);
			});

			openObserver.observe(recaptchaModal, {
				attributes: true,
				attributeFilter: ['style']
			});
		},

		closeHandle: () => {
			const debug = dbg.extend('closeHandle');
			console.log('adding observer');

			closeObserver = new MutationObserver((x) => {
				return recaptchaModal.style.opacity == 0 && eventEmitters.onClose(x);
			});
			closeObserver.observe(recaptchaModal, {
				attributes: true,
				attributeFilter: ['style']
			});
		},

		inject: () => {
			const debug = dbg.extend('inject');
			console.log('initializing API, merging google API to svelte recaptcha');

			recaptcha = (window as any).grecaptcha;
			/*
                                                                         │associate window component to svelte, this allows us
                                                                         │to export grecaptcha methods in parent components.
                                                                         */

			(window as any).grecaptcha.ready(() => {
        // @ts-ignore
				instanceId = grecaptcha.render('googleRecaptchaDiv', {
					badge: badge,
					sitekey: sitekey,
					callback: eventEmitters.onSuccess,
					'expired-callback': eventEmitters.onExpired,
					'error-callback': eventEmitters.onError,
					size: size
				});
			});
		},
		wipe: () => {
			const debug = dbg.extend('onDestroy');
			try {
				console.log('tes')
				if (browser) {
					clearInterval(captcha.retryTimer);
					console.log('cleaning up clearInterval');

					if (recaptcha) {
						recaptcha.reset(instanceId);
						console.log('resetting captcha api');

						delete (window as any).grecaptcha;
						delete (window as any).apiLoaded;
						delete (window as any).recaptchaCloseListener;
						console.log('deleting window.grecaptcha');

						if (openObserver) openObserver.disconnect();
						if (closeObserver) closeObserver.disconnect();
						document.querySelectorAll('script[src*=recaptcha]').forEach((script) => {
							script.remove();
							console.log('deleting google script tag');
						});
						document.querySelectorAll('iframe[src*=recaptcha]').forEach((iframe) => {
							iframe.remove();
							console.log('deleting google iframe');
						});
					}
				}
			} catch (err: any) {
				console.log(err.message);
			} /*
                                                                           │extremely important to cleanup our mess, otherwise
                                                                           │everytime the component is invoked, a new recaptcha
                                                                           │iframe will get instated. Also, with SSR we need to
                                                                           │make sure all this stuff is wrapped within browser.
                                                                           */
		}
	};

	const apiLoaded = async () => {
		const debug = dbg.extend('apiLoaded');
		console.log('invoked, resolving deferred promise');
		wait.resolve(true);
	};

	onMount(async () => {
		const debug = dbg.extend('onMount');

		if (browser) (window as any).apiLoaded = apiLoaded;
		console.log('associate apiLoad to window object');

		if (sleepTime) {
			console.log('sleeping for a bit before inserting recaptcha script');
			await sleep(sleepTime);
		}

		if (browser) {
			const script = document.createElement('script');
			script.id = 'googleRecaptchaScript';
			script.src = `https://www.google.com/recaptcha/api.js?render=explicit&sitekey{sitekey}&onload=apiLoaded`;
			script.async = true;
			script.defer = true;
			document.head.appendChild(script);
		}

		wait = defer();
		console.log('waiting for google api to finish loading');

		await Promise.resolve(wait);
		console.log('deferred promise was resolved...');

		if (browser) captcha.inject();
		console.log('injecting captcha code');

		if (browser) (HTMLCollection.prototype as any).find = Array.prototype.find;
		/*needed to detect iframe for open, close events*/

		captcha.startTimer();
		console.log('polling for captcha to appear in DOM');
	});

	onDestroy(async () => {
		const debug = dbg.extend('onDestroy');
		captcha.wipe();
	});

	const sleep = (seconds: any) =>
		new Promise((resolve) => setTimeout(resolve, seconds * 1000)).catch((err) =>
			console.log('caught')
		);
</script>

<!----------------------------------------------------------------┐
                                                                                                                               └-->

<div id="googleRecaptchaDiv" class="g-recaptcha" />

<!--------------------------------------------------- comments ----;
                                                                
                                                                   |\/\/\/|     Google's recaptcha, or reCaptcha, or gReCaptcha
                                                                   |      |     or greCaptcha is a valuable tool in defending your
                                                                   | (o)(o)     webforms.
                                                                   C      _)
                                                                    |   /       Final Update: There are different ways to inject
                                                                   /____\       a piece of javascript into a template. They all come
                                                                  /      \      with their own drawbacks.
                                                                
                                                                
                                                                  These drawbacks are mostly related to injecting code too fast,
                                                                  too slow, not slow enough, not fast enough, and not being able to
                                                                  tell if the injection has completed and the script api is
                                                                  available for consumption.
                                                                
                                                                  1.Inject with svelte:head
                                                                  --------------------------
                                                                  This works most of the time, but it could have problems during
                                                                  component rerendering and cleanup. Like we have done in the demo,
                                                                  when the user switches between different captcha methods, plain
                                                                  svelte:head would fail.
                                                                
                                                                    ...
                                                                
                                                                    const recaptchaScriptId =
                                                                        browser && window.document.getElementById("googleRecaptchaScript");
                                                                    /*script src-id for recaptcha to avoid duplicate injections*/
                                                                
                                                                    ...
                                                                
                                                                    <svelte:head>
                                                                        {#await sleep(sleepTime) then _}
                                                                            {#if browser && !recaptchaScriptId}
                                                                                <script
                                                                                    id="googleRecaptchaScript"
                                                                                    src="https://www.google.com/recaptcha/api.js?render=explicit&sitekey{sitekey}&language={language}&onload=apiLoaded"
                                                                                    async
                                                                                    defer>
                                                                                </script>
                                                                            {/if}
                                                                        {:catch error}
                                                                            <meta wtf="true" />
                                                                        {/await}
                                                                    </svelte:head>
                                                                
                                                                  That await upthere doesn't really wait for the sleep, but it
                                                                  seems to trigger the necessary gap for this to work with forcing
                                                                  rerenders.
                                                                
                                                                  Besides that, this was the most straight forward approach.
                                                                
                                                                
                                                                  2.Write to document
                                                                  ---------------------------
                                                                  Very straight forward, works fine with forcing dynamic rerender.
                                                                  It injects and cleans up artifacts smoothly, but when it comes
                                                                  to creating the link between svelte and 3rd party script, it
                                                                  could try to do it too fast, and we would get an "undefined"
                                                                  `recaptcha` export.
                                                                
                                                                  To circumvent the problem, we not only track the script load state
                                                                  with our custom observer, but also track if the google `recaptcha`
                                                                  is actually available and ready to be consumed via using good old
                                                                  setInterval.
                                                                
                                                                
                                                                  3.Rendering of reCaptcha
                                                                  ---------------------------
                                                                  Google fills in a destination you provide with the recaptcha
                                                                  button, that is if you are using one of the normal or compact
                                                                  sizes.
                                                                
                                                                  Our div is called `googleRecaptchaDiv` and we are rendering it
                                                                  through window.grecaptcha provided by google. This is when we
                                                                  let recaptcha know about our event emitters and what to do for
                                                                  each case.
                                                                
                                                                  Finally, the callback functions for the recaptha object
                                                                  could be defined in the div tag probably in another universe.
                                                                
                                                                  <div id="recaptcha" class="g-recaptcha"
                                                                      data-callback="onSuccess"
                                                                      data-error-callback="onError"
                                                                      data-expired-callback="onExpired"
                                                                      data-size={invisible ? "invisible" : ""}
                                                                
                                                                
                                                                  Flow of Events
                                                                  ---------------------------
                                                                  .inject script and provide google a function to callback onLoad
                                                                  .start waiting
                                                                  .onLoad -> apiOnLoad proceed
                                                                  .wait for recaptcha to become available
                                                                  .render 3rd party API
                                                                  .fire events to keep svelte in loop.
                                                                
                                                                
                                                                  Notes to Future Self
                                                                  ---------------------------
                                                                  Remind yourself to smile whether you are reading, writing or coding.
                                                                  Especially when coding.
                                                                
                                                                
                                                                  Notes to Fellow Programmer
                                                                  ---------------------------
                                                                  Same. Hope you find this useful.
                                                                
                                                                |------------------------------------------------------------------>
