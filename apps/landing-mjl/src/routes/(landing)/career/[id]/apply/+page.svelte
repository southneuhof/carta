<script lang="ts">
  import { setContext } from 'svelte';
  import FormView from '$lib/sections/form/_layouts/FormView.svelte';
  import SuccessView from '$lib/sections/form/_layouts/SuccessView.svelte';

  const { data } = $props();

  let viewIndex = $state<0 | 1>(0);

  const sectionContext = {
    data: {
      formDataTemplate: data.formDataTemplate,
      postSubmission: {
        title: 'Lamaran Berhasil Dikirim',
        description: 'Terima kasih. Data Anda sudah kami terima dan tim kami akan menghubungi Anda jika lolos seleksi awal.',
      },
    },
    meta: {
      show_hkr_contact_detail: false,
    },
  };

  setContext('section', sectionContext);
</script>

<div class="flex flex-col w-full min-h-screen h-full lg:mt-[88px] text-on-surface">
  <div class="flex justify-center w-full py-8 lg:py-12" style="margin-top: var(--topbarHeight);">
    <div class="flex flex-col w-full max-w-screen-xl px-6 lg:px-12 gap-8">
      <div>
        <a href={`/career/${data.career.id}`} class="inline-flex items-center gap-2 text-primary font-semibold text-sm md:text-base hover:opacity-90 transition">
          <i class="ri-arrow-left-line text-lg"></i>
          Kembali
        </a>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        <div class="lg:col-span-4">
          <h1 class="text-3xl md:text-4xl font-bold tracking-wide uppercase text-on-surface/95">{data.career.name}</h1>
          <p class="mt-2 text-primary text-2xl font-semibold">{data.career.category}</p>

          {#if data.career.description}
            <div class="mt-6 rtf-content text-sm leading-relaxed text-outline">{@html data.career.description}</div>
          {/if}
        </div>

        <div class="lg:col-span-8">
          {#if viewIndex === 0}
            <FormView onSubmit={() => (viewIndex = 1)} />
          {:else}
            <SuccessView onPrevious={() => (viewIndex = 0)} />
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>
