<script setup lang="ts">
import { ref, watch, type PropType } from 'vue';
import services from '@/utils/services';
import Card from '@southneuhof/is-vue-framework/components/base/Card.vue';
import Spinner from '@southneuhof/is-vue-framework/components/base/Spinner.vue';

const props = defineProps({
  level: { type: Number, required: true },
  parentId: { type: String, default: undefined },
  selectedId: { type: String, default: undefined },
  allowedMenuItemTypes: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  requireSlug: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:selectedId', 'item-selected']);

const menuItems = ref<any[]>([]);
const isLoading = ref(false);

async function fetchMenuItems() {
  isLoading.value = true;
  try {
    const params: any = { level: props.level, limit: 999, order_by: 'display_order', order_direction: 'asc' };
    if (props.parentId) {
      params.parent_id = props.parentId;
    } else {
      // For level 1, ensure we only get top-level items (parent_id is NULL)
      // The API needs to handle { level: 1, parent_id: null/undefined } correctly
      // or have a specific way to denote top-level items if parent_id is always expected.
      // Assuming parent_id: undefined works for level 1.
    }
    const { data } = await services.list('menuItem', params);
    const fetchedItems = data || [];
    menuItems.value = fetchedItems.filter((item: any) => {
      if (props.requireSlug && !item?.slug) return false;
      if (props.allowedMenuItemTypes.length && !props.allowedMenuItemTypes.includes(String(item?.menu_item_type))) return false;
      return true;
    });
  } catch (error) {
    console.error(`Failed to fetch menu items for level ${props.level} ${props.parentId ? `with parent ${props.parentId}` : ''}:`, error);
    menuItems.value = [];
    // Optionally, show a toast error using your toast store
  } finally {
    isLoading.value = false;
  }
}

function handleItemClick(item: any) {
  emit('update:selectedId', item.id);
  emit('item-selected', {
    id: item.id,
    slug: item.slug,
    name: item.translations?.find((t: any) => t.language === 'id')?.name || item.name || 'Unnamed Item',
    level: props.level
  });
}

watch(() => [props.parentId, props.level], () => {
    // Only fetch if level is 1, or if level > 1 and parentId is provided
    if (props.level === 1 || (props.level > 1 && props.parentId)) {
        fetchMenuItems();
    } else if (props.level > 1 && !props.parentId) {
        // If parentId is required for level > 1 and not provided, clear items
        menuItems.value = [];
        isLoading.value = false;
    }
}, { immediate: true, deep: true });

</script>

<template>
  <div class="menu-item-input-view">
    <div v-if="isLoading" class="flex items-center justify-center p-4 min-h-[100px]">
      <Spinner />
    </div>
    <div v-else-if="!menuItems.length" class="p-4 text-muted text-center min-h-[100px] flex items-center justify-center">
      No items found.
    </div>
    <div v-else class="flex flex-col gap-2">
      <Card
        v-for="item in menuItems"
        :key="item.id"
        @click="handleItemClick(item)"
        :color="item.id === selectedId ? 'primary' : 'surfaceContainer'"
        class="flex flex-row items-center justify-between p-3"
        interactive
      >
        <span class="text-sm">{{ item.translations?.find((t: any) => t.language === 'id')?.name || item.name || 'Unnamed Item' }}</span>
        <!-- <Icon v-if="item.id === selectedId" size="sm">check</Icon> -->
      </Card>
    </div>
  </div>
</template>

<style scoped>
.menu-item-input-view {
  border: 1px solid var(--color-outline-variant); /* Use theme variable if available */
  border-radius: 4px;
  overflow-y: auto;
  max-height: 300px; /* Adjust as needed */
  min-height: 100px; /* Ensure some default height */
  background-color: var(--color-surface-container-lowest); /* Use theme variable */
}
</style>
