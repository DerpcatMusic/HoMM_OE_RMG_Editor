export type DomChild = Node | string | null | undefined | false;

export interface ElementOptions {
  className?: string;
  text?: string;
  attrs?: Record<string, string | number | boolean | undefined>;
  dataset?: Record<string, string | undefined>;
  onClick?: (event: MouseEvent) => void;
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  options: ElementOptions = {},
  children: readonly DomChild[] = [],
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  if (options.className) {
    element.className = options.className;
  }
  if (options.text !== undefined) {
    element.textContent = options.text;
  }
  if (options.attrs) {
    for (const [key, value] of Object.entries(options.attrs)) {
      if (value === undefined || value === false) {
        continue;
      }
      element.setAttribute(key, value === true ? "" : String(value));
    }
  }
  if (options.dataset) {
    for (const [key, value] of Object.entries(options.dataset)) {
      if (value !== undefined) {
        element.dataset[key] = value;
      }
    }
  }
  if (options.onClick) {
    element.addEventListener("click", (event) => options.onClick?.(event as MouseEvent));
  }
  appendChildren(element, children);
  return element;
}

export function appendChildren(parent: HTMLElement, children: readonly DomChild[]): void {
  for (const child of children) {
    if (child === null || child === undefined || child === false) {
      continue;
    }
    parent.append(child);
  }
}

export function svgEl<K extends keyof SVGElementTagNameMap>(
  tagName: K,
  options: ElementOptions = {},
  children: readonly DomChild[] = [],
): SVGElementTagNameMap[K] {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tagName);
  if (options.className) {
    element.setAttribute("class", options.className);
  }
  if (options.text !== undefined) {
    element.textContent = options.text;
  }
  if (options.attrs) {
    for (const [key, value] of Object.entries(options.attrs)) {
      if (value === undefined || value === false) {
        continue;
      }
      element.setAttribute(key, value === true ? "" : String(value));
    }
  }
  if (options.dataset) {
    for (const [key, value] of Object.entries(options.dataset)) {
      if (value !== undefined) {
        element.dataset[key] = value;
      }
    }
  }
  if (options.onClick) {
    element.addEventListener("click", (event) => options.onClick?.(event as MouseEvent));
  }
  for (const child of children) {
    if (child === null || child === undefined || child === false) {
      continue;
    }
    element.append(child);
  }
  return element;
}
