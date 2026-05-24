<script lang="ts">
  import * as m from '$lib/paraglide/messages.js'
  import {page} from '$app/state';
  import { getLocale } from '$lib/paraglide/runtime';
  
  const contactDetailData = page.data.collection.find((item: any) => item.code === 'contact-detail')?.data
</script>

<div class="w-full bg-[#333030] text-white">
  <div class="w-full py-16 flex flex-col items-center justify-center">
    <div class="w-full max-w-screen-xl px-6 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-12">
      <!-- Column 1 -->
      <div class="flex flex-col gap-4">
        <div class="bg-white p-2 rounded flex items-center justify-center w-[120px] h-[100px]">
          <img src="/assets/logo/mjl.svg?{new Date().toJSON()}" alt={page.data.companyProfile?.name || 'Logo'} class="w-full h-full object-contain"/>
        </div>
        <div class="flex flex-col gap-2 mt-2">
          <p class="text-gray-300 text-sm leading-relaxed max-w-[250px]">
            {page.data.companyProfile?.address || 'Ruko Royal Square, Semarang'}
          </p>
          
          <!-- Social Media Aligned in Row -->
          <div class="flex flex-row items-center gap-3 text-gray-300 mt-2">
            <span class="text-sm">Follow us:</span>
            {#if contactDetailData && contactDetailData.length > 2}
              {#each contactDetailData.slice(2) as socialMedia}
                <a href={socialMedia.url} data-analytics-contact={socialMedia.url} aria-label={socialMedia.name} target="_blank" class="hover:text-white transition-colors duration-200">
                  <i class="{socialMedia.media} text-lg"></i>
                </a>
              {/each}
            {:else}
              {#if page.data.companyProfile?.facebook}
                <a href={page.data.companyProfile?.facebook} aria-label="Facebook" target="_blank" class="hover:text-white transition-colors duration-200">
                  <i class="ri-facebook-circle-fill text-lg"></i>
                </a>
              {/if}
              {#if page.data.companyProfile?.instagram}
                <a href={page.data.companyProfile?.instagram} aria-label="Instagram" target="_blank" class="hover:text-white transition-colors duration-200">
                  <i class="ri-instagram-line text-lg"></i>
                </a>
              {/if}
              {#if page.data.companyProfile?.youtube}
                <a href={page.data.companyProfile?.youtube} aria-label="YouTube" target="_blank" class="hover:text-white transition-colors duration-200">
                  <i class="ri-youtube-fill text-lg"></i>
                </a>
              {/if}
            {/if}
          </div>
        </div>
      </div>

      <!-- Column 2 (Get To Know Us) -->
      {#if page.data.collection.find((item: any) => item.code === 'footer-sections')?.data}
        {#each page.data.collection.find((item: any) => item.code === 'footer-sections')?.data as section}
          <div class="flex flex-col gap-4">
            <p class="font-bold text-lg text-white mb-1">{getLocale() === 'id' ? section.name : section.name_en}</p>
            <div class="flex flex-col gap-2.5">
              {#each section.links as link}
                <a class="max-w-fit flex flex-row items-center gap-2 text-gray-300 hover:text-white transition-colors duration-200" data-analytics-redirect={link.url} href={link.url} target="_blank">
                  {#if link.icon}<i class={link.icon}></i>{/if}
                  <p class="underline decoration-gray-400 hover:decoration-white text-sm">{getLocale() === 'id' ? link.label : link.label_en}</p>
                </a>
              {/each}
            </div>
          </div>
        {/each}
      {:else}
        <!-- Fallback standard static list if DB is empty -->
        <div class="flex flex-col gap-4">
          <p class="font-bold text-lg text-white mb-1">Get To Know Us</p>
          <div class="flex flex-col gap-2.5">
            <a href="/produk" class="underline text-gray-300 hover:text-white text-sm">Produk</a>
            <a href="/sertifikasi" class="underline text-gray-300 hover:text-white text-sm">Sertifikasi</a>
            <a href="/karir" class="underline text-gray-300 hover:text-white text-sm">Karir</a>
            <a href="/kontak" class="underline text-gray-300 hover:text-white text-sm">Kontak Kami</a>
          </div>
        </div>
      {/if}

      <!-- Column 3 (Contact Us) -->
      <div class="flex flex-col gap-4">
        <p class="font-bold text-lg text-white mb-1">{m.contact_us() || 'Contact Us'}</p>
        <div class="flex flex-col gap-3">
          <!-- Email -->
          <div class="flex flex-row items-center gap-3 text-gray-300">
            <i class="ri-mail-line text-lg"></i>
            <a href="mailto:{page.data.companyProfile?.email || 'info@ptmjl.co.id'}" data-analytics-contact={`mailto:${page.data.companyProfile?.email || 'info@ptmjl.co.id'}`} class="hover:text-white transition-colors duration-200 underline decoration-gray-400 hover:decoration-white text-sm">
              {page.data.companyProfile?.email || 'info@ptmjl.co.id'}
            </a>
          </div>
          <!-- Phone -->
          <div class="flex flex-row items-center gap-3 text-gray-300">
            <i class="ri-phone-line text-lg"></i>
            <a href="tel:{page.data.companyProfile?.phone || '(021)-8563570'}" data-analytics-contact={`tel:${page.data.companyProfile?.phone || '(021)-8563570'}`} class="hover:text-white transition-colors duration-200 underline decoration-gray-400 hover:decoration-white text-sm">
              {page.data.companyProfile?.phone || '(021) - 8563570'}
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Separator Divider -->
    <div class="w-full max-w-screen-xl px-6 md:px-12 mt-12">
      <hr class="border-t border-white/10 w-full" />
    </div>

    <!-- Copyright Block -->
    <div class="w-full max-w-screen-xl px-6 md:px-12 mt-6">
      <p class="text-gray-400 text-sm">
        Copyright &copy; 2026 {page.data.companyProfile?.name || 'Must Chick'}. All rights reserved.
      </p>
    </div>
  </div>
</div>
