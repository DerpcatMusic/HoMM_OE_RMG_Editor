import { mountAppShell } from "./components/appShell.js";

const root = document.querySelector<HTMLElement>("#app");

if (!root) {
  throw new Error("Missing #app mount point.");
}

mountAppShell(root);
