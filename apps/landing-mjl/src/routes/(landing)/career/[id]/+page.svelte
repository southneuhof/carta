<script lang="ts">
  import { page } from '$app/stores';

  const { data } = $props();

  const companyWebsite = $derived(($page.data.companyProfile as any)?.website || 'bit.ly/formpelamarmjl');
  const applyHref = $derived(companyWebsite.startsWith('http') ? companyWebsite : `https://${companyWebsite}`);
  const companyEmail = $derived($page.data.companyProfile?.email || 'hrd.recruitment@ptmjl.co.id');
</script>

<div class="flex flex-col w-full min-h-screen h-full text-on-surface" style="margin-top: var(--topbarHeight);">
  <div class="flex justify-center w-full py-8 lg:py-12">
    <div class="flex flex-col w-full max-w-screen-xl px-6 lg:px-12 gap-8">
      
      <!-- Back Button -->
      <div>
        <a href="/career" class="inline-flex items-center gap-2 text-primary font-semibold text-sm md:text-base hover:opacity-90 transition">
          <i class="ri-arrow-left-line text-lg"></i>
          Kembali
        </a>
      </div>

      <!-- Header Section -->
      <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-10 w-full">
        <div class="min-w-0">
          <h1 class="text-3xl md:text-4xl font-bold tracking-wide uppercase text-on-surface/95">{data.career.name}</h1>
          <p class="mt-2 text-primary text-2xl font-semibold">{data.career.category}</p>
        </div>

        <a
          href={applyHref}
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex h-12 w-fit min-w-[180px] items-center justify-center gap-3 rounded-full bg-primary px-8 text-white text-base font-semibold transition hover:scale-[1.01] active:scale-95 lg:min-w-[220px]"
        >
          Apply
          <i class="ri-arrow-right-line text-lg"></i>
        </a>
      </div>

      <!-- Details Section -->
      <section class="flex flex-col gap-8 w-full mt-4">
        <!-- Deskripsi -->
        <div class="flex flex-col gap-3">
          <h2 class="text-xl md:text-2xl font-semibold text-on-surface/95">Deskripsi</h2>
          {#if data.career.description}
            <div class="rtf-content text-sm leading-relaxed font-medium">{@html data.career.description}</div>
          {:else}
            <p class="text-sm font-medium">Belum ada deskripsi.</p>
          {/if}
        </div>

        <!-- Kualifikasi Pekerjaan -->
        <div class="flex flex-col gap-3">
          <h2 class="text-xl md:text-2xl font-semibold text-on-surface/95">Kualifikasi Pekerjaan</h2>
          {#if data.career.qualification}
            <div class="rtf-content text-sm leading-relaxed font-medium">{@html data.career.qualification}</div>
          {:else}
            <p class="text-sm font-medium">Belum ada kualifikasi.</p>
          {/if}
        </div>

        <!-- Info Row: Pendidikan & Penempatan -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-16 w-full pt-2">
          <div class="flex flex-col gap-3">
            <h3 class="text-xl md:text-2xl font-semibold text-on-surface/95">Minimal Pendidikan</h3>
            <p class="inline-flex items-center gap-2 text-sm font-semibold">
              <i class="ri-book-open-line text-lg"></i>
              {data.career.minimum_education}
            </p>
          </div>

          <div class="flex flex-col gap-3">
            <h3 class="text-xl md:text-2xl font-semibold text-on-surface/95">Penempatan</h3>
            <p class="inline-flex items-center gap-2 text-sm font-semibold">
              <i class="ri-map-pin-line text-lg"></i>
              {data.career.location}
            </p>
          </div>
        </div>
      </section>
      
    </div>
  </div>
</div>

