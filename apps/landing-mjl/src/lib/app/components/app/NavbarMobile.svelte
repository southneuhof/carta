<script lang="ts">
  import { page } from "$app/state";
  import { getLocale, setLocale } from "$lib/paraglide/runtime";
  import { blur, fade, slide } from "svelte/transition";

  let isMenuExpanded = $state(false)

  let activeLevel1Index = $state<number | null>(null)
</script>

<div class="flex flex-col lg:hidden fixed top-0 z-[50] w-full">
  <div class="w-full flex flex-row items-center bg-surface text-on-surface justify-center {isMenuExpanded ? 'border-transparent' : 'border-outline-variant'} transition-[border] duration-500 border-b z-[50]">
    <div class="flex flex-row items-center justify-between w-full px-6 py-3 max-w-screen-xl">
      {#if activeLevel1Index != null && isMenuExpanded}
        <button
          in:fade={{duration: 300, delay: 300}}
          out:fade={{duration: 300, delay: 0}}
          onclick={() => activeLevel1Index = null}
          aria-label="Menu"
          class="flex flex-row items-center gap-sm"
        >
          <i class="ri-arrow-left-s-line"></i>
          <p class="text-sm">{page.data.menu[activeLevel1Index].name}</p>
        </button>
      {:else}
        <a
          in:fade={{duration: 300, delay: 300}}
          out:fade={{duration: 300, delay: 0}}
          href="{page.data.primaryMenuPath}"
          onclick="{() => isMenuExpanded = false}"
        >
          <img src="/assets/logo/hkr.svg" class="w-[51.2px] h-[21.6px]" alt="HK Realtindo"/>
        </a>
      {/if}
      <div class="flex flex-row items-center gap-2">
        {#if isMenuExpanded}
          <button
            onclick={() => getLocale() === 'id' ? setLocale('en') : setLocale('id')}
            class="bg-surface outline outline-outline-variant flex flex-row items-center justify-between gap-sm px-1.5 py-1"
            transition:fade={{duration: 100, delay: 200}}
          >
            <img src="/assets/i18n/flags/{getLocale()}.svg" alt="{getLocale()}" class="rounded-full aspect-square w-3 outline outline-outline-variant object-center object-cover"/>
            <p class="font-bold uppercase text-on-surface text-xs">{getLocale()}</p>
          </button>
        {/if}
        <button
          onclick={() => {
            isMenuExpanded = !isMenuExpanded
            activeLevel1Index = null
          }}
          aria-label="Menu"
          class="relative w-[24px] aspect-square"
        >
          {#if isMenuExpanded}
            <i
              class="ri-close-large-line absolute top-1/2 left-1/2 -translate-1/2"
              in:blur|global={{duration: 300, delay: 300}}
              out:blur|global={{duration: 300}}
            ></i>
          {:else}
            <i
              class="ri-menu-line absolute top-1/2 left-1/2 -translate-1/2"
              in:blur|global={{duration: 300, delay: 300}}
              out:blur|global={{duration: 300}}
            ></i>
          {/if}
        </button>
      </div>
    </div>
  </div>
  {#if isMenuExpanded}
    <div
      in:slide={{duration: 300}}
      out:slide={{duration: 300, delay: 300}}
      class="z-[49] fixed w-full h-screen bg-surface text-on-surface pt-[49px]"
    >
      {#if activeLevel1Index == null}
        <div
          class="w-full px-12 py-6 flex flex-col gap-base"
          in:blur|global={{duration: 300, delay: 300}}
          out:blur|global={{duration: 300}}
        >
          {#each page.data.menu as menu, level1Index}
            {#if menu.visible}
              {#if menu.menu_item_type === 'link'}
                <a href={menu.url} target="_blank" class="text-on-surface">{menu.name}</a>
              {:else}
                {#if menu.children?.length > 1}
                  <button
                    onclick="{() => activeLevel1Index = level1Index}"
                    class="text-xl font-bold text-start"
                  >
                    {menu.name}
                  </button>
                {:else}
                  <a
                    href="/{menu.slug}"
                    class="text-xl text-on-surface text-start"
                    onclick="{() => isMenuExpanded = false}"
                  >
                    {menu.name}
                  </a>
                {/if}
              {/if}
            {/if}
          {/each}
        </div>
      {:else}
        <div
          in:blur|global={{duration: 300, delay: 300}}
          out:blur|global={{duration: 300}}
          class="w-full px-12 py-6 flex flex-col gap-base"
        >
          <!-- <div class="text-xl font-bold">{page.data.menu[activeLevel1Index].name}</div> -->
          <div class="flex flex-col gap-base">
            {#each page.data.menu[activeLevel1Index].children as level2Child}
              {#if level2Child.visible}
                {#if level2Child.menu_item_type == 'link'}
                  <!-- External link type -->
                  <a
                    href="{level2Child.url}"
                    target="_blank"
                    class="text-xl text-on-surface text-start"
                    onclick="{() => isMenuExpanded = false}"
                  >
                    {level2Child.name}
                  </a>
                {:else}
                  {#if level2Child.children?.length}
                    <div class="flex flex-col gap-xs">
                      {#if level2Child.page}
                        <a
                          href="/{page.data.menu[activeLevel1Index].slug}/{level2Child.slug}"
                          class="text-xl font-bold text-start"
                          onclick="{() => isMenuExpanded = false}"
                        >
                          {level2Child.name}
                        </a>
                      {:else}
                        <p class="text-xl font-bold text-outline">{level2Child.name}</p>
                      {/if}
                      <div class="flex flex-col gap-xs">
                        {#each level2Child.children as level3Child}
                          {#if level3Child.visible}
                            {#if level3Child.page}
                              <a
                                href="/{page.data.menu[activeLevel1Index].slug}/{level2Child.slug}/{level3Child.slug}"
                                class="text-on-surface text-start"
                                onclick="{() => isMenuExpanded = false}"
                              >
                                {level3Child.name}
                              </a>
                            {:else}
                              <p class="text-outline">{level3Child.name}</p>
                            {/if}
                          {/if}
                        {/each}
                      </div>
                    </div>
                  {:else}
                    {#if level2Child.page}
                      <a
                        href="/{page.data.menu[activeLevel1Index].slug}/{level2Child.slug}"
                        class="text-xl text-on-surface text-start"
                        onclick="{() => isMenuExpanded = false}"
                      >
                        {level2Child.name}
                      </a>
                    {:else}
                      <p class="text-xl text-outline">{level2Child.name}</p>
                    {/if}
                  {/if}
                {/if}
              {/if}
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
