import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { registerSW } from "virtual:pwa-register";

// Invite and password links that skip auth-callback.html land here as
// "#access_token=...". Supabase would sign the user in silently and they would
// never choose a password, so route them through the callback page instead.
if (/^#access_token=.*type=(invite|recovery)/.test(window.location.hash)) {
  window.location.replace(
    `${window.location.pathname}#/auth-callback?${window.location.hash.slice(1)}`,
  );
}

// After a new deploy, the service worker may replace its pre-cache while
// the page still holds old chunk references. A reload picks up the new
// HTML + new SW cache. A sessionStorage guard prevents infinite loops.
// See https://vite.dev/guide/build.html#load-error-handling
window.addEventListener("vite:preloadError", () => {
  const key = "chunk-reload";
  if (!sessionStorage.getItem(key)) {
    sessionStorage.setItem(key, "1");
    window.location.reload();
  }
});

// Reloads the page as soon as a new deploy is ready, and checks for one hourly
// so tabs left open don't stay on an old version.
registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (!registration) return;
    setInterval(() => registration.update(), 60 * 60 * 1000);
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
