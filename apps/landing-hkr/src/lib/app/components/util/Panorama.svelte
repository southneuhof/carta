<script lang="ts">
	import { useId } from "$lib/utils/common";
	import { onMount } from "svelte";

  export let url: string;
  export let title: string | undefined = undefined;
  export let autoLoad: boolean = true;
	let className: string | undefined = 'h-[300px] w-auto';
	export { className as class };
  

  const generatedId = useId()

  onMount(() => {
    const pannellumConfig: any = {
      "hfov": 110,
      "pitch": -3,
      "yaw": 117,
      "type": "equirectangular",
      "panorama": url,
      autoLoad
    };
    if (title) pannellumConfig.title = title;
    (pannellum as any).viewer(generatedId, pannellumConfig)
  })
</script>
<div id="{generatedId}" class="{className}"></div>