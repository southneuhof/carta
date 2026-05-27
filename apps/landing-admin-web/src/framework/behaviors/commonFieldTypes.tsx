import { defineComponent } from "vue";
import ImagePreview from '@southneuhof/is-vue-framework/components/base/ImagePreview.vue'
import {h} from 'vue'

export const commonFieldTypes: Record<string, any> = {
  image: defineComponent({
    props: {
      data: {
        type: Object,
        required: true
      }
    },
    setup(props) {
      return () => <ImagePreview imageURL={props.data?.url}></ImagePreview>;
    }
  }),
}