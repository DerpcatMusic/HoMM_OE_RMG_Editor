import { mount } from "svelte";
import App from "./App.svelte";
import "./styles/index.css";

const target = document.getElementById("app");
if (target) {
  mount(App, { target });
}
