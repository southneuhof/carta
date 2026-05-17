<script lang="ts">
  import Button from "$lib/app/components/ui/Button.svelte";
  import TabItem from "$lib/app/components/ui/tabs/TabItem.svelte";
  import Tabs from "$lib/app/components/ui/tabs/Tabs.svelte";
  import { Dialog } from "bits-ui";

  const {section} = $props()
  let activeTabIndex = $state(0)
</script>

<div class="flex items-center justify-center w-full">
  <div class="max-w-screen-xl flex flex-col gap-12 w-full items-center justify-center px-6 lg:px-12 py-6 lg:py-12">
    <div class="w-fit max-w-full overflow-auto flex items-center justify-center">
      <Tabs data={section.data.childSections} bind:activeTabIndex={activeTabIndex}>
        {#snippet tabItem(tabItem: any)}
          {tabItem.name}
        {/snippet}
      </Tabs>
    </div>
    <div class="flex flex-col gap-lg">
      <div class="flex flex-col gap-xs items-center justify-center">
        <p class="text-center">{section.data.childSections[activeTabIndex].content.subtitle}</p>
        <p class="text-xl md:text-2xl font-bold text-center">{section.data.childSections[activeTabIndex].content.title}</p>
      </div>
      <div class="flex flex-row flex-wrap justify-center gap-6">
        {#each section.data.childSections[activeTabIndex].gallery as item}
          <Dialog.Root>
            <Dialog.Trigger class="w-[275px] max-w-[275px] min-h-full grow">
              <div class="group flex flex-col items-center gap-base pb-12 hover:outline-outline-variant outline outline-transparent transition-all duration-100 rounded-lg relative h-full">
                <!-- <div class="relative">
                  <div class="absolute inset-[-5%] opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500 ease-in-out origin-center blur-2xl bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.25)_0%,rgba(234,88,12,0.12)_40%,transparent_80%),linear-gradient(135deg,rgba(167,139,250,0.1)_0%,rgba(251,146,60,0.2)_50%,transparent_100%)]"></div>
                  <img src={item.media} class="w-[180px] aspect-[3/4] object-center object-cover relative z-10" alt={item.title}/>
                </div> -->
                <div class="w-full h-[366px] pt-12 flex items-end justify-center bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.15),rgba(234,88,12,0.08)_50%,transparent_100%),linear-gradient(135deg,rgba(167,139,250,0.05)_0%,rgba(251,146,60,0.1)_100%),repeating-linear-gradient(45deg,rgba(255,255,255,0.03)_0px,rgba(255,255,255,0.03)_1px,transparent_1px,transparent_10px)]">
                  <img src={item.media} alt={item.title} class="w-full object-center object-cover"/>
                </div>
                <div class="flex flex-col gap-sm items-center justify-center max-w-full">
                  <p class="font-semibold text-xl">{item.title}</p>
                  <p class="text-outline">{item.subtitle}</p>
                </div>
              </div>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay
                class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-[100] bg-black/80"
              />
              <Dialog.Content class="bg-surface max-h-[75vh] rounded-lg text-on-surface data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed left-[50%] top-[50%] z-[100] translate-x-[-50%] translate-y-[-50%] w-[800px] max-w-[95vw] flex">
                <div class="relative flex lg:flex-row flex-col w-full">
                  <Dialog.Close class="absolute top-6 right-6">
                    <i class="ri-close-line"></i>
                  </Dialog.Close>
                  <div class="min-w-[240px] flex items-end justify-center bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.15),rgba(234,88,12,0.08)_50%,transparent_100%),linear-gradient(135deg,rgba(167,139,250,0.05)_0%,rgba(251,146,60,0.1)_100%),repeating-linear-gradient(45deg,rgba(255,255,255,0.03)_0px,rgba(255,255,255,0.03)_1px,transparent_1px,transparent_10px)]">
                    <img src={item.media} alt={item.title} class="aspect-[3/4] w-[240px] object-center object-cover"/>
                  </div>
                                    <div class="flex flex-col gap-base py-6 lg:py-12 px-12 col-span-3 overflow-y-auto">
                    <div class="flex flex-col">
                      <p class="text-xl font-bold">{item.title}</p>
                      <p class="text-outline">{item.subtitle}</p>
                    </div>
                    <p class="rtf-content m-base">{@html item.description}</p>
                  </div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        {/each}
      </div>
    </div>
  </div>
</div>