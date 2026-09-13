import { render } from "preact";
import { WidgetApp, type WidgetProps } from "./app";
import { widgetCss } from "./styles";

export type MountHandle = { unmount: () => void };

export function mountWidget(target: HTMLElement, props: WidgetProps): MountHandle {
  const host = document.createElement("signal-widget");
  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = widgetCss;
  const root = document.createElement("div");
  shadow.append(style, root);
  target.appendChild(host);
  render(<WidgetApp {...props} />, root);
  return {
    unmount() {
      render(null, root);
      host.remove();
    },
  };
}
