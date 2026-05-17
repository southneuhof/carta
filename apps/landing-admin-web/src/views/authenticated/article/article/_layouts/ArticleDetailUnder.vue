<script setup lang="ts">
import Tabs from '@southneuhof/is-vue-framework/components/base/Tabs.vue';
import { ref } from 'vue';
import { languages, parseSlug } from '@/utils/common';
import Form from '@southneuhof/is-vue-framework/components/composites/Form.vue';
import { toast } from 'vue-sonner';
import services from '@/utils/services';
import ArticleEditor from './_layouts/ArticleEditor.vue';
import ConfirmationDialog from '@southneuhof/is-vue-framework/components/composites/ConfirmationDialog.vue';
import { keyManager } from '@/stores/keyManager';

const props = defineProps({data: {type: Object, required: true}})
const activeTabIndex = ref(0)
</script>

<template>
  <div class="flex flex-col gap-4">
    <Tabs :config="languages" name="articleLanguageMapUnder_language_tab" v-model="activeTabIndex"/>
    <ArticleEditor v-if="activeTabIndex != null" :article="data" :language="languages[activeTabIndex]" :key="`${activeTabIndex}${keyManager().value['article-translation-detail-under']}`"/>
  </div>
</template>