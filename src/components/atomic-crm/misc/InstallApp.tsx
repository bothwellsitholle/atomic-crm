import { Download, Share, SquarePlus } from "lucide-react";
import { useTranslate, useUserMenu } from "ra-core";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// Chrome fires beforeinstallprompt once, early, so it is captured as soon as
// this module loads and kept until the user asks to install.
let deferredPrompt: BeforeInstallPromptEvent | null = null;
// The help dialog lives outside the menu that opens it, so its state does too.
let dialogOpen = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notify();
  });
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const setDialogOpen = (open: boolean) => {
  dialogOpen = open;
  notify();
};

const install = async () => {
  if (!deferredPrompt) {
    setDialogOpen(true);
    return;
  }
  await deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  notify();
};

const useIsInstalled = () => {
  useSyncExternalStore(subscribe, () => deferredPrompt);
  return isStandalone();
};

/** Rendered once per layout; shows how to install when the browser can't prompt. */
export const InstallAppDialog = () => {
  const translate = useTranslate();
  const open = useSyncExternalStore(subscribe, () => dialogOpen);
  const ios = isIOS();
  const steps = ios
    ? [
        {
          Icon: Share,
          text: translate("crm.install.ios_step_share"),
        },
        {
          Icon: SquarePlus,
          text: translate("crm.install.ios_step_add"),
        },
      ]
    : [
        {
          Icon: Download,
          text: translate("crm.install.other_step"),
        },
      ];

  return (
    <Dialog open={open} onOpenChange={setDialogOpen}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{translate("crm.install.title")}</DialogTitle>
          <DialogDescription>
            {translate("crm.install.description")}
          </DialogDescription>
        </DialogHeader>
        <ol className="space-y-3">
          {steps.map(({ Icon, text }, index) => (
            <li key={text} className="flex items-start gap-3 text-sm">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {index + 1}
              </span>
              <span className="flex flex-1 items-center gap-2 pt-1">
                {text}
                <Icon className="size-4 shrink-0 text-muted-foreground" />
              </span>
            </li>
          ))}
        </ol>
      </DialogContent>
    </Dialog>
  );
};

export const InstallAppButton = () => {
  const translate = useTranslate();
  if (useIsInstalled()) return null;

  return (
    <Button
      variant="outline"
      className="w-full h-12 text-base"
      onClick={install}
    >
      <Download className="size-5 mr-3" />
      {translate("crm.install.action")}
    </Button>
  );
};

export const InstallAppMenuItem = () => {
  const translate = useTranslate();
  const userMenuContext = useUserMenu();
  if (useIsInstalled()) return null;

  return (
    <DropdownMenuItem
      className="flex items-center gap-2"
      onClick={() => {
        userMenuContext?.onClose();
        install();
      }}
    >
      <Download />
      {translate("crm.install.action")}
    </DropdownMenuItem>
  );
};
