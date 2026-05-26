<script lang="ts">
  import SectionHeader from '$lib/app/components/app/SectionHeader.svelte';
  import jobCatalog from '@client/section-schema/sections/job-catalog';
  import type { LandingSectionForSchema } from '@southneuhof/landing-sveltekit-framework/types';

  type Section = LandingSectionForSchema<typeof jobCatalog>;
  type JobCard = {
    id: string;
    name: string;
    minimum_education: string;
    location: string;
    category: string;
  };

  const { section }: { section: Section } = $props();
  const jobs = ((Array.isArray(section?.data?.jobs) ? section.data.jobs : []) as JobCard[]);
</script>

<div class="flex w-full items-center justify-center">
  <div class="w-full max-w-screen-xl px-6 py-10 lg:px-12 lg:py-14">
    <div class="mx-auto mb-8 flex w-full max-w-4xl flex-col items-center text-center lg:mb-12">
      <div class="mb-6 flex flex-col items-center gap-2">
        <span class="h-1 w-52 rounded-full bg-[#E53935]"></span>
        <span class="h-1 w-72 rounded-full bg-[#3F51B5]"></span>
      </div>
      <SectionHeader header={{ ...section?.data?.content, url: undefined, url_text: undefined }} defaultAlign="center" />
    </div>

    {#if jobs.length === 0}
      <p class="text-center text-outline">Tidak ada lowongan aktif saat ini.</p>
    {:else}
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {#each jobs as job (job.id)}
          <a
            href={`/career/${job.id}`}
            class="flex flex-col items-center justify-center gap-6 group rounded-[2rem] border border-outline-variant bg-surface p-8 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            aria-label={`Lihat lowongan ${job.name}`}
          >
            <div class="flex flex-col items-center gap-4">
              <div class="flex flex-col gap-1">
                <h3 class="text-lg font-bold leading-tight tracking-wide text-on-surface/80">{job.name}</h3>
                <p class="text-outline">{job.category}</p>
              </div>

              <div class="inline-flex items-center rounded-full border border-[#3F51B5] px-4 py-1 text-sm font-semibold text-on-surface/80">
                {job.minimum_education}
              </div>
            </div>

            <p class="flex items-center justify-center gap-2 text-base text-outline">
              <i class="ri-map-pin-2-fill text-xl"></i>
              <span>{job.location}</span>
            </p>
          </a>
        {/each}
      </div>
    {/if}
  </div>
</div>
