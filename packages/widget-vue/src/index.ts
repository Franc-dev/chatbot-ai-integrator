import { defineComponent, h, onMounted, onUnmounted, ref } from "vue";
import { mountWidget, type MountHandle, type WidgetProps } from "@signal/widget-core";

export const SignalChat = defineComponent({
  name: "SignalChat",
  props: {
    publishableKey: { type: String, required: true },
    apiBase: { type: String, default: "" },
    visitorId: { type: String, default: undefined },
  },
  setup(props: WidgetProps) {
    const el = ref<HTMLElement | null>(null);
    let handle: MountHandle | undefined;
    onMounted(() => {
      if (el.value) handle = mountWidget(el.value, props);
    });
    onUnmounted(() => handle?.unmount());
    return () => h("div", { ref: el });
  },
});
