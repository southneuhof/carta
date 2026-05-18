import type { FrameworkInputRegistry } from "@southneuhof/is-vue-framework";
import { defineAsyncComponent } from "vue";

export const inputComponentRegistry: FrameworkInputRegistry = {
    'menu-item': defineAsyncComponent(() => import('@/components/inputs/MenuItemInput.vue')),
}