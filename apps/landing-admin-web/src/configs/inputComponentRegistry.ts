import EmbedInput from "@/components/inputs/EmbedInput/EmbedInput.vue";
import MenuItemInput from "@/components/inputs/MenuItemInput/MenuItemInput.vue";
import type { FrameworkInputRegistry } from "@southneuhof/is-vue-framework";
import { defineAsyncComponent } from "vue";

export const inputComponentRegistry: FrameworkInputRegistry = {
    'menu-item': MenuItemInput,
    'embed': EmbedInput,
}