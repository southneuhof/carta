<script lang="ts">
  import * as m from '$lib/paraglide/messages.js'
  import {page} from '$app/state';
  import { getLocale } from '$lib/paraglide/runtime';
  
  const contactDetailData = page.data.collection.find((item: any) => item.code === 'contact-detail')?.data
</script>

<!-- <div class="h-[36px] w-full"></div> -->
<div class="w-full">
  <div
    class="w-full py-16 flex flex-col items-center justify-center bg-[#ECEFF1] border-t border-outline-variant bg-center bg-cover"
  >
    <div class="w-full max-w-screen-xl px-12 grid grid-dynamic-[250px] gap-8">
      <div class="flex flex-col gap-base">
        <div class="flex flex-row items-center gap-base">
          <img src="/assets/logo/danantara.png?{new Date().toJSON()}" alt="HK Realtindo" class="w-[128px]"/>
          <img src="/assets/logo/hkr.svg?{new Date().toJSON()}" alt="HK Realtindo" class="w-[85px] h-[36px] mt-2"/>
        </div>
        <div class="flex flex-col gap-sm">
          <p class="font-semibold">{page.data.companyProfile.name}</p>
          <p>{page.data.companyProfile.address}</p>
        </div>
      </div>
      <div class="flex flex-col gap-base">
        <p class="text-xl font-bold">{m.contact_us()}</p>
        <!-- <div class="flex flex-row gap-sm">
          <i class="ri-mail-line"></i>
          <a href="mailto:{page.data.companyProfile.email}" data-analytics-contact={`mailto:${page.data.companyProfile.email}`}>{page.data.companyProfile.email}</a>
        </div> -->
        {#each contactDetailData?.slice(0, 2) as contactDetail}
          <div class="flex flex-row gap-sm">
            <i class="{contactDetail.media}"></i>
            <a href={contactDetail.url} data-analytics-contact={contactDetail.url} aria-label={contactDetail.name} target="_blank">{contactDetail.label}</a>
          </div>
        {/each}
        <div class="flex flex-row items-center gap-2">
          {#each contactDetailData?.slice(2) as socialMedia}
            <a href={socialMedia.url} data-analytics-contact={socialMedia.url} aria-label={socialMedia.name} target="_blank"><i class="{socialMedia.media} text-xl"></i></a>
          {/each}
        </div>
      </div>
      <!-- <div class="flex flex-col gap-base">
        <p class="font-bold text-xl">{m.others()}</p>
        {#each page.data.companyProfile.subsidiaries as subsidiary}
          <a class="underline" data-analytics-redirect={subsidiary.type === 'external' ? subsidiary.url : undefined} href={subsidiary.type === 'external' ? subsidiary.url : subsidiary.slug} target={subsidiary.type === 'external' ? '_blank' : undefined}>{subsidiary.name}</a>
        {/each}
      </div>
      <div class="flex flex-col gap-base">
        <p class="font-bold text-xl">{m.products()}</p>
        {#each page.data.collection.find((item: any) => item.code === 'project-category')?.data as category}
          <a class="underline" href="{page.data.projectListMenuPath}?category_code={category.code}#project-list">{getLocale() === 'en' ? category.name_en : category.name_id}</a>
        {/each}
      </div> -->
      {#each page.data.collection.find((item: any) => item.code === 'footer-sections')?.data as section}
        <div class="flex flex-col gap-base">
          <p class="font-bold text-xl">{getLocale() === 'id' ? section.name : section.name_en}</p>
          {#each section.links as link}
            <a class="max-w-fit flex flex-row items-center gap-xs" data-analytics-redirect={link.url} href={link.url} target="_blank">
              {#if link.icon}<i class={link.icon}></i>{/if}
              <p class="underline">{getLocale() === 'id' ? link.label : link.label_en}</p>
            </a>
          {/each}
        </div>
      {/each}
    </div>
  </div>
  <div class="w-full h-[9px] bg-primary"></div>
  <div class="w-full h-[6px] bg-secondary"></div>
</div>
