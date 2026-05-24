<script lang="ts">
  import { page } from "$app/state";
  import Button from "$lib/app/components/ui/Button.svelte";

</script>

<div class="flex flex-col w-full min-h-screen h-full lg:mt-[88px] text-on-surface">
  <div class="flex items-center justify-center w-full bg-center bg-cover py-6 lg:py-12" style="margin-top: var(--topbarHeight);">
    <div class="flex flex-col gap-16 max-w-screen-xl px-12 w-full justify-center pt-8 lg:pt-0">
      <div class="flex flex-col gap-lg">
        <div class="flex flex-row items-center gap-base">
          <Button variant="outlined" size="square" onclick={() => history.back()}><i class="ri-arrow-left-s-line"></i></Button>
          <div>
            <h1 class="text-2xl font-bold">{page.url.searchParams.get('title')}</h1>
            <p class="text-sm text-outline">{page.url.searchParams.get('description')}</p>
          </div>
        </div>
        <iframe src={page.url.searchParams.get('url')} class="h-[80vh]" title={page.url.searchParams.get('title')}></iframe>
      </div>
    </div>
  </div>
</div>