"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
} from "react";
import { cn } from "./cn";

/** Radix forbids empty item values; map optional fields through this sentinel. */
export const SELECT_NONE = "__none";

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = forwardRef<
  ComponentRef<typeof SelectPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    type="button"
    className={cn(
      "group flex w-full items-center justify-between gap-3 rounded-sm border border-[var(--line)] bg-[#0e1014] px-3 py-2.5 text-left text-[14px] text-[var(--fg)] outline-none",
      "transition-[border-color] duration-[var(--dur-press)] ease-[var(--ease-out)]",
      "hover:border-[var(--accent)] focus-visible:border-[var(--accent)] data-[state=open]:border-[var(--accent)]",
      "disabled:opacity-40 data-[placeholder]:text-[var(--mute)]",
      className,
    )}
    {...props}
  >
    <span className="min-w-0 flex-1 truncate">{children}</span>
    <SelectPrimitive.Icon asChild>
      <ChevronDown
        className="size-4 shrink-0 text-[var(--mute)] transition-transform duration-[var(--dur-dropdown)] ease-[var(--ease-out)] group-data-[state=open]:rotate-180 group-data-[state=open]:text-[var(--accent)]"
        strokeWidth={1.75}
      />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = "SelectTrigger";

export const SelectContent = forwardRef<
  ComponentRef<typeof SelectPrimitive.Content>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", sideOffset = 6, ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      sideOffset={sideOffset}
      className={cn(
        "z-[70] overflow-hidden rounded-sm border border-[#2c3038] bg-[#14161b] text-[14px] text-[var(--fg)] shadow-[0_18px_48px_rgba(0,0,0,0.55)]",
        "min-w-[var(--radix-select-trigger-width)] max-h-[min(22rem,var(--radix-select-content-available-height))]",
        className,
      )}
      {...props}
    >
      <div className="ui-enter relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[color-mix(in_oklab,var(--accent)_55%,transparent)]"
        />
        <SelectPrimitive.ScrollUpButton className="flex h-7 items-center justify-center text-[var(--mute)]">
          <ChevronUp className="size-3.5" strokeWidth={1.75} />
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="flex h-7 items-center justify-center text-[var(--mute)]">
          <ChevronDown className="size-3.5" strokeWidth={1.75} />
        </SelectPrimitive.ScrollDownButton>
      </div>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = "SelectContent";

export const SelectItem = forwardRef<
  ComponentRef<typeof SelectPrimitive.Item>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & { hint?: string }
>(({ className, children, hint, textValue, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    textValue={textValue ?? (typeof children === "string" ? children : undefined)}
    className={cn(
      "relative flex cursor-default select-none items-start gap-3 rounded-[3px] py-2 pl-3 pr-9 outline-none",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
      "data-[highlighted]:bg-[color-mix(in_oklab,var(--accent)_11%,transparent)]",
      "data-[state=checked]:bg-[color-mix(in_oklab,var(--accent)_8%,transparent)]",
      "before:absolute before:bottom-1.5 before:left-0 before:top-1.5 before:w-0.5 before:bg-transparent before:content-['']",
      "data-[state=checked]:before:bg-[var(--accent)]",
      className,
    )}
    {...props}
  >
    <span className="min-w-0 flex-1">
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      {hint ? (
        <span className="mt-0.5 block text-[12px] leading-5 text-[var(--mute)]">{hint}</span>
      ) : null}
    </span>
    <SelectPrimitive.ItemIndicator className="absolute right-2.5 top-2.5 text-[var(--accent)]">
      <Check className="size-3.5" strokeWidth={1.75} />
    </SelectPrimitive.ItemIndicator>
  </SelectPrimitive.Item>
));
SelectItem.displayName = "SelectItem";

export const SelectSeparator = forwardRef<
  ComponentRef<typeof SelectPrimitive.Separator>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("mx-1 my-1 h-px bg-[var(--line)]", className)}
    {...props}
  />
));
SelectSeparator.displayName = "SelectSeparator";

export const SelectLabel = forwardRef<
  ComponentRef<typeof SelectPrimitive.Label>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("px-3 py-1.5 text-[12px] text-[var(--mute)]", className)}
    {...props}
  />
));
SelectLabel.displayName = "SelectLabel";
