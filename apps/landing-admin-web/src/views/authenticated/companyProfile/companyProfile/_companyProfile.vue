<script setup lang="ts">
  import { computed, ref } from 'vue';
  import TestComponent from './_components/TestComponent.vue';

  const isTestComponentShown = ref(false);
  const customMessage = ref<string>();

  const userArray = ref<(string | undefined)[]>([]);
  const userArrayItemInputBuffer = ref<string | undefined>('');
  
  const userNumber = ref<number>(1);
  const userNumberTimesTwo = computed(() => userNumber.value * 2);
</script>

<template>
  <div class="flex justify-center w-full h-screen py-8">
    <div class="w-full max-w-screen-xl flex flex-col gap-12">
      <p class="text-xl font-semibold">Vue Test</p>

      <div class="flex flex-col gap-2">
        <p class="text-sm font-bold uppercase">Test Component & Reactivity & If Block Demo</p>
        <button
          class="bg-primary text-on-primary px-4 py-2 rounded-full max-w-fit"
          @click="() => {
            isTestComponentShown = !isTestComponentShown;
          }"
        >
          Show Test Component: {{ isTestComponentShown ? 'Yes' : 'No' }}
        </button>

        <div v-if="isTestComponentShown" class="flex flex-col gap-2 max-w-fit">
          <input type="text" v-model="customMessage" placeholder="enter optional message" />
          <TestComponent :optionalMessage="customMessage" mandatoryMessage="mandatory is too provided" />
          <p class="text-sm text-muted">Dynamic Component</p>
          <component :is="TestComponent" :optionalMessage="customMessage" mandatoryMessage="mandatory is too provided" />
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <p class="text-sm font-bold uppercase">Form & Each Block Demo</p>
        <form
          @submit.prevent="() => {
            userArray.push(userArrayItemInputBuffer);
            userArrayItemInputBuffer = undefined;
          }"
        >
          <input v-model="userArrayItemInputBuffer" placeholder="insert array item value" />
          <button type="submit" class="bg-primary text-on-primary px-4 py-2 rounded-full max-w-fit">Submit</button>
        </form>
        <p>{{ JSON.stringify(userArray) }}</p>
        <div class="flex flex-col gap-1">
          <p v-for="arrayItem in userArray">{{ arrayItem }}</p>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <input type="number" v-model.number="userNumber" class="max-w-fit" />
        <p>Whilst {{ userNumber }} x 2 is:</p>
        <transition name="fly" mode="out-in">
          <p :key="userNumberTimesTwo" class="text-lg font-bold">{{ userNumberTimesTwo }}</p>
        </transition>
      </div>

      <div class="flex flex-col gap-2">
        <p class="text-sm font-bold uppercase">HTML String Demo</p>
        <div v-html="`<div>this is an html string</div>`"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fly-enter-active, .fly-leave-active {
  transition: transform 0.2s, opacity 0.2s;
}
.fly-enter-from, .fly-leave-to {
  transform: translateY(20px);
  opacity: 0;
}
</style>
