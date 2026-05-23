<script lang="ts">
  import { browser } from "$app/environment";
  import { onMount, tick } from "svelte";
  import {page} from '$app/state';
  import { getLocale, setLocale } from "$lib/paraglide/runtime";
  import { slide, blur, fade } from "svelte/transition";
  import { debounce } from "@southneuhof/utilities/object";
  import { index } from "mathjs";
  import { cubicIn } from "svelte/easing";

  let windowScrollY = $state(0);
  let windowHeight = $state(0);
  let isMenuExpanded = $state(false)
  let activeLevel1Index = $state<number | null>(null)
  let activeLevel2Index = $state<number | null>(null)
  let level1MenuContentElements: (HTMLDivElement | null)[] = $state([])
  let level2MenuContentElements: (HTMLDivElement | null)[][] = $state(page.data.menu.map((item: any) => item.children.map(() => null)))
  let level1PanelElements: (HTMLDivElement | null)[] = $state([])
  let containerHeight = $state(0)
  let isContentVisible = $state(false)
  let isAnimating = $state(false)

  const FADE_DURATION = 200
  const HEIGHT_DURATION = 150

  $effect(() => {
    let activeLevel1PanelElement: any = null
    let activeLevel1ContentElement: any = null
    let activeLevel2ContentElement: any = null
    if (isMenuExpanded) {
      if (activeLevel1Index != null) activeLevel1PanelElement = level1PanelElements[activeLevel1Index]
      if (activeLevel1Index != null) activeLevel1ContentElement = level1MenuContentElements[activeLevel1Index]
      if (activeLevel2Index != null && activeLevel1Index != null) activeLevel2ContentElement = level2MenuContentElements[activeLevel1Index][activeLevel2Index]
      if (activeLevel1PanelElement && !activeLevel2ContentElement) {
        return containerHeight = activeLevel1PanelElement.offsetHeight
      } else if (activeLevel1PanelElement && activeLevel2ContentElement) {
        return containerHeight = Math.max(activeLevel1PanelElement.offsetHeight, activeLevel2ContentElement.offsetHeight)
      }
    } else {
      containerHeight = 0
    }
  })

  let [currentLevel1Menu, currentLevel2Menu] = $derived.by(() => {
    const l1 = page.data.menu.find((item: any) => item.slug === page.url.pathname.split('/').filter(Boolean)[0])
    const l2 = l1?.children.find((item: any) => item.slug === page.url.pathname.split('/').filter(Boolean)[1])
    return [l1, l2]
  })

  const debouncedMenuExpandMouseHover = debounce((index: number, mode: 'expand' | 'shrink') => {
    if (mode === 'expand') {
      if (!isMenuExpanded) {
        console.log('initial open')
        // Initial open
        isAnimating = true
        isMenuExpanded = true
        activeLevel1Index = index
        activeLevel2Index = null
        setTimeout(() => {
          isContentVisible = true
          setTimeout(() => (isAnimating = false), FADE_DURATION)
        }, HEIGHT_DURATION)
      } else if (activeLevel1Index !== index) {
        console.log('switching menus')
        // Switching menus
        isAnimating = true
        isContentVisible = false
        setTimeout(() => {
          activeLevel1Index = index
          activeLevel2Index = null
          isContentVisible = true
          setTimeout(() => {
            isAnimating = false
          }, HEIGHT_DURATION)
        }, FADE_DURATION)
      }
    } else {
      console.log('shrink')
      // shrink
      if (!isMenuExpanded) return
      isAnimating = true
      isContentVisible = false
      setTimeout(() => {
        isMenuExpanded = false
        setTimeout(() => {
          activeLevel1Index = null
          activeLevel2Index = null
          isAnimating = false
        }, HEIGHT_DURATION)
      }, FADE_DURATION)
    }
  }, 100)
</script>

<svelte:window bind:scrollY={windowScrollY} bind:outerHeight={windowHeight}/>
{#if isMenuExpanded}
  <!-- <div role="none" transition:blur onmouseenter="{() => debouncedMenuExpandMouseHover(-1, 'shrink')}" class="z-[48] h-screen w-screen top-0 fixed backdrop-blur-md bg-on-surface/[8%]"></div> -->
  <div role="none" transition:fade onmouseenter="{() => debouncedMenuExpandMouseHover(-1, 'shrink')}" class="z-[48] h-screen w-screen top-0 fixed bg-on-surface/[16%]"></div>
{/if}
<div
  class="w-full fixed top-0 left-0 z-[1] transition-all"
  style="background: linear-gradient(to bottom, rgba(0, 0, 0, 0.36) 0%, rgba(0, 0, 0, 0.18) 30%, rgba(0, 0, 0, 0) 100%);
  height: {isMenuExpanded ? 0 : windowScrollY != 0 ? 0 : 200}px;
  display: var(--navbar-overlay-display);
  "
  ></div>
<div
  role="none" transition:blur onmouseenter="{() => debouncedMenuExpandMouseHover(-1, 'shrink')}"
  class="z-[48] h-[116px] w-screen top-0 fixed bg-gradient-to-b from-on-surface/[16%] to-transparent"
  style="
    backdrop-filter: blur(0px);
    mask-image: linear-gradient(to bottom, black 0%, transparent 100%);
    -webkit-mask-image: linear-gradient(to bottom, black 0%, transparent 100%);
  "
></div>
<div class="lg:flex flex-col hidden" style="--navbar-initial-text-color: var(--initial-text-color, var(--colors-on-surface));">
  <div 
    class="w-full flex flex-col items-center justify-center fixed z-[50] box-border transition-all {isMenuExpanded ? 'text-on-surface' : windowScrollY != 0 ? 'text-on-surface' : 'text-[var(--navbar-initial-text-color)] text-shadow-outline-variant'}"
  >
    <div class="flex flex-row items-center justify-between w-full px-12 py-6 max-w-screen-xl">
      <a href="{page.data.primaryMenuPath}">
        <!-- {#if isMenuExpanded ? containerHeight + 152 : windowScrollY != 0 ? 116 : 0} -->
        {#if isMenuExpanded || windowScrollY != 0}
          <img src="/assets/logo/mjl.svg" class="w-[75px] h-[68px]" alt="PT MJL"/>
        {:else}
          <img src="/assets/logo/mjl.svg" class="w-[75px] h-[68px]" alt="PT MJL"/>
        {/if}
      </a>
      <div class="flex flex-row items-center gap-base text-sm xl:text-base">
        {#each page.data.menu as menu, index}
          {#if menu.visible}
            {#if menu.menu_item_type == 'link'}
              <a href={menu.url} target="_blank" class="">{menu.name}</a>
            {:else if menu.menu_item_type == 'page'}
              <div class="relative">
                {#if !menu.page?.translations?.length}
                  <div
                    onfocus="{() => {}}"
                    role="menu"
                    tabindex="{index}"
                    onmouseover="{() => debouncedMenuExpandMouseHover(index, menu.children?.filter((c: any) => c.visible).length ? 'expand' : 'shrink')}"
                    class="flex flex-row gap-xs cursor-default"
                  >
                    <p>{menu.name}</p>
                    {#if menu.children?.filter((c: any) => c.visible).length}<i class="ri-arrow-down-s-line {activeLevel1Index === index ? 'rotate-180' : 'rotate-0'} transition-transform"></i>{/if}
                  </div>
                {:else}
                  <a
                    onfocus="{() => {}}"
                    onmouseover="{() => debouncedMenuExpandMouseHover(index, menu.children?.filter((c: any) => c.visible).length ? 'expand' : 'shrink')}"
                    onclick="{() => { isMenuExpanded = false; activeLevel1Index = null; activeLevel2Index = null; }}"
                    href="/{menu.slug}"
                    class="flex flex-row gap-xs"
                  > 
                  <p>{menu.name}</p>
                    {#if menu.children?.filter((c: any) => c.visible).length}<i class="ri-arrow-down-s-line {activeLevel1Index === index ? 'rotate-180' : 'rotate-0'} transition-transform"></i>{/if}
                  </a>
                {/if}
              </div>
            {/if}
          {/if}
        {/each}
      </div>
      <div>
        <button onclick="{() => getLocale() === 'id' ? setLocale('en') : setLocale('id')}" class="bg-surface outline outline-outline-variant flex flex-row items-center justify-between gap-sm px-3 py-2 rounded-full">
          <img src="/assets/i18n/flags/{getLocale()}.svg" alt="{getLocale()}" class="rounded-full aspect-square w-4 outline outline-outline-variant object-center object-cover"/>
          <p class="font-bold uppercase text-on-surface">{getLocale()}</p>
        </button>
      </div>
    </div>
  </div>
  {#if currentLevel1Menu?.show_submenu_below_navbar && !isMenuExpanded}
    <div transition:blur={{duration: 150}} class="w-full z-[51] py-1.5 flex flex-row items-center justify-center gap-4 fixed top-[116px] border-y transition-all {(windowScrollY != 0) ? 'bg-surface border-y-outline-variant mt-0' : 'border-transparent -mt-4'}">
      {#each currentLevel1Menu.children.filter((item: any) => item.visible) as menu}
        <a href={menu.menu_item_type == 'link' ? menu.url : `/${currentLevel1Menu.slug}/${menu.slug}`} class="text-start text-sm {windowScrollY != 0 ? 'text-on-surface' : 'text-[var(--navbar-initial-text-color)]'} {menu.slug === currentLevel2Menu?.slug ? 'font-semibold underline' : ''}">{menu.translations[0].name}</a>
      {/each}
    </div>
  {/if}
  <div 
    class="fixed text-sm xl:text-base w-full bg-surface outline-0 z-[49] ease-in-out overflow-hidden {isMenuExpanded ? '' : 'pointer-events-none'}"
    style="transition: height {HEIGHT_DURATION}ms, opacity {FADE_DURATION}ms; height: {isMenuExpanded ? containerHeight + 116 : windowScrollY != 0 ? 116 : 0}px"
  >
    <div class="h-[116px]"></div>
    <div class="relative w-full h-full">
      <div class="w-full max-w-screen-xl mx-auto px-12 relative h-full">
        {#each page.data.menu as menu, level1Index}
          {#if menu.children?.filter((c: any) => c.visible).length}
            <div 
              class="absolute inset-x-0 transition-all ease-in-out {activeLevel1Index === level1Index && isContentVisible ? 'opacity-100 filter-none' : 'opacity-0 filter blur-sm pointer-events-none'}"
              style="transition-duration: {FADE_DURATION}ms"
            >
              <div 
                class="w-full pt-6 pb-10 px-12 grid grid-cols-3 gap-lg"
                bind:this="{level1PanelElements[level1Index]}"
              >
                <div class="flex flex-col gap-xs">
                  <p class="text-lg xl:text-xl font-bold">{menu.name}</p>
                  <p class="text-sm text-outline">{menu.description}</p>
                </div>
                <div class="flex flex-col gap-base" bind:this="{level1MenuContentElements[level1Index]}">
                  {#each menu.children as level2Child, level2Index}
                    {#if level2Child.visible}
                      {#if level2Child.menu_item_type == 'link'}
                        <a href="{level2Child.url}" target="_blank" class="flex flex-row items-center justify-between group/menuItem {level2Child.url ? 'text-on-surface' : 'text-[var(--navbar-initial-text-color)]'}" role="menu" tabindex="{activeLevel2Index}">
                          <p>{level2Child.name}</p>
                          <i class="ri-arrow-right-up-line transition-all"></i>
                        </a>
                      {:else}
                        
                          {#if !level2Child.page}
                            <div
                              onfocus="{() => {}}"
                              class="flex flex-row items-center justify-between group/menuItem"
                              onmouseover="{() => {if (level2Child.children?.length) return activeLevel2Index = level2Index}}"
                            role="menu"
                            tabindex="{activeLevel2Index}"
                          >
                            <p class="text-outline">{level2Child.name}</p>
                            {#if level2Child.children?.length}<i class="ri-arrow-right-s-line transition-all {activeLevel2Index === level2Index ? 'text-outline' : 'text-outline-variant'}"></i>{/if}
                          </div>
                          {:else}
                            <a
                              onfocus={() => {}}
                              class="flex flex-row items-center justify-between group/menuItem"
                              onmouseover="{() => {if (level2Child.children?.length) return activeLevel2Index = level2Index}}"
                              href="/{menu.slug}/{level2Child.slug}"
                              onclick="{() => isMenuExpanded = false}"
                            >
                              <p>{level2Child.name}</p>
                              {#if level2Child.children?.length}<i class="ri-arrow-right-s-line transition-all {activeLevel2Index === level2Index ? 'text-outline' : 'text-outline-variant'}"></i>{/if}
                            </a>
                          {/if}
                      {/if}
                    {/if}
                  {/each}
                </div>
                <div class="relative">
                  {#each menu.children as level2Child, level2Index}
                    <div
                      class="absolute inset-0 transition-all {activeLevel2Index === level2Index &&
                      isContentVisible
                        ? 'opacity-100 filter-none'
                        : 'opacity-0 filter blur-sm pointer-events-none'}"
                      style="transition-duration: {FADE_DURATION}ms; transition-delay: 0ms"
                    >
                      <div class="flex flex-col gap-base" bind:this="{level2MenuContentElements[level1Index][level2Index]}">
                        {#each level2Child.children as level3Child}
                          {#if level3Child.visible}
                            {#if !level3Child.page}
                              <div
                                onfocus="{() => {}}"
                                class="flex flex-row items-center justify-between group/menuItem"
                                role="menu"
                              >
                                <p class="text-outline">{level3Child.name}</p>
                              </div>
                            {:else}
                              <a
                                onfocus="{() => {}}"
                                class="flex flex-row items-center justify-between group/menuItem"
                                href="/{menu.slug}/{level2Child.slug}/{level3Child.slug}"
                                onclick="{() => (isMenuExpanded = false)}"
                              >
                                <p>{level3Child.name}</p>
                              </a>
                            {/if}
                          {/if}
                        {/each}
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          {/if}
        {/each}
      </div>
    </div>
  </div>
</div>
<!-- <p class="z-[100]">{JSON.stringify(level2MenuContentElements)}</p> -->
