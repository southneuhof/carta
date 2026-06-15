import ButtonConfigInput from "@/components/inputs/ButtonConfigInput/ButtonConfigInput.vue";
import EmbedInput from "@/components/inputs/EmbedInput/EmbedInput.vue";
import MenuItemInput from "@/components/inputs/MenuItemInput/MenuItemInput.vue";
import type { FrameworkInputRegistry } from "@southneuhof/is-vue-framework";

export const inputComponentRegistry: FrameworkInputRegistry = {
    'button-config': ButtonConfigInput,
    'menu-item': MenuItemInput,
    'embed': EmbedInput,
}
