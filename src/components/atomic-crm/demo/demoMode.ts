// Kept in sessionStorage so demo mode ends with the browser tab.
const DEMO_MODE_KEY = "gerko-crm.demo-mode";

export const isDemoMode = () => {
  try {
    return sessionStorage.getItem(DEMO_MODE_KEY) === "true";
  } catch {
    return false;
  }
};

const switchMode = (demo: boolean) => {
  try {
    if (demo) {
      sessionStorage.setItem(DEMO_MODE_KEY, "true");
    } else {
      sessionStorage.removeItem(DEMO_MODE_KEY);
    }
  } catch {
    return;
  }
  window.location.hash = "/";
  window.location.reload();
};

export const enterDemoMode = () => switchMode(true);

export const exitDemoMode = () => switchMode(false);
