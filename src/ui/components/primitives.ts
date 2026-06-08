import { el } from "../dom.js";

export type ButtonVariant = "primary" | "secondary";

export interface ButtonOptions {
  variant?: ButtonVariant;
  onClick?: ((event: MouseEvent) => void) | undefined;
  disabled?: boolean;
  icon?: string;
  iconOnly?: boolean;
  title?: string;
}

export function createButton(
  label: string,
  optionsOrVariant: ButtonVariant | ButtonOptions = "secondary",
  onClick?: (event: MouseEvent) => void,
  disabled = false,
): HTMLButtonElement {
  const options: ButtonOptions = typeof optionsOrVariant === "string"
    ? { variant: optionsOrVariant, onClick, disabled }
    : { ...optionsOrVariant };
  const variant = options.variant ?? "secondary";
  const isDisabled = options.disabled ?? disabled;
  const { icon, iconOnly, title } = options;
  const onClickHandler = options.onClick ?? onClick;
  const children: HTMLElement[] = [];
  if (icon) {
    children.push(el("span", {
      className: "material-symbols-outlined button-icon",
      text: icon,
      attrs: { "aria-hidden": "true" },
    }));
  }
  if (!iconOnly) {
    children.push(el("span", { className: "button-label", text: label }));
  }
  const button = el("button", {
    className: `button button-${variant}${iconOnly ? " button-icon-only" : ""}`,
    attrs: {
      type: "button",
      title: title ?? (iconOnly ? label : undefined),
      "aria-label": iconOnly ? label : undefined,
      ...(isDisabled ? { disabled: "true", "aria-disabled": "true" } : {}),
    },
  }, children);
  if (onClickHandler) {
    button.addEventListener("click", (event) => onClickHandler(event));
  }
  return button;
}

export interface TabButtonOptions<T extends string> {
  active: boolean;
  onSelect: (value: T) => void;
  icon?: string;
  iconOnly?: boolean;
}

export function createTabButton<T extends string>(
  label: string,
  value: T,
  activeValue: T,
  onSelect: (value: T) => void,
  extras: { icon?: string; iconOnly?: boolean } = {},
): HTMLButtonElement {
  const isActive = value === activeValue;
  const { icon, iconOnly } = extras;
  const children: HTMLElement[] = [];
  if (icon) {
    children.push(el("span", {
      className: "material-symbols-outlined tab-icon",
      text: icon,
      attrs: { "aria-hidden": "true" },
    }));
  }
  if (!iconOnly) {
    children.push(el("span", { className: "tab-label", text: label }));
  }
  return el("button", {
    className: `tab-button${isActive ? " is-active" : ""}${iconOnly ? " tab-icon-only" : ""}`,
    attrs: {
      type: "button",
      role: "tab",
      "aria-selected": isActive ? "true" : "false",
      title: iconOnly ? label : undefined,
      "aria-label": iconOnly ? label : undefined,
    },
    onClick: () => onSelect(value),
  }, children);
}

export function createValueRow(label: string, value: string): HTMLElement {
  return el("div", { className: "value-row" }, [
    el("span", { text: label }),
    el("strong", { text: value }),
  ]);
}
