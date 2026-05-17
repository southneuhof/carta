<script lang="ts">
  import { browser } from "$app/environment";
  import SelectInput from "$lib/app/components/input/SelectInput.svelte";
  import { Image } from "@southneuhof/landing-sveltekit-framework/client";
  import { getLocale } from "$lib/paraglide/runtime";
  import { onDestroy, onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { m } from "$lib/paraglide/messages";

  const { section } = $props();

  let activeBannerIndex = $state(0);

  // Preload adjacent images
  const preloadIndexes = $derived([
    (activeBannerIndex - 1 + section.data.banner.length) %
      section.data.banner.length,
    activeBannerIndex,
    (activeBannerIndex + 1) % section.data.banner.length,
  ]);

  let initialNavbarTextColor = "var(--colors-surface)";

  onMount(() => {
    if (browser) {
      document.documentElement.style.setProperty(
        "--initial-text-color",
        initialNavbarTextColor,
      );
      document.documentElement.style.setProperty(
        "--navbar-overlay-display",
        "block",
      );
    }
  });

  onDestroy(() => {
    if (browser) {
      document.documentElement.style.removeProperty("--initial-text-color");
      document.documentElement.style.setProperty(
        "--navbar-overlay-display",
        "none",
      );
    }
  });

  setInterval(() => {
    activeBannerIndex = (activeBannerIndex + 1) % section.data.banner.length;
  }, 10000);

  let isProjectListOpen = $state(false);
  let projectListRef: HTMLDivElement;
  let contentRef: HTMLDivElement;

  let projectListContentHeight = $state(0);
  let locationActiveCode = $state("");
  let categoryActiveCode = $state("");

  let contentHeight = $state(0);
  const MAX_HEIGHT = 420; // Maximum height we want to allow

  // Calculate content height when filteredProjects changes
  $effect(() => {
    if (contentRef) {
      if (filteredProjects)
        contentHeight = Math.min(contentRef.scrollHeight, MAX_HEIGHT);
    }
  });

  // Handle click outside to close the project list
  function handleClickOutside(event: MouseEvent) {
    // Check if the click is outside both the project list and the select inputs
    const clickedElement = event.target as HTMLElement;

    // Ignore if the click is on a bits-ui element (ID starts with 'bits-')
    if (clickedElement.id?.startsWith("bits-")) {
      return;
    }

    console.log(
      !!(
        projectListRef?.contains(clickedElement) ||
        clickedElement.closest(".select-container")
      ),
      clickedElement,
    );
    const isClickInside =
      projectListRef?.contains(clickedElement) ||
      clickedElement.closest(".select-container");

    if (!isClickInside) {
      isProjectListOpen = false;
    }
  }

  onMount(() => {
    // Use a small timeout to ensure this runs after other click handlers
    setTimeout(() => {
      document.addEventListener("click", handleClickOutside, false);
    }, 0);
  });

  onDestroy(() => {
    document.removeEventListener("click", handleClickOutside, false);
  });

  let locale = $derived.by(getLocale);

  const categoryFilterNameMap: Record<string, string> = $derived.by(() => {
    return Object.fromEntries(
      section.data.filter?.category?.map((item: any) => [
        item.code,
        locale === "id" ? item.name_id : item.name_en,
      ]) || [],
    );
  });

  const locationFilterNameMap: Record<string, string> = $derived.by(() => {
    return Object.fromEntries(
      section.data.filter?.location?.map((item: any) => [
        item.code,
        item.name,
      ]) || [],
    );
  });

  const filteredProjects = $derived.by(() => {
    if (!section.data.projects) return [];

    return section.data.projects.filter((project: any) => {
      // Filter by category (if any category is selected)
      const matchesCategory =
        !categoryActiveCode ||
        categoryActiveCode === "all" ||
        project.category === categoryActiveCode;

      // Filter by location (if any location is selected)
      const matchesLocation =
        !locationActiveCode ||
        locationActiveCode === "all" ||
        project.location === locationActiveCode;

      return matchesCategory && matchesLocation;
    });
  });

  $effect(() => {
    if (locationActiveCode || categoryActiveCode) {
      isProjectListOpen = true;
    }
  });
</script>

<div class="h-screen flex items-end bg-black/80 text-white w-full relative">
  {#each section.data.banner as banner, i}
    {#if preloadIndexes.includes(i) && banner?.media}
      {#if !banner?.media_type || banner?.media_type === "image"}
        {#if i === activeBannerIndex}
          <Image
            src={banner.media}
            alt="banner"
            priority={true}
            class="w-full h-full object-center object-cover absolute"
          />
        {:else}
          <img
            class="hidden"
            src={banner.media}
            alt=""
            loading="eager"
            aria-hidden="true"
          />
        {/if}
      {:else if banner?.media_type === "video" && i === activeBannerIndex}
        <video
          transition:fade={{ duration: 250 }}
          autoplay
          muted
          loop
          playsinline
          class="w-full h-full absolute object-cover object-center"
        >
          <source src={banner.media} type="video/mp4" />
        </video>
      {/if}
    {/if}
  {/each}
  <div
    class="w-full h-full absolute bottom-0 left-0 z-[1]"
    style="background: linear-gradient(to top right, rgba(0, 0, 0, 0.36) 0%, rgba(0, 0, 0, 0.0) 30%);"
  ></div>
  <div
    class="w-full h-full absolute bottom-0 left-0 z-10 p-4 sm:p-8 flex flex-col lg:grid lg:grid-cols-2 gap-4 lg:gap-8 justify-end lg:justify-normal"
  >
    <div class="relative w-full h-full z-[1]">
      {#each section.data.banner as banner, i (i)}
        <div
          class="absolute pr-4 pt-4 bottom-0 left-0 max-w-[100ch] flex flex-col gap-4 transition-opacity duration-500 {activeBannerIndex ===
          i
            ? 'opacity-100 z-10'
            : 'opacity-0 pointer-events-none z-0'}"
          style="
            transform: translateZ(0);
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
          "
        >
          <div
            class="flex flex-col gap-4 text-left text-shadow-outline-variant"
            style="
              transition: all 500ms cubic-bezier(0.4, 0, 0.2, 1);
              transform: translateZ(0);
              backface-visibility: hidden;
              -webkit-backface-visibility: hidden;
              filter: {activeBannerIndex === i ? 'none' : 'blur(8px)'};
            "
          >
            {#if section.meta.logo}<img
                src={section.meta.logo}
                class="max-w-[72px]"
                alt={banner.subtitle}
              />{/if}
            {#if banner?.subtitle}<p class="text-lg lg:text-xl">
                {banner.subtitle}
              </p>{/if}
            {#if banner?.title}<h1
                class="text-4xl lg:text-5xl 2xl:text-6xl font-bold"
              >
                {banner.title}
              </h1>{/if}
            {#if banner?.description}<div class="rtf-content mt-4 text-sm">
                {@html banner.description}
              </div>{/if}
          </div>
        </div>
      {/each}
    </div>
    <div class="flex items-end justify-end w-full mt-4 lg:mt-0 z-[5]">
      <div class="relative w-full lg:w-fit">
        <div
          class="select-container w-full p-4 bg-surface rounded-full flex flex-row items-center gap-base relative outline z-[1] outline-outline-variant text-on-surface"
          role="none"
          onmousedown={(e) => e.stopPropagation()}
          onmouseenter={() => {
            if (locationActiveCode || categoryActiveCode)
              isProjectListOpen = true;
          }}
          onclick={(e) => {
            if (locationActiveCode || categoryActiveCode)
              isProjectListOpen = true;
          }}
        >
          <SelectInput
            data={[
              {
                code: "all",
                name_id: "Semua Kategori",
                name_en: "All Categories",
              },
              ...(section.data.filter?.category || []),
            ]}
            bind:value={categoryActiveCode}
            view="name_{getLocale()}"
            pick="code"
            placeholder={m.select_category()}
            class="w-full lg:w-[280px] outline-none !p-0"
          />
          <div class="h-[24px] w-[1px] border-outline-variant border-l"></div>
          <SelectInput
            data={[
              { code: "all", name: m.all_location() },
              ...(section.data.filter?.location || []),
            ]}
            bind:value={locationActiveCode}
            view="name"
            pick="code"
            placeholder={m.select_location()}
            class="w-full lg:w-[280px] outline-none !p-0"
          />
        </div>
        <div
          bind:this={projectListRef}
          class="w-full absolute bottom-[30px] left-0 rounded-t-[16px] outline overflow-auto outline-outline-variant bg-surface text-on-surface flex flex-col gap-base transition-all duration-400"
          style="height: {isProjectListOpen ? `${contentHeight}px` : '0px'}"
          onclick={(e) => e.stopPropagation()}
          role="none"
        >
          <div bind:this={contentRef} class="p-4 flex flex-col gap-4">
            {#each filteredProjects as project}
              <a
                href={project.url}
                class="flex flex-row items-center gap-sm hover:bg-surface-muted rounded-sm"
              >
                <Image
                  class="w-[66px] aspect-square rounded-sm"
                  src={project.media}
                  alt={project.title}
                  objectFit="cover"
                />
                <div class="flex flex-col gap-xs">
                  <p class="font-bold">{project.title}</p>
                  <p class="text-sm">
                    {categoryFilterNameMap[project.category]}, {locationFilterNameMap[
                      project.location
                    ]}
                  </p>
                </div>
              </a>
            {/each}
            {#if filteredProjects.length === 0}
              <p class="text-center text-outline">
                Tidak ada proyek yang memenuhi kriteria
              </p>
            {/if}
            <div class="h-[16px] w-[1px]"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
