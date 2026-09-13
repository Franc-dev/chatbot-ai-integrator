"use client";

import { useEffect, useRef } from "react";
import { mountWidget, type WidgetProps } from "@signal/widget-core";

export function SignalChat(props: WidgetProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const handle = mountWidget(ref.current, props);
    return () => handle.unmount();
  }, [props.publishableKey, props.apiBase, props.visitorId]);
  return <div ref={ref} />;
}
