<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import services from '@/utils/services'; // Assuming @ points to src/

// Define MenuItem and MenuItemTranslation interfaces based on the schema
interface MenuItemTranslation {
  id: string;
  menu_item_id: string;
  language: string; // Consider if Language is a specific type/enum
  name: string;
}

interface MenuItem {
  id: string;
  parent_id?: string | null;
  level: number;
  menu_item_type: string; // Consider if MenuItemType is a specific type/enum
  visible: boolean;
  primary: boolean;
  slug: string;
  url?: string | null;
  order: number;
  translations: MenuItemTranslation[];
}

const props = defineProps<{
  modelValue: string | null; // The relative URL (slug)
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void;
}>();

const isModalOpen = ref(false);
const loading = ref(false);
const error = ref<string | null>(null);

const allItems = ref<MenuItem[]>([]);
const allItemsById = computed(() => {
  const map = new Map<string, MenuItem>();
  allItems.value.forEach(item => map.set(item.id, item));
  return map;
});

const selectedLevel0Id = ref<string | null>(null);
const selectedLevel1Id = ref<string | null>(null);

// Computed properties for items at each level
const level0Items = computed(() => {
  return allItems.value
    .filter(item => item.level === 0)
    .sort((a, b) => a.order - b.order);
});

const level1Items = computed(() => {
  if (!selectedLevel0Id.value) return [];
  return allItems.value
    .filter(item => item.parent_id === selectedLevel0Id.value && item.level === 1)
    .sort((a, b) => a.order - b.order);
});

const level2Items = computed(() => {
  if (!selectedLevel1Id.value) return [];
  return allItems.value
    .filter(item => item.parent_id === selectedLevel1Id.value && item.level === 2)
    .sort((a, b) => a.order - b.order);
});

async function fetchMenuItems() {
  if (allItems.value.length > 0 && !error.value) return; 

  loading.value = true;
  error.value = null;
  try {
    // Assuming services.list might need an 'include' for relations like translations
    // Adjust if your service call handles this differently.
    const response = await services.list('menuItem', { limit: 1000, include: 'translations' }); 
    
    if (response && response.data && Array.isArray(response.data)) {
        allItems.value = response.data as MenuItem[];
    } else if (Array.isArray(response)) { 
        allItems.value = response as MenuItem[];
    } else {
        console.warn('Unexpected response structure from services.list for menuItem:', response);
        allItems.value = [];
        error.value = 'Failed to parse menu items from response.';
    }
  } catch (err) {
    console.error('Failed to fetch menu items:', err);
    error.value = (err instanceof Error ? err.message : String(err)) || 'Unknown error occurred.';
    allItems.value = [];
  } finally {
    loading.value = false;
  }
}

function openModal() {
  isModalOpen.value = true;
  fetchMenuItems(); 
}

function closeModal() {
  isModalOpen.value = false;
}

function getItemName(item: MenuItem | undefined): string {
  if (!item) return 'Unknown Item';
  if (item.translations && item.translations.length > 0) {
    return item.translations[0].name; // Basic: take the first translation
  }
  return item.slug || item.id; // Fallback name
}

function handleLevel0Click(item: MenuItem) {
  selectedLevel0Id.value = item.id;
  selectedLevel1Id.value = null; 
}

function handleLevel1Click(item: MenuItem) {
  selectedLevel1Id.value = item.id;
}

function selectItemAndClose(item: MenuItem) {
  if (item.slug) {
    emit('update:modelValue', item.slug);
  } else {
    console.warn('Selected item does not have a slug:', item);
    // Optionally, emit null or handle as an error/notification
  }
  closeModal();
}

function clearSelection() {
  emit('update:modelValue', null);
  closeModal();
}

const currentSelectedItemName = computed(() => {
    if (!props.modelValue) return "Click to select menu item";
    // Ensure allItems is populated before trying to find
    if (allItems.value.length === 0 && !loading.value && !error.value) {
        // If modelValue exists, items are not loaded, not loading, and no error,
        // it implies items might need to be fetched to display the name.
        // This can happen if the component is initialized with a modelValue.
        // The watch below handles initial fetch.
    }
    const selectedItem = allItems.value.find(item => item.slug === props.modelValue);
    if (selectedItem) return getItemName(selectedItem);
    return props.modelValue; // Show slug if item not found (e.g. before full list loaded or if slug is external)
});

watch(() => props.modelValue, async (newSlug) => {
    if (newSlug && allItems.value.length === 0 && !loading.value && !error.value) {
        await fetchMenuItems();
    }
}, { immediate: true });

</script>

<template>
  <div>
    <input 
      type="text" 
      :value="currentSelectedItemName" 
      readonly 
      @click="openModal" 
      placeholder="Click to select menu item" 
      class="menu-item-input-display"
    />

    <div v-if="isModalOpen" class="modal-overlay" @mousedown.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Select Menu Item</h3>
          <button @click="closeModal" class="modal-close-button" aria-label="Close modal">&times;</button>
        </div>
        
        <div class="modal-body">
          <div v-if="loading" class="loading-indicator">Loading menu items...</div>
          <div v-if="error" class="error-message">Error: {{ error }}</div>
          
          <div v-if="!loading && !error && allItems.length === 0" class="no-items-message">
            No menu items found.
          </div>

          <div v-if="!loading && !error && allItems.length > 0" class="menu-levels-container">
            <!-- Level 0 -->
            <div class="menu-level-column">
              <h4>Root Level</h4>
              <ul v-if="level0Items.length > 0">
                <li 
                  v-for="itemL0 in level0Items" 
                  :key="itemL0.id" 
                  @click="handleLevel0Click(itemL0)"
                  @dblclick="itemL0.slug ? selectItemAndClose(itemL0) : null"
                  :class="{ 'selected-path': selectedLevel0Id === itemL0.id, 'selectable': !!itemL0.slug }"
                  :title="itemL0.slug ? `Double click to select '${getItemName(itemL0)}'. Click to view children.` : `Click to view children. (Not selectable)`"
                >
                  <span>{{ getItemName(itemL0) }}</span>
                  <button v-if="itemL0.slug" @click.stop="selectItemAndClose(itemL0)" class="select-button">Select</button>
                </li>
              </ul>
              <p v-else>No root items.</p>
            </div>

            <!-- Level 1 -->
            <div class="menu-level-column">
              <h4>Level 1 <span v-if="selectedLevel0Id && allItemsById.get(selectedLevel0Id)"> (of {{ getItemName(allItemsById.get(selectedLevel0Id)!) }})</span></h4>
              <ul v-if="level1Items.length > 0">
                <li 
                  v-for="itemL1 in level1Items" 
                  :key="itemL1.id" 
                  @click="handleLevel1Click(itemL1)"
                  @dblclick="itemL1.slug ? selectItemAndClose(itemL1) : null"
                  :class="{ 'selected-path': selectedLevel1Id === itemL1.id, 'selectable': !!itemL1.slug }"
                  :title="itemL1.slug ? `Double click to select '${getItemName(itemL1)}'. Click to view children.` : `Click to view children. (Not selectable)`"
                >
                  <span>{{ getItemName(itemL1) }}</span>
                   <button v-if="itemL1.slug" @click.stop="selectItemAndClose(itemL1)" class="select-button">Select</button>
                </li>
              </ul>
              <p v-else-if="selectedLevel0Id">No items at this level.</p>
              <p v-else>Select an item from Root Level.</p>
            </div>

            <!-- Level 2 -->
            <div class="menu-level-column">
              <h4>Level 2 <span v-if="selectedLevel1Id && allItemsById.get(selectedLevel1Id)"> (of {{ getItemName(allItemsById.get(selectedLevel1Id)!) }})</span></h4>
              <ul v-if="level2Items.length > 0">
                <li 
                  v-for="itemL2 in level2Items" 
                  :key="itemL2.id" 
                  @click.stop="itemL2.slug ? selectItemAndClose(itemL2) : null"
                  :class="{'selectable': !!itemL2.slug}"
                  :title="itemL2.slug ? `Click to select '${getItemName(itemL2)}'` : `(Not selectable)`"
                >
                  <span>{{ getItemName(itemL2) }}</span>
                  <button v-if="itemL2.slug" @click.stop="selectItemAndClose(itemL2)" class="select-button">Select</button>
                </li>
              </ul>
              <p v-else-if="selectedLevel1Id">No items at this level.</p>
              <p v-else>Select an item from Level 1.</p>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="clearSelection" class="button-clear">Clear Selection & Close</button>
          <button @click="closeModal" class="button-cancel">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.menu-item-input-display {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  background-color: #f9f9f9;
  box-sizing: border-box;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 900px; 
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
  margin-bottom: 15px;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.modal-close-button {
  background: none;
  border: none;
  font-size: 1.75rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.modal-body {
  overflow-y: auto;
  flex-grow: 1;
}

.loading-indicator, .error-message, .no-items-message {
  padding: 15px;
  text-align: center;
  font-style: italic;
}

.error-message {
  color: #721c24;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}

.menu-levels-container {
  display: flex;
  gap: 15px;
}

.menu-level-column {
  flex: 1; 
  border: 1px solid #ddd;
  padding: 10px;
  border-radius: 4px;
  min-width: 200px; 
  max-height: calc(80vh - 150px); /* Adjust based on header/footer height */
  overflow-y: auto; 
  display: flex;
  flex-direction: column;
}

.menu-level-column h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1.1em;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.menu-level-column h4 span {
  font-weight: normal;
  font-size: 0.9em;
  color: #555;
}


.menu-level-column ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
  flex-grow: 1; /* Allow ul to take available space */
}

.menu-level-column li {
  padding: 6px 8px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.95em;
}
.menu-level-column li span {
  flex-grow: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 5px;
}


.menu-level-column li:last-child {
  border-bottom: none;
}

.menu-level-column li.selectable:hover {
  background-color: #e9ecef;
}

.menu-level-column li.selected-path {
  background-color: #cfe2ff;
  font-weight: 500;
}

.select-button {
  margin-left: 8px;
  padding: 3px 7px;
  font-size: 0.85em;
  cursor: pointer;
  border: 1px solid #007bff;
  background-color: #007bff;
  color: white;
  border-radius: 3px;
  white-space: nowrap;
}
.select-button:hover {
  background-color: #0056b3;
}


.modal-footer {
  border-top: 1px solid #eee;
  padding-top: 15px;
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.modal-footer button {
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid transparent;
  font-size: 0.9em;
}

.button-clear {
  background-color: #ffc107;
  color: #212529;
  border-color: #ffc107;
}
.button-clear:hover {
  background-color: #e0a800;
}

.button-cancel {
  background-color: #6c757d;
  color: white;
  border-color: #6c757d;
}
.button-cancel:hover {
  background-color: #5a6268;
}
</style>